/**
 * textbee.dev SMS Gateway API
 * Docs: https://textbee.dev/docs
 *
 * Uses your Android phone + SIM as the SMS gateway (prepaid load / promo).
 *
 * GET  /api/v1/gateway/devices   — list gateway devices / online status
 * POST /api/v1/gateway/send-sms  — send SMS via the linked Android phone
 */

const TEXTBEE_BASE = 'https://api.textbee.dev/api/v1/gateway'

function getApiKey() {
  return String(import.meta.env.VITE_TEXTBEE_API_KEY || '').trim()
}

function getDeviceId() {
  return String(import.meta.env.VITE_TEXTBEE_DEVICE_ID || '').trim()
}

export function isSmsConfigured() {
  return Boolean(getApiKey())
}

/** Normalize to E.164 (+63…) for PH numbers when possible. */
export function normalizePhone(phone) {
  if (!phone) return ''
  let digits = String(phone).replace(/[^\d+]/g, '')
  if (digits.startsWith('+')) digits = digits.slice(1)
  if (digits.startsWith('0') && digits.length >= 11) {
    digits = `63${digits.slice(1)}`
  }
  if (!digits) return ''
  return digits.startsWith('+') ? digits : `+${digits}`
}

async function parseJsonSafe(response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

function authHeaders() {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-api-key': getApiKey(),
  }
}

/**
 * GET gateway devices (status for Settings UI).
 * @returns {{ data: object|null, error: Error|null }}
 */
export async function getSmsAccount() {
  const apikey = getApiKey()
  if (!apikey) {
    return {
      data: null,
      error: new Error(
        'SMS API key missing. Add VITE_TEXTBEE_API_KEY to your .env file.'
      ),
    }
  }

  try {
    const response = await fetch(`${TEXTBEE_BASE}/devices`, {
      method: 'GET',
      headers: authHeaders(),
    })

    const json = await parseJsonSafe(response)

    if (!response.ok) {
      const message =
        json?.message ||
        json?.error ||
        (typeof json?.raw === 'string' ? json.raw : null) ||
        `SMS gateway request failed (${response.status})`
      return { data: null, error: new Error(message) }
    }

    const list = Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.devices)
          ? json.devices
          : json
            ? [json]
            : []

    const preferredId = getDeviceId()
    const selected =
      (preferredId &&
        list.find(
          (d) =>
            d?._id === preferredId ||
            d?.id === preferredId ||
            d?.deviceId === preferredId
        )) ||
      list[0] ||
      null

    if (!selected) {
      return {
        data: {
          status: 'No device',
          device_count: 0,
          label: 'Register an Android phone in textbee.dev',
        },
        error: null,
      }
    }

    const name =
      selected.brand ||
      selected.model ||
      selected.name ||
      selected.deviceName ||
      'Android gateway'

    // Only treat as online if heartbeat/last seen is recent.
    // (Old lastSeenAt still exists after force-closing TextBee — that is NOT online.)
    const ONLINE_MS = 3 * 60 * 1000
    const seenRaw =
      selected.lastHeartbeatAt ||
      selected.lastHeartbeat ||
      selected.lastSeenAt ||
      selected.updatedAt ||
      selected.last_seen_at
    const seenAt = seenRaw ? new Date(seenRaw).getTime() : NaN
    const recentlySeen =
      Number.isFinite(seenAt) && Date.now() - seenAt <= ONLINE_MS

    const online =
      selected.enabled !== false &&
      (selected.isOnline === true ||
        selected.online === true ||
        selected.status === 'online' ||
        recentlySeen)

    const statusLabel = online
      ? 'Online'
      : recentlySeen === false && Number.isFinite(seenAt)
        ? 'Offline — reopen TextBee'
        : 'Offline / check phone'

    return {
      data: {
        ...selected,
        // Fields used by Settings UI
        credit_balance: statusLabel,
        balance: statusLabel,
        status: online ? 'online' : 'offline',
        label: name,
        device_count: list.length,
        last_seen_label: Number.isFinite(seenAt)
          ? new Date(seenAt).toLocaleTimeString()
          : null,
      },
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error : new Error('Failed to reach TextBee API'),
    }
  }
}

/**
 * POST send SMS via TextBee Android gateway.
 * @param {{ number?: string, recipients?: string[], message: string }} opts
 * @returns {{ data: object|null, error: Error|null }}
 */
export async function sendSms({ number, recipients, message } = {}) {
  const apikey = getApiKey()
  if (!apikey) {
    return {
      data: null,
      error: new Error(
        'SMS API key missing. Add VITE_TEXTBEE_API_KEY to your .env file.'
      ),
    }
  }

  const list = (recipients?.length
    ? recipients
    : number
      ? [number]
      : []
  )
    .map((n) => normalizePhone(n))
    .filter(Boolean)

  const bodyMessage = String(message || '').trim()

  if (list.length === 0) {
    return { data: null, error: new Error('A valid phone number is required.') }
  }
  if (!bodyMessage) {
    return { data: null, error: new Error('Message text is required.') }
  }

  const payload = {
    recipients: list,
    message: bodyMessage,
  }

  const deviceId = getDeviceId()
  if (deviceId) payload.deviceId = deviceId

  try {
    const response = await fetch(`${TEXTBEE_BASE}/send-sms`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })

    const json = await parseJsonSafe(response)

    if (!response.ok) {
      const messageText =
        json?.message ||
        json?.error ||
        (Array.isArray(json) && json[0]?.message) ||
        (typeof json?.raw === 'string' ? json.raw : null) ||
        `SMS send failed (${response.status})`
      return { data: null, error: new Error(messageText) }
    }

    return { data: json, error: null }
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error ? error : new Error('Failed to reach TextBee API'),
    }
  }
}

/**
 * Send LPG emergency SMS to one or more contacts.
 */
export async function sendEmergencySmsAlerts({
  contacts = [],
  pressureKpa,
  hardwareId,
} = {}) {
  const recipientContacts = (contacts || [])
    .map((c) => ({ name: c.name, phone: normalizePhone(c.phone) }))
    .filter((c) => c.phone)

  if (recipientContacts.length === 0) {
    return {
      sent: [],
      errors: [new Error('No emergency contacts with valid phone numbers.')],
    }
  }

  const pressure =
    pressureKpa == null || Number.isNaN(Number(pressureKpa))
      ? 'n/a'
      : `${Number(pressureKpa).toFixed(1)} kPa`

  const deviceLabel = hardwareId || 'LigtasLPG device'
  const message =
    `LigtasLPG ALERT: Possible gas leak on ${deviceLabel}. ` +
    `Pressure: ${pressure}. Check the area and open the app immediately.`

  const { data, error } = await sendSms({
    recipients: recipientContacts.map((c) => c.phone),
    message,
  })

  if (error) {
    return {
      sent: [],
      errors: [error],
    }
  }

  return {
    sent: recipientContacts.map((contact) => ({ contact, data })),
    errors: [],
  }
}
