import { supabase } from './supabase'

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  return { user, error }
}

export async function getCurrentProfile() {
  const { user, error: userError } = await getCurrentUser()
  if (userError || !user) {
    return { user: null, profile: null, error: userError || new Error('Not authenticated') }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  // Fallback display values from auth metadata (Google)
  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User'

  const avatarUrl =
    profile?.avatar_url ||
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null

  return {
    user,
    profile: profile
      ? { ...profile, full_name: displayName, avatar_url: avatarUrl }
      : {
          id: user.id,
          full_name: displayName,
          email: user.email,
          avatar_url: avatarUrl,
          phone: '',
          language: 'en',
          dark_mode: false,
          password_set: false,
        },
    error,
  }
}

export async function updateProfile(userId, updates) {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('*')
    .maybeSingle()

  return { data, error }
}

export async function getEmergencyContacts(userId) {
  const { data, error } = await supabase
    .from('emergency_contacts')
    .select('*')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })

  return { data: data || [], error }
}

export async function addEmergencyContact(userId, { name, phone, is_primary = false }) {
  if (is_primary) {
    await supabase
      .from('emergency_contacts')
      .update({ is_primary: false })
      .eq('user_id', userId)
  }

  const { data, error } = await supabase
    .from('emergency_contacts')
    .insert({
      user_id: userId,
      name: name.trim(),
      phone: phone.trim(),
      is_primary,
    })
    .select('*')
    .single()

  return { data, error }
}

export async function deleteEmergencyContact(contactId) {
  const { error } = await supabase
    .from('emergency_contacts')
    .delete()
    .eq('id', contactId)

  return { error }
}

export function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}
