const MINIMIZED_KEY = 'ligtas_alert_minimized'
const NOTIFIED_KEY = 'ligtas_alert_notified_id'

export function isAlertMinimized() {
  try {
    return sessionStorage.getItem(MINIMIZED_KEY) === '1'
  } catch {
    return false
  }
}

export function setAlertMinimized(value) {
  try {
    if (value) sessionStorage.setItem(MINIMIZED_KEY, '1')
    else sessionStorage.removeItem(MINIMIZED_KEY)
  } catch {
    /* ignore */
  }
}

export function clearAlertSession() {
  try {
    sessionStorage.removeItem(MINIMIZED_KEY)
    sessionStorage.removeItem(NOTIFIED_KEY)
  } catch {
    /* ignore */
  }
}

export function getLastNotifiedDeviceKey() {
  try {
    return sessionStorage.getItem(NOTIFIED_KEY) || ''
  } catch {
    return ''
  }
}

export function setLastNotifiedDeviceKey(key) {
  try {
    if (key) sessionStorage.setItem(NOTIFIED_KEY, key)
    else sessionStorage.removeItem(NOTIFIED_KEY)
  } catch {
    /* ignore */
  }
}
