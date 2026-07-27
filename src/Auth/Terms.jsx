import { Link } from 'react-router-dom'
import AppHeader from '../Components/AppHeader'

const lastUpdated = 'July 27, 2026'

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c] font-sans pb-16">
      <AppHeader showBack />

      <main className="max-w-3xl mx-auto px-4 pt-20">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[#af101a]">
            Terms and Conditions
          </h1>
          <p className="text-sm text-[#5b403d] mt-2">
            LigtasLPG IoT Safety Monitoring · Last updated: {lastUpdated}
          </p>
        </header>

        <div className="space-y-8 bg-white rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] p-6 md:p-8 border-t-2 border-[#af101a]">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-sm leading-relaxed text-[#5b403d]">
              By creating an account or using the LigtasLPG mobile and web
              application (&quot;Service&quot;), you agree to these Terms and
              Conditions and our Privacy Policy. If you do not agree, do not use
              the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. About LigtasLPG</h2>
            <p className="text-sm leading-relaxed text-[#5b403d]">
              LigtasLPG provides IoT-based monitoring tools for household and
              small-business LPG systems, including sensor status, alerts, device
              settings, activity logs, and emergency contact features. The Service
              is designed to support safety awareness and is not a substitute for
              professional gas installation, maintenance, or emergency response.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Accounts and Security</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm text-[#5b403d]">
              <li>
                You must provide accurate registration information (name, email,
                and password, or Google sign-in with an app password).
              </li>
              <li>
                You are responsible for keeping your login credentials confidential
                and for all activity under your account.
              </li>
              <li>
                Notify us promptly if you suspect unauthorized access to your
                account or device.
              </li>
              <li>
                You must be at least 18 years old, or have consent from a parent or
                legal guardian, to use the Service.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Device and Safety Disclaimer</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm text-[#5b403d]">
              <li>
                LigtasLPG sensors and software help detect abnormal conditions such
                as pressure changes or possible gas leaks, but no system is
                100% fail-proof.
              </li>
              <li>
                Always follow proper LPG handling practices, ensure adequate
                ventilation, and maintain your equipment through licensed
                technicians.
              </li>
              <li>
                In case of suspected gas leak: leave the area if safe, avoid sparks
                or open flame, and contact emergency services and your gas
                provider immediately.
              </li>
              <li>
                LigtasLPG and its operators are not liable for injury, property
                damage, or loss arising from delayed alerts, network outages,
                hardware failure, misconfiguration, or misuse of the Service.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Acceptable Use</h2>
            <p className="text-sm leading-relaxed text-[#5b403d]">
              You agree not to misuse the Service, including attempting to hack,
              reverse engineer, overload, or interfere with devices or servers;
              impersonate others; or use the Service for unlawful purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Emergency Contacts</h2>
            <p className="text-sm leading-relaxed text-[#5b403d]">
              If you add emergency contacts, you confirm you have permission to
              store their phone numbers and that they may be contacted during
              safety events. Delivery of SMS/calls depends on third-party networks
              and is not guaranteed.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Intellectual Property</h2>
            <p className="text-sm leading-relaxed text-[#5b403d]">
              The LigtasLPG name, logos, software, and content are owned by
              LigtasLPG IoT Solutions or its licensors. You may not copy, modify,
              or redistribute them without written permission.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. Service Changes and Termination</h2>
            <p className="text-sm leading-relaxed text-[#5b403d]">
              We may update, suspend, or discontinue parts of the Service. We may
              suspend or terminate accounts that violate these Terms. You may stop
              using the Service and request account deletion at any time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">9. Governing Law</h2>
            <p className="text-sm leading-relaxed text-[#5b403d]">
              These Terms are governed by the laws of the Republic of the
              Philippines. Disputes shall be resolved in the appropriate courts of
              the Philippines, without prejudice to applicable consumer protection
              rights.
            </p>
          </section>

          <section id="privacy" className="space-y-3 border-t border-[#eeeeee] pt-8">
            <h1 className="text-2xl font-bold text-[#af101a]">Privacy Policy</h1>
            <p className="text-sm leading-relaxed text-[#5b403d]">
              This Privacy Policy explains how LigtasLPG collects, uses, and
              protects your information when you use our Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">10. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm text-[#5b403d]">
              <li>
                <strong>Account data:</strong> name, email, phone (optional),
                language and preference settings, and authentication data (including
                Google sign-in identifiers when used).
              </li>
              <li>
                <strong>Device and safety data:</strong> hardware ID, firmware
                version, connectivity status, sensor readings, valve status,
                thresholds, and activity/event logs.
              </li>
              <li>
                <strong>Emergency contacts:</strong> names and phone numbers you
                choose to store.
              </li>
              <li>
                <strong>Technical data:</strong> app usage logs, device type, and
                approximate network information needed to operate the Service.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">11. How We Use Information</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm text-[#5b403d]">
              <li>To create and manage your account</li>
              <li>To monitor LPG device status and send safety alerts</li>
              <li>To display logs, settings, and profile information</li>
              <li>To contact emergency numbers you configured during critical events</li>
              <li>To improve reliability, security, and user experience</li>
              <li>To comply with legal obligations when required</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">12. Sharing of Information</h2>
            <p className="text-sm leading-relaxed text-[#5b403d]">
              We do not sell your personal data. We may share information with:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-[#5b403d]">
              <li>
                Service providers that host authentication and database services
                (for example, Supabase) under confidentiality and security
                obligations
              </li>
              <li>Emergency contacts you add, during alert events</li>
              <li>Authorities when required by law or to protect life and safety</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">13. Data Storage and Security</h2>
            <p className="text-sm leading-relaxed text-[#5b403d]">
              We use industry-standard safeguards such as encrypted connections and
              access controls. No method of transmission or storage is completely
              secure; please use a strong app password and keep your device updated.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">14. Your Rights</h2>
            <p className="text-sm leading-relaxed text-[#5b403d]">
              Subject to applicable Philippine data privacy laws, you may request
              access, correction, or deletion of your personal data, and you may
              withdraw consent where processing is based on consent. Contact us
              using the details below to make a request.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">15. Data Retention</h2>
            <p className="text-sm leading-relaxed text-[#5b403d]">
              We retain account and device records while your account is active and
              for a reasonable period afterward for security, dispute resolution,
              and legal compliance. You may request earlier deletion where
              permitted.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">16. Children&apos;s Privacy</h2>
            <p className="text-sm leading-relaxed text-[#5b403d]">
              The Service is not directed to children under 13. If you believe a
              child provided personal data without proper consent, contact us so we
              can delete it.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">17. Changes to These Terms</h2>
            <p className="text-sm leading-relaxed text-[#5b403d]">
              We may update these Terms and the Privacy Policy from time to time.
              Continued use of the Service after changes means you accept the
              updated version. The &quot;Last updated&quot; date above will be
              revised when changes are published.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">18. Contact</h2>
            <p className="text-sm leading-relaxed text-[#5b403d]">
              For questions about these Terms or Privacy Policy, contact
              LigtasLPG IoT Solutions at{' '}
              <a
                className="text-[#005faf] font-semibold underline"
                href="mailto:support@ligtaslpg.app"
              >
                support@ligtaslpg.app
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            to="/signup"
            className="inline-flex justify-center items-center rounded-lg bg-[#af101a] px-5 py-3 text-sm font-bold text-white"
          >
            Back to Sign Up
          </Link>
          <Link
            to="/"
            className="inline-flex justify-center items-center rounded-lg border border-[#8f6f6c] px-5 py-3 text-sm font-bold text-[#5b403d]"
          >
            Go to Sign In
          </Link>
        </div>
      </main>
    </div>
  )
}
