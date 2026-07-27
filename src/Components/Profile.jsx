import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppHeader from './AppHeader'
import BottomNav from './BottomNav'
import SuccessToast from './SuccessToast'
import { signOut } from '../lib/auth'
import {
  getCurrentProfile,
  updateProfile,
  getEmergencyContacts,
  addEmergencyContact,
  deleteEmergencyContact,
  getInitials,
} from '../lib/profile'
import { usePreferences } from '../lib/PreferencesContext'
import '../styles'

export default function Profile() {
  const navigate = useNavigate()
  const { darkMode, language, setDarkMode, setLanguage, t } = usePreferences()

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const [contacts, setContacts] = useState([])
  const [showAddContact, setShowAddContact] = useState(false)
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactPrimary, setContactPrimary] = useState(false)
  const [contactSaving, setContactSaving] = useState(false)

  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const showSuccess = (message) => {
    setToastMessage(message)
    setShowToast(true)
  }

  const handleMouseMove = (e) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`)
    card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`)
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { user, profile, error } = await getCurrentProfile()
      if (cancelled) return

      if (error || !user) {
        navigate('/', { replace: true })
        return
      }

      setUserId(user.id)
      setFullName(profile.full_name || '')
      setEmail(profile.email || user.email || '')
      setPhone(profile.phone || '')
      setAvatarUrl(profile.avatar_url || null)
      setEditName(profile.full_name || '')
      setEditPhone(profile.phone || '')

      const { data: contactList } = await getEmergencyContacts(user.id)
      if (!cancelled) setContacts(contactList || [])
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [navigate])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await signOut()
    navigate('/', { replace: true })
  }

  const handleSaveProfile = async () => {
    if (!userId) return
    setIsSaving(true)
    setErrorMessage('')

    const { data, error } = await updateProfile(userId, {
      full_name: editName.trim(),
      phone: editPhone.trim(),
    })

    setIsSaving(false)
    if (error) {
      setErrorMessage(error.message || 'Failed to update profile.')
      return
    }

    setFullName(data?.full_name || editName.trim())
    setPhone(data?.phone || editPhone.trim())
    setIsEditing(false)
    showSuccess(t('profile.updated'))
  }

  const handleToggleDarkMode = async () => {
    const { error } = await setDarkMode(!darkMode)
    if (error) setErrorMessage(t('profile.darkModeFail'))
  }

  const handleLanguageChange = async (e) => {
    const { error } = await setLanguage(e.target.value)
    if (error) {
      setErrorMessage(t('profile.languageFail'))
      return
    }
    showSuccess(t('profile.languageUpdated'))
  }

  const handleAddContact = async (e) => {
    e.preventDefault()
    if (!userId) return
    if (!contactName.trim() || !contactPhone.trim()) {
      setErrorMessage(t('profile.contactRequired'))
      return
    }

    setContactSaving(true)
    setErrorMessage('')

    const { data, error } = await addEmergencyContact(userId, {
      name: contactName,
      phone: contactPhone,
      is_primary: contactPrimary || contacts.length === 0,
    })

    setContactSaving(false)
    if (error) {
      setErrorMessage(error.message || 'Failed to add contact.')
      return
    }

    setContacts((prev) => {
      const next = contactPrimary
        ? prev.map((c) => ({ ...c, is_primary: false }))
        : [...prev]
      return [...next, data]
    })
    setContactName('')
    setContactPhone('')
    setContactPrimary(false)
    setShowAddContact(false)
    showSuccess(t('profile.contactAdded'))
  }

  const handleDeleteContact = async (contactId) => {
    const { error } = await deleteEmergencyContact(contactId)
    if (error) {
      setErrorMessage(error.message || 'Failed to delete contact.')
      return
    }
    setContacts((prev) => prev.filter((c) => c.id !== contactId))
    showSuccess(t('profile.contactRemoved'))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center font-sans">
        <p className="text-sm font-semibold text-[#5b403d]">{t('profile.loading')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen font-sans mb-24 md:mb-0 bg-[#f9f9f9] text-[#1a1c1c]">
      <SuccessToast
        message={toastMessage}
        visible={showToast}
        onHide={() => setShowToast(false)}
      />

      <AppHeader showBack backTo="/dashboard">
        <span className="text-xs font-bold tracking-wider text-[#5b403d] uppercase hidden md:block">
          {t('profile.myAccount')}
        </span>
        <span className="material-symbols-outlined text-[#af101a] !text-[24px]">
          account_circle
        </span>
      </AppHeader>

      <main className="max-w-[1200px] mx-auto px-4 pt-20 pb-6 md:pb-8">
        <header className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a1c1c]">
            {t('profile.title')}
          </h2>
          <p className="text-sm text-[#5b403d] mt-1">{t('profile.subtitle')}</p>
        </header>

        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-[#ffdad6] px-4 py-3 text-sm text-[#93000a]">
            <span className="material-symbols-outlined !text-[20px]">warning</span>
            <span className="flex-1">{errorMessage}</span>
            <button type="button" className="font-bold" onClick={() => setErrorMessage('')}>
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <section
            onMouseMove={handleMouseMove}
            className="md:col-span-8 bento-card rounded-xl p-6 flex flex-col items-center gap-6 border-t-2 border-[#af101a] md:flex-row"
          >
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#eeeeee] flex-shrink-0 bg-[#ffdad6] flex items-center justify-center">
              {avatarUrl ? (
                <img className="w-full h-full object-cover" alt={`${fullName} profile`} src={avatarUrl} />
              ) : (
                <span className="text-3xl font-bold text-[#af101a]">{getInitials(fullName)}</span>
              )}
            </div>

            <div className="flex-1 text-center md:text-left w-full">
              {isEditing ? (
                <div className="space-y-3 text-left">
                  <div>
                    <label className="text-xs font-bold text-[#5b403d] uppercase tracking-wider">
                      {t('profile.fullName')}
                    </label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#8f6f6c] bg-[#f9f9f9] p-3 text-sm outline-none focus:border-[#005faf]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#5b403d] uppercase tracking-wider">
                      {t('profile.phone')}
                    </label>
                    <input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+63 9XX XXX XXXX"
                      className="mt-1 w-full rounded-lg border border-[#8f6f6c] bg-[#f9f9f9] p-3 text-sm outline-none focus:border-[#005faf]"
                    />
                  </div>
                  <p className="text-sm text-[#5b403d]">{email}</p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="px-4 py-2 bg-[#005faf] text-white rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-60"
                    >
                      {isSaving ? t('common.saving') : t('common.save')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false)
                        setEditName(fullName)
                        setEditPhone(phone)
                      }}
                      className="px-4 py-2 border border-[#8f6f6c] text-[#5b403d] rounded-lg text-xs font-bold uppercase tracking-wider"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-[#1a1c1c]">
                    {fullName || t('common.user')}
                  </h3>
                  <p className="text-base text-[#5b403d]">{email}</p>
                  {phone ? <p className="text-sm text-[#5b403d] mt-1">{phone}</p> : null}
                  <div className="mt-4 flex flex-wrap gap-3 justify-center md:justify-start">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 border border-[#005faf] text-[#005faf] rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#005faf] hover:text-white transition-colors"
                    >
                      {t('profile.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="px-4 py-2 border border-[#8f6f6c] text-[#5b403d] rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#e2e2e2] transition-colors disabled:opacity-60"
                    >
                      {isLoggingOut ? t('profile.loggingOut') : t('profile.logout')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>

          <section
            onMouseMove={handleMouseMove}
            className="md:col-span-4 bento-card rounded-xl p-6 flex flex-col gap-4"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#005faf]">settings</span>
              <h3 className="text-xl font-semibold text-[#1a1c1c]">{t('profile.preferences')}</h3>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-[#eeeeee]">
              <span className="text-base">{t('profile.darkMode')}</span>
              <button
                type="button"
                aria-label={t('profile.darkMode')}
                onClick={handleToggleDarkMode}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  darkMode ? 'bg-[#af101a]' : 'bg-[#eeeeee]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    darkMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex flex-col gap-1 pt-3">
              <label
                htmlFor="language-select"
                className="text-xs font-bold text-[#5b403d] uppercase tracking-wider"
              >
                {t('profile.language')}
              </label>
              <select
                id="language-select"
                value={language}
                onChange={handleLanguageChange}
                className="bg-[#f9f9f9] border border-[#8f6f6c] rounded-lg p-3 text-sm focus:border-[#005faf] outline-none"
              >
                <option value="en">{t('profile.langEn')}</option>
                <option value="ph">{t('profile.langPh')}</option>
              </select>
            </div>
          </section>

          <section
            onMouseMove={handleMouseMove}
            className="md:col-span-7 bento-card rounded-xl p-6 border-t-2 border-[#ba1a1a]"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#ba1a1a]">emergency</span>
                <h3 className="text-xl font-semibold text-[#1a1c1c]">{t('profile.contacts')}</h3>
              </div>
              <button
                type="button"
                aria-label={t('profile.addContact')}
                onClick={() => setShowAddContact((v) => !v)}
                className="text-[#af101a] hover:bg-[#d32f2f]/10 p-2 rounded-full transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined">
                  {showAddContact ? 'close' : 'add_circle'}
                </span>
              </button>
            </div>

            <p className="text-sm text-[#5b403d] mb-4">{t('profile.contactsDesc')}</p>

            {showAddContact && (
              <form onSubmit={handleAddContact} className="mb-4 space-y-3 rounded-xl bg-[#f3f3f3] p-4">
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder={t('profile.contactName')}
                  className="w-full rounded-lg border border-[#8f6f6c] bg-white p-3 text-sm outline-none focus:border-[#005faf]"
                  required
                />
                <input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder={t('profile.contactPhone')}
                  className="w-full rounded-lg border border-[#8f6f6c] bg-white p-3 text-sm outline-none focus:border-[#005faf]"
                  required
                />
                <label className="flex items-center gap-2 text-sm text-[#5b403d]">
                  <input
                    type="checkbox"
                    checked={contactPrimary}
                    onChange={(e) => setContactPrimary(e.target.checked)}
                  />
                  {t('profile.setPrimary')}
                </label>
                <button
                  type="submit"
                  disabled={contactSaving}
                  className="w-full rounded-lg bg-[#af101a] py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {contactSaving ? t('profile.adding') : t('profile.addContact')}
                </button>
              </form>
            )}

            <div className="space-y-3">
              {contacts.length === 0 ? (
                <p className="text-sm text-[#5b403d] italic">{t('profile.noContacts')}</p>
              ) : (
                contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-4 bg-[#f3f3f3] rounded-xl gap-3"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          contact.is_primary ? 'bg-[#ffdad6]' : 'bg-[#d4e3ff]'
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined ${
                            contact.is_primary ? 'text-[#af101a]' : 'text-[#005faf]'
                          }`}
                        >
                          person
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base font-bold text-[#1a1c1c] truncate">{contact.name}</h4>
                        <p className="text-sm text-[#5b403d]">{contact.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {contact.is_primary && (
                        <span className="px-3 py-1 bg-[#d32f2f]/10 text-[#af101a] text-[10px] font-bold rounded-full uppercase">
                          {t('profile.primary')}
                        </span>
                      )}
                      <button
                        type="button"
                        aria-label={`Delete ${contact.name}`}
                        onClick={() => handleDeleteContact(contact.id)}
                        className="p-1 text-[#5b403d] hover:text-[#af101a]"
                      >
                        <span className="material-symbols-outlined !text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section
            onMouseMove={handleMouseMove}
            className="md:col-span-5 bento-card rounded-xl p-6 flex flex-col gap-4"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#11651d]">help_center</span>
              <h3 className="text-xl font-semibold text-[#1a1c1c]">{t('profile.support')}</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <a
                href="#documentation"
                className="flex items-center gap-4 p-4 hover:bg-[#eeeeee] rounded-xl transition-colors group"
              >
                <span className="material-symbols-outlined text-[#5b403d] group-hover:text-[#af101a]">
                  description
                </span>
                <div className="flex-1">
                  <h4 className="text-base font-bold text-[#1a1c1c]">{t('profile.docs')}</h4>
                  <p className="text-sm text-[#5b403d]">{t('profile.docsDesc')}</p>
                </div>
                <span className="material-symbols-outlined text-[#8f6f6c]">chevron_right</span>
              </a>
            </div>
            <div className="mt-auto pt-4 border-t border-[#eeeeee] text-center">
              <p className="text-sm text-[#5b403d] opacity-60">{t('profile.version')}</p>
            </div>
          </section>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
