const STORAGE_KEY = 'ligtas_prefs'

export const LANG_EN = 'en'
export const LANG_PH = 'ph'

const dictionaries = {
  en: {
    // Common / nav
    'nav.home': 'Home',
    'nav.logs': 'Logs',
    'nav.settings': 'Settings',
    'nav.back': 'Go back',
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.saving': 'Saving...',
    'common.user': 'User',
    'brand.tagline': 'Safety you can sense',
    'splash.checking': 'Checking session…',
    'splash.restoring': 'Restoring your stay signed-in session if still valid.',

    // Sign in
    'signin.subtitle': 'Reliable monitoring for your household safety.',
    'signin.welcome': 'Welcome Back',
    'signin.description':
      'Sign in to your account to monitor your LPG status in real-time.',
    'signin.email': 'EMAIL ADDRESS',
    'signin.password': 'PASSWORD',
    'signin.forgot': 'FORGOT PASSWORD?',
    'signin.stay': 'Stay signed in for {days} days (testing)',
    'signin.submit': 'Sign In',
    'signin.signingIn': 'Signing in...',
    'signin.or': 'OR',
    'signin.google': 'Continue with Google',
    'signin.googleLoading': 'Connecting...',
    'signin.noAccount': "Don't have an account yet?",
    'signin.createAccount': 'Create an Account',
    'signin.monitoring': '24/7 MONITORING',
    'signin.copyright': '© 2024 LIGTASLPG IOT SOLUTIONS. ALL RIGHTS RESERVED.',
    'signin.success': 'Sign in successful',
    'signin.sessionExpired':
      'Your stay signed-in session expired. Please sign in again.',

    // Sign up
    'signup.headline1': 'Vigilant Monitoring',
    'signup.headline2': 'Reliable Safety.',
    'signup.description':
      'Create an account to connect your LigtasLPG IoT sensors and ensure your home or business is protected from gas leaks 24/7.',
    'signup.feature1Title': 'Always Protected',
    'signup.feature1Text': 'Continuous leak detection around the clock.',
    'signup.feature2Title': 'Instant Alerts',
    'signup.feature2Text': 'Get notified the moment something is wrong.',
    'signup.title': 'Create Account',
    'signup.subtitle': 'Join thousands of households staying safe with smart LPG monitoring.',
    'signup.fullName': 'Full Name',
    'signup.email': 'Email Address',
    'signup.password': 'Password',
    'signup.confirmPassword': 'Confirm Password',
    'signup.terms': 'I agree to the',
    'signup.termsLink': 'Terms & Privacy',
    'signup.submit': 'Sign Up',
    'signup.creating': 'Creating...',
    'signup.created': 'Account Created!',
    'signup.or': 'OR',
    'signup.google': 'Continue with Google',
    'signup.hasAccount': 'Already have an account?',
    'signup.signIn': 'Sign In',

    // Set password
    'setPassword.title': 'Set App Password',
    'setPassword.subtitle':
      'Create a password for LigtasLPG so you can also sign in with email.',
    'setPassword.password': 'Password',
    'setPassword.confirm': 'Confirm Password',
    'setPassword.submit': 'Save Password',
    'setPassword.saving': 'Saving...',

    // Dashboard
    'dashboard.online': 'Online',
    'dashboard.welcome': 'Welcome back,',
    'dashboard.statusTitle': 'System Status',
    'dashboard.statusOk': 'System Safe',
    'dashboard.statusDesc': 'Your LPG environment is safe and monitored.',
    'dashboard.gaugeLabel': 'Gas Level',
    'dashboard.flameTitle': 'Flame Status',
    'dashboard.flameInactive': 'Burner is currently inactive',
    'dashboard.testAlarm': 'Test Alarm',
    'dashboard.testingAlarm': 'Testing...',
    'dashboard.openValve': 'Open Valve',
    'dashboard.closeValve': 'Close Valve',
    'dashboard.emergency': 'Emergency',
    'dashboard.emergencyDesc': 'Call for immediate assistance',
    'dashboard.callNow': 'Call Now',

    // Logs
    'logs.title': 'Activity Logs',
    'logs.subtitle': 'Recent system events and alerts',
    'logs.empty': 'No logs yet.',
    'logs.filterAll': 'All',
    'logs.filterAlerts': 'Alerts',
    'logs.filterInfo': 'Info',

    // Settings
    'settings.title': 'Device Settings',
    'settings.subtitle': 'Configure your LigtasLPG device',
    'settings.sensitivity': 'Sensor Sensitivity',
    'settings.notifications': 'Notifications',
    'settings.push': 'Push Notifications',
    'settings.sms': 'SMS Alerts',
    'settings.signal': 'Signal Strength',
    'settings.strong': 'Strong',
    'settings.scanWifi': 'Scan Wi-Fi',
    'settings.scanningWifi': 'Scanning…',
    'settings.wifiNetworks': 'Available networks',
    'settings.wifiScanHint':
      'Device must be Online. ESP32 scans nearby networks and lists them here.',
    'settings.wifiScanOffline': 'Device is offline — connect ESP32 to Wi-Fi first.',
    'settings.wifiScanEmpty': 'No networks found yet. Tap Scan Wi-Fi.',
    'settings.wifiScanWaiting': 'Waiting for ESP32 scan results…',
    'settings.wifiPassword': 'Wi-Fi password',
    'settings.wifiConnect': 'Connect',
    'settings.wifiConnecting': 'Connecting…',
    'settings.wifiConnected': 'Connected to Wi-Fi',
    'settings.wifiConnectFailed': 'Could not connect — check the password.',
    'settings.wifiConnectHint': 'Tap a network, enter the password, then Connect.',
    'settings.wifiOpenNetwork': 'Open network (no password)',
    'settings.save': 'Save Changes',
    'settings.reset': 'Factory Reset',
    'settings.deviceInfo': 'Device Info',

    // Profile
    'profile.myAccount': 'MY ACCOUNT',
    'profile.title': 'My Account',
    'profile.subtitle': 'Manage your safety profile and app settings.',
    'profile.loading': 'Loading profile...',
    'profile.fullName': 'Full Name',
    'profile.phone': 'Phone',
    'profile.edit': 'Edit Profile',
    'profile.logout': 'Logout',
    'profile.loggingOut': 'Logging out...',
    'profile.preferences': 'Preferences',
    'profile.darkMode': 'Dark Mode',
    'profile.language': 'Language',
    'profile.langEn': 'English (US)',
    'profile.langPh': 'Filipino (Tagalog)',
    'profile.contacts': 'Emergency Contacts',
    'profile.contactsDesc':
      'These contacts will be notified immediately via SMS/Call in case of a gas leak detection.',
    'profile.contactName': 'Contact name',
    'profile.contactPhone': 'Phone number',
    'profile.setPrimary': 'Set as primary contact',
    'profile.addContact': 'Add Contact',
    'profile.adding': 'Adding...',
    'profile.noContacts': 'No emergency contacts yet. Tap + to add one.',
    'profile.primary': 'Primary',
    'profile.support': 'Support',
    'profile.docs': 'Documentation',
    'profile.docsDesc': 'Hardware & Software guides',
    'profile.version': 'LigtasLPG Version 2.1.0-stable',
    'profile.updated': 'Profile updated',
    'profile.languageUpdated': 'Language updated',
    'profile.contactAdded': 'Contact added',
    'profile.contactRemoved': 'Contact removed',
    'profile.darkModeFail': 'Failed to update dark mode.',
    'profile.languageFail': 'Failed to update language.',
    'profile.contactRequired': 'Contact name and phone are required.',

    // Alert
    'alert.title': 'EMERGENCY ALERT',
    'alert.subtitle': 'Gas leak detected — act immediately',
    'alert.call': 'Call Emergency Contact',
    'alert.dismiss': 'I am safe',

    // Terms
    'terms.title': 'Terms & Privacy',
    'terms.back': 'Back',
  },

  ph: {
    'nav.home': 'Home',
    'nav.logs': 'Mga Log',
    'nav.settings': 'Settings',
    'nav.back': 'Bumalik',
    'common.loading': 'Naglo-load...',
    'common.save': 'I-save',
    'common.cancel': 'Kanselahin',
    'common.saving': 'Sine-save...',
    'common.user': 'User',
    'brand.tagline': 'Kaligtasang nadarama',
    'splash.checking': 'Sine-check ang session…',
    'splash.restoring':
      'Ibinabalik ang stay signed-in session kung valid pa.',

    'signin.subtitle': 'Maasahang monitoring para sa kaligtasan ng inyong tahanan.',
    'signin.welcome': 'Maligayang Pagbabalik',
    'signin.description':
      'Mag-sign in para subaybayan ang status ng LPG ninyo nang real-time.',
    'signin.email': 'EMAIL ADDRESS',
    'signin.password': 'PASSWORD',
    'signin.forgot': 'NAKALIMUTAN ANG PASSWORD?',
    'signin.stay': 'Manatiling naka-sign in nang {days} araw (testing)',
    'signin.submit': 'Mag-sign In',
    'signin.signingIn': 'Nagsa-sign in...',
    'signin.or': 'O',
    'signin.google': 'Magpatuloy gamit ang Google',
    'signin.googleLoading': 'Kumokonekta...',
    'signin.noAccount': 'Wala ka pang account?',
    'signin.createAccount': 'Gumawa ng Account',
    'signin.monitoring': '24/7 NA MONITORING',
    'signin.copyright': '© 2024 LIGTASLPG IOT SOLUTIONS. LAHAT NG KARAPATAN AY NAKALAAN.',
    'signin.success': 'Matagumpay ang pag-sign in',
    'signin.sessionExpired':
      'Nag-expire na ang stay signed-in session. Mag-sign in ulit.',

    'signup.headline1': 'Maingat na Monitoring',
    'signup.headline2': 'Maasahang Kaligtasan.',
    'signup.description':
      'Gumawa ng account para ikonekta ang LigtasLPG IoT sensors at protektahan ang tahanan o negosyo laban sa gas leak 24/7.',
    'signup.feature1Title': 'Laging Protektado',
    'signup.feature1Text': 'Patuloy na pagtukoy ng leak buong araw.',
    'signup.feature2Title': 'Agad na Alerto',
    'signup.feature2Text': 'Maalerto ka sa sandaling may mali.',
    'signup.title': 'Gumawa ng Account',
    'signup.subtitle':
      'Sumali sa libu-libong tahanan na ligtas gamit ang smart LPG monitoring.',
    'signup.fullName': 'Buong Pangalan',
    'signup.email': 'Email Address',
    'signup.password': 'Password',
    'signup.confirmPassword': 'Kumpirmahin ang Password',
    'signup.terms': 'Sumasang-ayon ako sa',
    'signup.termsLink': 'Mga Tuntunin at Privacy',
    'signup.submit': 'Mag-sign Up',
    'signup.creating': 'Ginagawa...',
    'signup.created': 'Nagawa na ang Account!',
    'signup.or': 'O',
    'signup.google': 'Magpatuloy gamit ang Google',
    'signup.hasAccount': 'May account ka na?',
    'signup.signIn': 'Mag-sign In',

    'setPassword.title': 'Mag-set ng App Password',
    'setPassword.subtitle':
      'Gumawa ng password para sa LigtasLPG para makapag-sign in din gamit ang email.',
    'setPassword.password': 'Password',
    'setPassword.confirm': 'Kumpirmahin ang Password',
    'setPassword.submit': 'I-save ang Password',
    'setPassword.saving': 'Sine-save...',

    'dashboard.online': 'Online',
    'dashboard.welcome': 'Maligayang pagbabalik,',
    'dashboard.statusTitle': 'Status ng Sistema',
    'dashboard.statusOk': 'System Safe',
    'dashboard.statusDesc': 'Ligtas at naka-monitor ang LPG environment ninyo.',
    'dashboard.gaugeLabel': 'Antas ng Gas',
    'dashboard.flameTitle': 'Status ng Apoy',
    'dashboard.flameInactive': 'Kasalukuyang hindi aktibo ang burner',
    'dashboard.testAlarm': 'Subukan ang Alarm',
    'dashboard.testingAlarm': 'Sinusubukan...',
    'dashboard.openValve': 'Buksan ang Balbula',
    'dashboard.closeValve': 'Isara ang Balbula',
    'dashboard.emergency': 'Emerhensya',
    'dashboard.emergencyDesc': 'Tumawag para sa agarang tulong',
    'dashboard.callNow': 'Tumawag Ngayon',

    'logs.title': 'Mga Log ng Aktibidad',
    'logs.subtitle': 'Mga kamakailang event at alerto ng sistema',
    'logs.empty': 'Wala pang mga log.',
    'logs.filterAll': 'Lahat',
    'logs.filterAlerts': 'Mga Alerto',
    'logs.filterInfo': 'Impormasyon',

    'settings.title': 'Mga Setting ng Device',
    'settings.subtitle': 'I-configure ang LigtasLPG device ninyo',
    'settings.sensitivity': 'Sensitivity ng Sensor',
    'settings.notifications': 'Mga Notification',
    'settings.push': 'Push Notifications',
    'settings.sms': 'SMS Alerts',
    'settings.signal': 'Lakas ng Signal',
    'settings.strong': 'Malakas',
    'settings.scanWifi': 'I-scan ang Wi-Fi',
    'settings.scanningWifi': 'Nag-scan…',
    'settings.wifiNetworks': 'Mga available na network',
    'settings.wifiScanHint':
      'Kailangang Online ang device. Mag-scan ang ESP32 ng nearby networks at ililista dito.',
    'settings.wifiScanOffline': 'Offline ang device — ikonekta muna ang ESP32 sa Wi-Fi.',
    'settings.wifiScanEmpty': 'Wala pang networks. Pindutin ang I-scan ang Wi-Fi.',
    'settings.wifiScanWaiting': 'Naghihintay sa resulta ng ESP32 scan…',
    'settings.wifiPassword': 'Password ng Wi-Fi',
    'settings.wifiConnect': 'Kumonekta',
    'settings.wifiConnecting': 'Kumokonekta…',
    'settings.wifiConnected': 'Nakakonekta na sa Wi-Fi',
    'settings.wifiConnectFailed': 'Hindi makakonekta — tingnan ang password.',
    'settings.wifiConnectHint': 'Piliin ang network, ilagay ang password, tapos Connect.',
    'settings.wifiOpenNetwork': 'Open network (walang password)',
    'settings.save': 'I-save ang Pagbabago',
    'settings.reset': 'Factory Reset',
    'settings.deviceInfo': 'Impormasyon ng Device',

    'profile.myAccount': 'AKING ACCOUNT',
    'profile.title': 'Aking Account',
    'profile.subtitle': 'I-manage ang safety profile at settings ng app.',
    'profile.loading': 'Naglo-load ang profile...',
    'profile.fullName': 'Buong Pangalan',
    'profile.phone': 'Telepono',
    'profile.edit': 'I-edit ang Profile',
    'profile.logout': 'Mag-logout',
    'profile.loggingOut': 'Naglo-logout...',
    'profile.preferences': 'Mga Preference',
    'profile.darkMode': 'Dark Mode',
    'profile.language': 'Wika',
    'profile.langEn': 'English (US)',
    'profile.langPh': 'Filipino (Tagalog)',
    'profile.contacts': 'Mga Emergency Contact',
    'profile.contactsDesc':
      'Aalerto agad ang mga contact na ito sa SMS/Tawag kapag may natukoy na gas leak.',
    'profile.contactName': 'Pangalan ng contact',
    'profile.contactPhone': 'Numero ng telepono',
    'profile.setPrimary': 'Gawing primary contact',
    'profile.addContact': 'Magdagdag ng Contact',
    'profile.adding': 'Idinadagdag...',
    'profile.noContacts':
      'Wala pang emergency contact. Pindutin ang + para magdagdag.',
    'profile.primary': 'Primary',
    'profile.support': 'Suporta',
    'profile.docs': 'Dokumentasyon',
    'profile.docsDesc': 'Mga gabay sa Hardware at Software',
    'profile.version': 'LigtasLPG Bersyon 2.1.0-stable',
    'profile.updated': 'Na-update ang profile',
    'profile.languageUpdated': 'Na-update ang wika',
    'profile.contactAdded': 'Naidagdag ang contact',
    'profile.contactRemoved': 'Inalis ang contact',
    'profile.darkModeFail': 'Hindi na-update ang dark mode.',
    'profile.languageFail': 'Hindi na-update ang wika.',
    'profile.contactRequired': 'Kailangan ang pangalan at numero ng contact.',

    'alert.title': 'ALERTO NG EMERHENSYA',
    'alert.subtitle': 'May natukoy na gas leak — kumilos agad',
    'alert.call': 'Tawagan ang Emergency Contact',
    'alert.dismiss': 'Okay lang ako',

    'terms.title': 'Mga Tuntunin at Privacy',
    'terms.back': 'Bumalik',
  },
}

export function translate(language, key, vars = {}) {
  const lang = language === LANG_PH ? LANG_PH : LANG_EN
  let text = dictionaries[lang][key] ?? dictionaries.en[key] ?? key
  Object.entries(vars).forEach(([k, v]) => {
    text = text.replaceAll(`{${k}}`, String(v))
  })
  return text
}

export function readStoredPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { darkMode: false, language: LANG_EN }
    const parsed = JSON.parse(raw)
    return {
      darkMode: Boolean(parsed.darkMode),
      language: parsed.language === LANG_PH ? LANG_PH : LANG_EN,
    }
  } catch {
    return { darkMode: false, language: LANG_EN }
  }
}

export function writeStoredPrefs(prefs) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      darkMode: Boolean(prefs.darkMode),
      language: prefs.language === LANG_PH ? LANG_PH : LANG_EN,
    })
  )
}

export function applyDarkClass(darkMode) {
  document.documentElement.classList.toggle('dark', Boolean(darkMode))
  document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light'
}
