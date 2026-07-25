import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../styles';

export default function Signin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Signing in with:', formData);
    navigate('/dashboard', { state: { toast: 'Sign in successful' } });
  };

  return (
    <div className={styles.pageContainer}>
      {/* Hero / Background Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.brandBadge}>
            <span className={`${styles.materialIconFill} ${styles.brandIcon}`}>
              signal_wifi_4_bar
            </span>
          </div>
          <h1 className={styles.brandTitle}>LigtasLPG</h1>
          <p className={styles.brandSubtitle}>
            Reliable monitoring for your household safety.
          </p>
        </div>
      </div>

      {/* Sign In Main Container */}
      <main className={styles.mainContainer}>
        <div className={styles.card}>
          {/* Header Section */}
          <div className={styles.headerSection}>
            <h2 className={styles.cardTitle}>Welcome Back</h2>
            <p className={styles.cardSubtitle}>
              Sign in to your account to monitor your LPG status in real-time.
            </p>
          </div>

          {/* Login Form */}
          <form className={styles.form} onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="email">
                EMAIL ADDRESS
              </label>
              <div
                className={`${styles.inputWrapper} ${
                  focusedInput === 'email' ? styles.inputWrapperFocused : ''
                }`}
              >
                <div className={styles.inputIconContainer}>
                  <span className={styles.materialIcon}>mail</span>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="your@email.com"
                  className={styles.input}
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className={styles.fieldGroup}>
              <div className={styles.fieldHeader}>
                <label className={styles.label} htmlFor="password">
                  PASSWORD
                </label>
                <a href="#forgot" className={styles.forgotLink}>
                  FORGOT PASSWORD?
                </a>
              </div>
              <div
                className={`${styles.inputWrapper} ${
                  focusedInput === 'password' ? styles.inputWrapperFocused : ''
                }`}
              >
                <div className={styles.inputIconContainer}>
                  <span className={styles.materialIcon}>lock</span>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className={styles.input}
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                />
                <button
                  type="button"
                  className={styles.togglePasswordBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  <span className={styles.materialIcon}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Action Button */}
            <button type="submit" className={styles.submitBtn}>
              <span>Sign In</span>
              <span className={styles.materialIcon}>login</span>
            </button>
          </form>

          {/* Divider */}
          <div className={styles.dividerContainer}>
            <div className={styles.dividerLine} aria-hidden="true">
              <div className={styles.dividerLineInner}></div>
            </div>
            <div className={styles.dividerTextWrapper}>
              <span className={styles.dividerText}>SECURE ACCESS ONLY</span>
            </div>
          </div>

          {/* Create Account Link */}
          <div className={styles.createAccountContainer}>
            <p className={styles.createAccountText}>
              Don't have an account yet?{' '}
              <Link to="/signup" className={styles.createAccountLink}>
                Create an Account
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer / Trust Badges */}
      <footer className={styles.footer}>
        <div className={styles.trustBadges}>
          <div className={styles.badgeItem}>
            <span className={styles.materialIcon}>notifications_active</span>
            <span className={styles.badgeText}>24/7 MONITORING</span>
          </div>
        </div>
        <p className={styles.copyright}>
          © 2024 LIGTASLPG IOT SOLUTIONS. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  );
}