import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import '../styles';

export default function Profile() {
  const navigate = useNavigate();
  // --- State Management ---
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');

  // --- Dynamic Mouse Effect Handler ---
  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div className={`min-h-screen font-sans mb-24 md:mb-0 ${darkMode ? 'dark bg-[#2f3131] text-[#f1f1f1]' : 'bg-[#f9f9f9] text-[#1a1c1c]'}`}>
      <AppHeader showBack>
        <span className="text-xs font-bold tracking-wider text-[#5b403d] uppercase hidden md:block">
          MY ACCOUNT
        </span>
        <span className="material-symbols-outlined text-[#af101a] !text-[24px]">
          account_circle
        </span>
      </AppHeader>

      {/* Main Content Area */}
      <main className="max-w-[1200px] mx-auto px-4 pt-20 pb-6 md:pb-8">
        <header className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a1c1c]">
            My Account
          </h2>
          <p className="text-sm text-[#5b403d] mt-1">
            Manage your safety profile and app settings.
          </p>
        </header>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Profile Section */}
          <section 
            onMouseMove={handleMouseMove}
            className="md:col-span-8 bento-card rounded-xl p-6 flex flex-col items-center gap-6 border-t-2 border-[#af101a] md:flex-row"
          >
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#eeeeee] flex-shrink-0">
              <img 
                className="w-full h-full object-cover" 
                alt="Juan Dela Cruz profile" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgdB_s80XKNnzhvNX4fYh97PI5GEgoXJHUayMS21iwUFwxi_aE8TMrLBJncuUIukcx-Z3efNPEAwNqvGB6WvoZCsi5w2y5pN9esX8sHBlGhZO1pAJbt0HJDidSLv8hmjcvfe75oSah9q4sbJIhxTYojq_za7d7jgyEyu_JS5qsq8UBc9HfABuYRJgUWg5cYbFAEbt1Vo2uVrRBYpNccc_UNzb8EsQD_JSMXdcqDL6YmloBWuGwJGBXhz-n43156hQPjUdfekFmGAg" 
              />
            </div>
            <div className="flex-1 text-center md:text-left w-full">
              <h3 className="text-xl font-semibold text-[#1a1c1c]">Juan Dela Cruz</h3>
              <p className="text-base text-[#5b403d]">juan.delacruz@email.com</p>
              <div className="mt-4 flex flex-wrap gap-3 justify-center md:justify-start">
                <button 
                  type="button"
                  className="px-4 py-2 border border-[#005faf] text-[#005faf] rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#005faf] hover:text-white transition-colors"
                >
                  EDIT PROFILE
                </button>
                <button 
                  type="button"
                  onClick={() => navigate('/')}
                  className="px-4 py-2 border border-[#8f6f6c] text-[#5b403d] rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#e2e2e2] transition-colors"
                >
                  LOGOUT
                </button>
              </div>
            </div>
          </section>

          {/* App Preferences */}
          <section 
            onMouseMove={handleMouseMove}
            className="md:col-span-4 bento-card rounded-xl p-6 flex flex-col gap-4"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#005faf]">
                settings
              </span>
              <h3 className="text-xl font-semibold text-[#1a1c1c]">Preferences</h3>
            </div>

            {/* Dark Mode Toggle */}
            <div className="flex justify-between items-center py-3 border-b border-[#eeeeee]">
              <span className="text-base">Dark Mode</span>
              <button 
                type="button"
                aria-label="Toggle Dark Mode"
                onClick={() => setDarkMode(!darkMode)}
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

            {/* Language Selection */}
            <div className="flex flex-col gap-1 pt-3">
              <label htmlFor="language-select" className="text-xs font-bold text-[#5b403d] uppercase tracking-wider">
                LANGUAGE
              </label>
              <select 
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-[#f9f9f9] border border-[#8f6f6c] rounded-lg p-3 text-sm focus:border-[#005faf] outline-none"
              >
                <option value="en">English (US)</option>
                <option value="ph">Filipino (Tagalog)</option>
              </select>
            </div>
          </section>

          {/* Emergency Contacts */}
          <section 
            onMouseMove={handleMouseMove}
            className="md:col-span-7 bento-card rounded-xl p-6 border-t-2 border-[#ba1a1a]"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#ba1a1a]">
                  emergency
                </span>
                <h3 className="text-xl font-semibold text-[#1a1c1c]">Emergency Contacts</h3>
              </div>
              <button 
                type="button"
                aria-label="Add Contact"
                className="text-[#af101a] hover:bg-[#d32f2f]/10 p-2 rounded-full transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined">
                  add_circle
                </span>
              </button>
            </div>
            <p className="text-sm text-[#5b403d] mb-4">
              These contacts will be notified immediately via SMS/Call in case of a gas leak detection.
            </p>
            <div className="space-y-3">
              {/* Contact 1 */}
              <div className="flex items-center justify-between p-4 bg-[#f3f3f3] rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#ffdad6] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#af101a]">
                      person
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#1a1c1c]">Maria Dela Cruz</h4>
                    <p className="text-sm text-[#5b403d]">+63 917 123 4567</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-[#d32f2f]/10 text-[#af101a] text-[10px] font-bold rounded-full uppercase">
                  Primary
                </span>
              </div>

              {/* Contact 2 */}
              <div className="flex items-center justify-between p-4 bg-[#f3f3f3] rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#d4e3ff] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#005faf]">
                      person
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#1a1c1c]">Barangay Hall - Emergency</h4>
                    <p className="text-sm text-[#5b403d]">+63 2 8888 0000</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Support & Help */}
          <section 
            onMouseMove={handleMouseMove}
            className="md:col-span-5 bento-card rounded-xl p-6 flex flex-col gap-4"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#11651d]">
                help_center
              </span>
              <h3 className="text-xl font-semibold text-[#1a1c1c]">Support</h3>
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
                  <h4 className="text-base font-bold text-[#1a1c1c]">Documentation</h4>
                  <p className="text-sm text-[#5b403d]">Hardware &amp; Software guides</p>
                </div>
                <span className="material-symbols-outlined text-[#8f6f6c]">
                  chevron_right
                </span>
              </a>
            </div>
            <div className="mt-auto pt-4 border-t border-[#eeeeee] text-center">
              <p className="text-sm text-[#5b403d] opacity-60">
                LigtasLPG Version 2.1.0-stable
              </p>
            </div>
          </section>

        </div>
      </main>

      {/* Navigation Shell (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 bg-[#eeeeee] shadow-lg rounded-t-xl">
        <Link 
          to="/dashboard" 
          className="flex flex-col items-center justify-center text-[#5b403d] px-4 py-1 hover:bg-[#e2e2e2] transition-opacity"
        >
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-xs font-bold tracking-wider">Home</span>
        </Link>
        <Link 
          to="/logs" 
          className="flex flex-col items-center justify-center text-[#5b403d] px-4 py-1 hover:bg-[#e2e2e2] transition-opacity"
        >
          <span className="material-symbols-outlined">history</span>
          <span className="text-xs font-bold tracking-wider">Logs</span>
        </Link>
        <Link 
          to="/settings" 
          className="flex flex-col items-center justify-center bg-[#d32f2f] text-[#fff2f0] rounded-full px-4 py-1 scale-90 transition-transform duration-200"
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="text-xs font-bold tracking-wider">Settings</span>
        </Link>
      </nav>

    </div>
  );
}