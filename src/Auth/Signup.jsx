import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  signUpWithEmail,
  signInWithGoogle,
  getAuthErrorMessage,
} from '../lib/auth';
import BrandLogo from '../Components/BrandLogo';
import { usePreferences } from '../lib/PreferencesContext';
import styles from '../styles';

export default function Signup() {
  const navigate = useNavigate();
  const { t } = usePreferences();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAgreed: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [authError, setAuthError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [id]: fieldValue,
    }));

    if (id === 'termsAgreed' && checked) {
      setShowError(false);
    }
    if (authError) setAuthError('');
    if (infoMessage) setInfoMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.termsAgreed) {
      setShowError(true);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setAuthError('Password must be at least 8 characters.');
      return;
    }

    setShowError(false);
    setAuthError('');
    setInfoMessage('');
    setIsSubmitting(true);

    const { data, error } = await signUpWithEmail({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      setAuthError(getAuthErrorMessage(error));
      setIsSubmitting(false);
      return;
    }

    // Email confirmation disabled → session exists
    if (data?.session) {
      setIsSuccess(true);
      navigate('/dashboard', { state: { toast: 'Sign up successful' } });
      return;
    }

    // Email confirmation enabled → no session yet
    if (data?.user) {
      setIsSubmitting(false);
      setInfoMessage(
        'Account created. Please check your email to confirm, then sign in.',
      );
      return;
    }

    setAuthError('Unable to create account. Please try again.');
    setIsSubmitting(false);
  };

  const handleGoogleSignUp = async () => {
    setAuthError('');
    setInfoMessage('');
    setIsGoogleLoading(true);

    // After Google OAuth, user must set an app password on /set-password
    const { error } = await signInWithGoogle('signup');

    if (error) {
      setAuthError(getAuthErrorMessage(error));
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Decorative Background */}
      <div className={styles.bgDecoration}>
        <div className={styles.safetyMesh}></div>
        <div className={styles.glowTopLeft}></div>
        <div className={styles.glowBottomRight}></div>
      </div>

      {/* Main Content Canvas */}
      <main className={styles.mainCanvas}>
        {/* Left Column: Branding & Value Prop */}
        <section className={styles.brandingSection}>
          <div className={styles.brandHeader}>
            <BrandLogo size={36} />
            <span className={styles.brandHeadline}>LigtasLPG</span>
          </div>
          <h1 className={styles.displayHeading}>
            {t('signup.headline1')} <br />
            <span className={styles.textPrimary}>{t('signup.headline2')}</span>
          </h1>
          <p className={styles.brandDescription}>{t('signup.description')}</p>
          <div className={styles.featureCards}>
            <div className={styles.featureCardPrimary}>
              <span
                className={`${styles.materialIcon} ${styles.featureIconPrimary}`}
              >
                security
              </span>
              <div>
                <p className={styles.featureTitle}>{t('signup.feature1Title')}</p>
                <p className={styles.featureText}>{t('signup.feature1Text')}</p>
              </div>
            </div>
            <div className={styles.featureCardSecondary}>
              <span
                className={`${styles.materialIcon} ${styles.featureIconSecondary}`}
              >
                notifications_active
              </span>
              <div>
                <p className={styles.featureTitle}>{t('signup.feature2Title')}</p>
                <p className={styles.featureText}>{t('signup.feature2Text')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Registration Form */}
        <section className={styles.formSection}>
          {/* Mobile Logo */}
          <div className={styles.mobileLogo}>
            <BrandLogo size={48} />
            <span className={styles.brandHeadline}>LigtasLPG</span>
          </div>

          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>{t('signup.title')}</h2>
              <p className={styles.formSubtitle}>{t('signup.subtitle')}</p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="name">
                  {t('signup.fullName')}
                </label>
                <div className={styles.inputWrapper}>
                  <span className={`${styles.materialIcon} ${styles.inputIcon}`}>
                    person
                  </span>
                  <input
                    className={styles.input}
                    id="name"
                    placeholder="John Doe"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Email */}
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="email">
                  {t('signup.email')}
                </label>
                <div className={styles.inputWrapper}>
                  <span className={`${styles.materialIcon} ${styles.inputIcon}`}>
                    mail
                  </span>
                  <input
                    className={styles.input}
                    id="email"
                    placeholder="name@example.com"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Password */}
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="password">
                  {t('signup.password')}
                </label>
                <div className={styles.inputWrapper}>
                  <span className={`${styles.materialIcon} ${styles.inputIcon}`}>
                    lock
                  </span>
                  <input
                    className={styles.input}
                    id="password"
                    placeholder="••••••••"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="confirmPassword">
                  {t('signup.confirmPassword')}
                </label>
                <div className={styles.inputWrapper}>
                  <span className={`${styles.materialIcon} ${styles.inputIcon}`}>
                    verified_user
                  </span>
                  <input
                    className={styles.input}
                    id="confirmPassword"
                    placeholder="••••••••"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className={styles.checkboxContainer}>
                <input
                  className={styles.checkbox}
                  id="termsAgreed"
                  type="checkbox"
                  checked={formData.termsAgreed}
                  onChange={handleChange}
                />
                <label className={styles.termsText} htmlFor="termsAgreed">
                  {t('signup.terms')}{' '}
                  <Link
                    className={styles.termsLink}
                    to="/terms"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t('signup.termsLink')}
                  </Link>
                </label>
              </div>

              {/* Actions */}
              <div className={styles.actionContainer}>
                <button
                  type="submit"
                  disabled={isSubmitting || isSuccess}
                  className={`${styles.submitBtn} ${
                    isSuccess ? styles.submitBtnSuccess : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className={`${styles.materialIcon} ${styles.animateSpin}`}
                      >
                        progress_activity
                      </span>
                      {t('signup.creating')}
                    </>
                  ) : isSuccess ? (
                    <>
                      <span className={styles.materialIcon}>check_circle</span>
                      {t('signup.created')}
                    </>
                  ) : (
                    <>
                      {t('signup.submit')}
                      <span className={styles.materialIcon}>arrow_forward</span>
                    </>
                  )}
                </button>

                <div className={styles.divider}>
                  <hr className={styles.dividerLine} />
                  <span className={styles.dividerText}>{t('signup.or')}</span>
                  <hr className={styles.dividerLine} />
                </div>

                <button
                  type="button"
                  className={styles.googleBtn}
                  onClick={handleGoogleSignUp}
                  disabled={isGoogleLoading || isSubmitting}
                >
                  {isGoogleLoading ? (
                    <>
                      <span
                        className={`${styles.materialIcon} ${styles.animateSpin}`}
                      >
                        progress_activity
                      </span>
                      {t('signin.googleLoading')}
                    </>
                  ) : (
                    <>
                      <svg
                        className={styles.googleIcon}
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      {t('signup.google')}
                    </>
                  )}
                </button>

                <Link className={styles.signInLinkBtn} to="/">
                  {t('signup.hasAccount')} {t('signup.signIn')}
                </Link>
              </div>
            </form>

            {/* Error / Info Feedback */}
            {(showError || authError || infoMessage) && (
              <div
                className={`${styles.alertBox} ${styles.animateBounce}`}
                id="safety-alert"
                style={
                  infoMessage
                    ? {
                        backgroundColor: '#d8ffd0',
                        color: '#11651d',
                      }
                    : undefined
                }
              >
                <span className={styles.materialIcon}>
                  {infoMessage ? 'mark_email_read' : 'warning'}
                </span>
                <span className={styles.featureText}>
                  {authError ||
                    infoMessage ||
                    'Please agree to the Terms and Conditions to proceed.'}
                </span>
              </div>
            )}
          </div>

          {/* Footer Meta */}
          <div className={styles.footerMeta}>
            <div className={styles.badges}>
              <img
                className={styles.badgeImg}
                alt="Security certification badge"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwxF57NlwT5VijdTzdTuHatk_QkHqGc6r0aONzdLlUxezBkphS73cdPvsNc5ihLW9jr8yptMAvACdRhV37jMBhuAAPXQpDUPiUzpREKjPvG3cKQCdnifWzdKKoOOs8sIBaOgBIMIIfCOugpe7lQYMdJv4TD34DJMRzf2MRZOyniZ4cYZ7HrFXTkHAj1JhfKxMgf0iumh82hb3wAMUXEg9oQkzUBt5GA980KfT5dPVcvfwEqhQ0pmDObxNSYQW_muLNJLHcvMoeYJQ"
              />
              <img
                className={styles.badgeImg}
                alt="ISO safety certification logo"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRaKuMmgEmBo0M4UR0LN4GAAQLuygXF27BRG0tkTc5phaEnthmSvAabiZ9ESTCG8Rj575xyd3Jpw5y5s65bt2EzjDW72FlEKXCHmyooItp_oztF7tPhxvq2syT_Jfoh8VE8AkmJeu6fftA07UTP9TJTMe1jy3m0EYiVzwlm5a7ZTna5XvZZGz4OjaNjlo6cNidXR_5LScE3KfI6ZixLn2eI2t5jGn8CLVdeaK4B1WoIZZFcxaN6IQ5cbpB3oVlnuMyavwJJpVyOjI"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
