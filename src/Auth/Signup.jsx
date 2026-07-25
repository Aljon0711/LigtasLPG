import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../styles';

export default function Signup() {
  const navigate = useNavigate();
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.termsAgreed) {
      setShowError(true);
      return;
    }

    setShowError(false);
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      console.log('Account created for:', formData);
      navigate('/dashboard', { state: { toast: 'Sign up successful' } });
    }, 1000);
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
            <span
              className={`${styles.materialIcon} ${styles.brandHeaderIcon}`}
            >
              signal_wifi_4_bar
            </span>
            <span className={styles.brandHeadline}>LigtasLPG</span>
          </div>
          <h1 className={styles.displayHeading}>
            Vigilant Monitoring <br />
            <span className={styles.textPrimary}>Reliable Safety.</span>
          </h1>
          <p className={styles.brandDescription}>
            Create an account to connect your LigtasLPG IoT sensors and ensure
            your home or business is protected from gas leaks 24/7.
          </p>
          <div className={styles.featureCards}>
            <div className={styles.featureCardPrimary}>
              <span
                className={`${styles.materialIcon} ${styles.featureIconPrimary}`}
              >
                security
              </span>
              <div>
                <p className={styles.featureTitle}>Encrypted Connectivity</p>
                <p className={styles.featureText}>
                  Your sensor data is protected with military-grade encryption.
                </p>
              </div>
            </div>
            <div className={styles.featureCardSecondary}>
              <span
                className={`${styles.materialIcon} ${styles.featureIconSecondary}`}
              >
                notifications_active
              </span>
              <div>
                <p className={styles.featureTitle}>Instant Alerts</p>
                <p className={styles.featureText}>
                  Get notified the second a change in gas pressure is detected.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Registration Form */}
        <section className={styles.formSection}>
          {/* Mobile Logo */}
          <div className={styles.mobileLogo}>
            <span
              className={`${styles.materialIcon} ${styles.mobileLogoIcon}`}
            >
              signal_wifi_4_bar
            </span>
            <span className={styles.brandHeadline}>LigtasLPG</span>
          </div>

          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Create Account</h2>
              <p className={styles.formSubtitle}>
                Join our network of safe households today.
              </p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="name">
                  Full Name
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
                  Email Address
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
                  Password
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
                  Confirm Password
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
                  I agree to the{' '}
                  <a className={styles.termsLink} href="#terms">
                    Terms and Conditions
                  </a>{' '}
                  and the Privacy Policy for safety data handling.
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
                      Processing...
                    </>
                  ) : isSuccess ? (
                    <>
                      <span className={styles.materialIcon}>check_circle</span>
                      Account Created!
                    </>
                  ) : (
                    <>
                      Sign Up
                      <span className={styles.materialIcon}>arrow_forward</span>
                    </>
                  )}
                </button>

                <div className={styles.divider}>
                  <hr className={styles.dividerLine} />
                  <span className={styles.dividerText}>OR</span>
                  <hr className={styles.dividerLine} />
                </div>

                <Link className={styles.signInLinkBtn} to="/">
                  Already have an account? Sign In
                </Link>
              </div>
            </form>

            {/* Error Feedback */}
            {showError && (
              <div
                className={`${styles.alertBox} ${styles.animateBounce}`}
                id="safety-alert"
              >
                <span className={styles.materialIcon}>warning</span>
                <span className={styles.featureText}>
                  Please agree to the Terms and Conditions to proceed.
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