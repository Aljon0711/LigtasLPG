import alarmSoundUrl from '../assets/mixkit-sound-alert-in-hall-1006.wav'

let alarmAudio = null
let vibrateTimer = null
let continuousVibrateTimer = null
let isContinuous = false

function getAlarmAudio() {
  if (typeof Audio === 'undefined') return null
  if (!alarmAudio) {
    alarmAudio = new Audio(alarmSoundUrl)
    alarmAudio.preload = 'auto'
    alarmAudio.volume = 1
  }
  return alarmAudio
}

function clearVibrateTimers() {
  if (vibrateTimer != null) {
    window.clearTimeout(vibrateTimer)
    vibrateTimer = null
  }
  if (continuousVibrateTimer != null) {
    window.clearInterval(continuousVibrateTimer)
    continuousVibrateTimer = null
  }
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(0)
    }
  } catch {
    // ignore
  }
}

/**
 * Must be called synchronously inside a click/tap handler when possible.
 */
export function vibrateAlarm(pattern = [400, 120, 400, 120, 400, 120, 700]) {
  try {
    if (typeof navigator === 'undefined') return false
    if (typeof navigator.vibrate !== 'function') return false
    navigator.vibrate(0)
    return Boolean(navigator.vibrate(pattern))
  } catch {
    return false
  }
}

export function stopAlarmSound() {
  isContinuous = false
  clearVibrateTimers()
  const audio = getAlarmAudio()
  if (!audio) return
  try {
    audio.loop = false
    audio.pause()
    audio.currentTime = 0
  } catch {
    // ignore
  }
}

export async function playAlarmSound({ loop = false } = {}) {
  const audio = getAlarmAudio()
  if (!audio) return false

  try {
    audio.loop = loop
    audio.pause()
    audio.currentTime = 0
    audio.volume = 1
    const playPromise = audio.play()
    if (playPromise) await playPromise
    return true
  } catch {
    try {
      audio.load()
      audio.loop = loop
      await audio.play()
      return true
    } catch {
      return false
    }
  }
}

/** One-shot feedback for Test Alarm button. */
export async function triggerAlarmFeedback() {
  clearVibrateTimers()
  vibrateAlarm([450, 100, 450, 100, 450, 100, 450, 100, 800])
  await playAlarmSound({ loop: false })
  vibrateTimer = window.setTimeout(() => {
    vibrateAlarm([300, 80, 300, 80, 500])
    vibrateTimer = null
  }, 300)
}

/** Continuous alarm for Emergency Alert page. */
export async function startContinuousAlarm() {
  isContinuous = true
  clearVibrateTimers()
  vibrateAlarm([400, 100, 400, 100, 400, 100, 700])
  continuousVibrateTimer = window.setInterval(() => {
    if (!isContinuous) return
    vibrateAlarm([400, 100, 400, 100, 700])
  }, 1800)
  const ok = await playAlarmSound({ loop: true })
  if (!ok && isContinuous) {
    // Autoplay may be blocked — retry shortly (and again on user tap via ensureAlarmPlaying)
    window.setTimeout(() => {
      if (isContinuous) void playAlarmSound({ loop: true })
    }, 400)
  }
  return ok
}

/** Call on first tap/hold on Alert if autoplay was blocked. */
export function ensureAlarmPlaying() {
  if (!isContinuous) return
  const audio = getAlarmAudio()
  if (!audio) return
  if (audio.paused || audio.ended) {
    audio.loop = true
    void audio.play().catch(() => {})
  }
  vibrateAlarm([400, 100, 400, 100, 700])
}

export function stopContinuousAlarm() {
  stopAlarmSound()
}
