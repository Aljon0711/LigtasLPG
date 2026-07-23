import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';
import '../styles';

export default function Alert() {
  const navigate = useNavigate();
  const [holdingProgress, setHoldingProgress] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const pressTimerRef = useRef(null);

  // --- Long Press Logic ---
  const startPress = () => {
    if (isResetting) return;
    setHoldingProgress(true);

    pressTimerRef.current = setTimeout(() => {
      handleResetSystem();
    }, 2000);
  };

  const cancelPress = () => {
    if (isResetting) return;
    setHoldingProgress(false);
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
  };

  const handleResetSystem = () => {
    setIsResetting(true);
    setHoldingProgress(false);

    setTimeout(() => {
      navigate('/dashboard');
    }, 1000);
  };

  const handleEmergencyCall = () => {
    window.location.href = 'tel:911';
  };

  return (
    <div className="bg-[#d32f2f] text-white overflow-hidden h-screen flex flex-col font-sans relative">
      <AppHeader variant="alert">
        <Link
          to="/profile"
          className="material-symbols-outlined text-white !text-[24px] p-1"
          aria-label="Account"
        >
          account_circle
        </Link>
      </AppHeader>

      {/* Main Alert Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center relative pt-16 pb-24">
        {/* Warning Container */}
        <div className="z-10 w-full max-w-md flex flex-col gap-6">
          
          {/* Pulsing Icon */}
          <div className="relative mx-auto">
            <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center pulse-red">
              <span 
                className="material-symbols-outlined text-[#d32f2f] text-[64px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                warning
              </span>
            </div>
          </div>

          {/* Warning Headline */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl leading-tight font-extrabold uppercase tracking-tight">
              CRITICAL ALERT: GAS LEAK DETECTED
            </h1>
            <div className="inline-flex items-center gap-2 px-4 py-1 bg-white text-[#d32f2f] rounded-full text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">
                gpp_good
              </span>
              VALVE AUTOMATICALLY CLOSED
            </div>
          </div>

          {/* Safety Instructions Glass Card */}
          <div className="glass-panel p-6 rounded-xl text-left space-y-4">
            <div className="flex gap-4 items-center">
              <span className="material-symbols-outlined flex-shrink-0 text-white">
                door_open
              </span>
              <p className="text-base text-white font-medium">
                Leave the area immediately. Ensure windows are open if safe.
              </p>
            </div>
            
            <div className="h-[1px] bg-white/20 w-full" />

            <div className="flex gap-4 items-center opacity-90">
              <span className="material-symbols-outlined flex-shrink-0 text-white">
                info
              </span>
              <p className="text-xs text-white">
                Sensors detected high LPG concentration in the kitchen area. The safety valve was deployed at 14:32:01.
              </p>
            </div>
          </div>

          {/* Action Area */}
          <div className="flex flex-col gap-3 pt-4">
            {/* Long Press Reset Button */}
            <div className="relative group">
              <button
                id="resetButton"
                type="button"
                disabled={isResetting}
                onMouseDown={startPress}
                onMouseUp={cancelPress}
                onMouseLeave={cancelPress}
                onTouchStart={(e) => {
                  e.preventDefault();
                  startPress();
                }}
                onTouchEnd={cancelPress}
                className={`w-full bg-white text-[#d32f2f] text-base py-4 rounded-xl shadow-2xl active:scale-95 transition-transform duration-100 overflow-hidden relative select-none font-bold uppercase tracking-widest ${
                  isResetting ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                {/* Long-press Progress Fill */}
                <div
                  className="absolute left-0 top-0 h-full bg-[#d32f2f]/20 pointer-events-none transition-all duration-[2000ms] ease-linear"
                  style={{
                    width: holdingProgress ? '100%' : '0%',
                    transitionDuration: holdingProgress ? '2000ms' : '0ms'
                  }}
                />
                <span className="relative z-10">
                  {isResetting ? 'SYSTEM RESETTING...' : 'RESET SYSTEM'}
                </span>
              </button>
              <p className="mt-2 text-white/70 text-xs font-semibold uppercase tracking-wider">
                Hold for 2 seconds to confirm safety
              </p>
            </div>

            {/* Emergency Call Button */}
            <button
              type="button"
              onClick={handleEmergencyCall}
              className="w-full border-2 border-white text-white text-base py-3 rounded-xl hover:bg-white hover:text-[#d32f2f] transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <span className="material-symbols-outlined">call</span>
              Call Emergency Services
            </button>
          </div>
        </div>
      </main>

      {/* Footer Metrics */}
      <footer className="fixed bottom-6 left-0 w-full flex justify-center px-6 opacity-60 z-10">
        <div className="flex items-center gap-6 text-xs font-bold tracking-wider uppercase">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined !text-[16px]">
              thermostat
            </span>
            <span>TEMP: 24°C</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined !text-[16px]">
              humidity_low
            </span>
            <span>HUM: 45%</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined !text-[16px]">
              router
            </span>
            <span>DEVICE: LIGTAS-01-A</span>
          </div>
        </div>
      </footer>
    </div>
  );
}