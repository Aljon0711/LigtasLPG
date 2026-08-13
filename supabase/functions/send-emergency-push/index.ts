// Supabase Edge Function: send FCM push when a device becomes critical.
// Deploy: supabase functions deploy send-emergency-push --no-verify-jwt
// Secrets:
//   FIREBASE_SERVICE_ACCOUNT = full JSON of Firebase service account
//   FIREBASE_PROJECT_ID = your Firebase project id (optional if in JSON)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

type ServiceAccount = {
  project_id?: string
  client_email: string
  private_key: string
}

function base64Url(input: string | ArrayBuffer) {
  const bytes =
    typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input)
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function getAccessToken(sa: ServiceAccount) {
  const now = Math.floor(Date.now() / 1000)
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = base64Url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  )
  const unsigned = `${header}.${claim}`

  const pem = sa.private_key.replace(/\\n/g, '\n')
  const pemBody = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '')
  const raw = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0))

  const key = await crypto.subtle.importKey(
    'pkcs8',
    raw,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsigned)
  )
  const jwt = `${unsigned}.${base64Url(signature)}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const tokenJson = await tokenRes.json()
  if (!tokenRes.ok) {
    throw new Error(tokenJson.error_description || 'Failed to get Google access token')
  }
  return tokenJson.access_token as string
}

async function sendFcm(
  projectId: string,
  accessToken: string,
  token: string,
  title: string,
  body: string
) {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      // Data-only message so our native EmergencyMessagingService runs
      // even when the app is killed (needed for Full-Screen Intent).
      body: JSON.stringify({
        message: {
          token,
          data: {
            route: '/alert',
            type: 'emergency',
            title,
            body,
          },
          android: {
            priority: 'HIGH',
            ttl: '3600s',
          },
        },
      }),
    }
  )
  const json = await res.json()
  return { ok: res.ok, json }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    // Supports Supabase Database Webhook shape and direct test calls
    const record = payload.record || payload.new || payload.data?.record || payload
    const old = payload.old_record || payload.old || payload.data?.old_record || null

    const isCritical =
      record?.system_status === 'critical' || record?.emergency_latched === true
    const wasCritical =
      old?.system_status === 'critical' || old?.emergency_latched === true
    const becameCritical = isCritical && !wasCritical

    // Allow manual test: { "force": true, "user_id": "..." }
    const force = Boolean(payload.force)
    const userId = record?.user_id || payload.user_id

    // If webhook has no old_record, still send when currently critical
    const shouldSend = force || becameCritical || (isCritical && !old)

    if (!shouldSend) {
      return new Response(
        JSON.stringify({
          skipped: true,
          reason: 'not-critical-transition',
          isCritical,
          wasCritical,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'missing user_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const saRaw = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')
    if (!saRaw) {
      return new Response(JSON.stringify({ error: 'FIREBASE_SERVICE_ACCOUNT secret missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const sa = JSON.parse(saRaw) as ServiceAccount
    const projectId =
      Deno.env.get('FIREBASE_PROJECT_ID') || sa.project_id || ''
    if (!projectId) {
      return new Response(JSON.stringify({ error: 'FIREBASE_PROJECT_ID missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: settings } = await supabase
      .from('device_settings')
      .select('notify_push')
      .eq('user_id', userId)
      .maybeSingle()

    if (settings && settings.notify_push === false && !force) {
      return new Response(JSON.stringify({ skipped: true, reason: 'notify_push_off' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: tokens, error: tokenError } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', userId)

    if (tokenError) throw tokenError
    if (!tokens?.length) {
      return new Response(JSON.stringify({ skipped: true, reason: 'no-tokens' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const accessToken = await getAccessToken(sa)
    const title = 'LigtasLPG Emergency'
    const body = `Gas leak alert on ${record?.hardware_id || 'your device'}. Open the app now.`

    const results = []
    for (const row of tokens) {
      results.push(await sendFcm(projectId, accessToken, row.token, title, body))
    }

    return new Response(JSON.stringify({ sent: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
