import { Metadata } from 'next'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | CryptoFlash',
  description: 'Privacy Policy for CryptoFlash - How we collect, use, and protect your data',
  robots: {
    index: true,
    follow: true,
  },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0B1020] w-full flex flex-col">
      <Navbar />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-12 max-w-4xl mx-auto flex-grow">
        <div className="glass-card rounded-xl p-6 md:p-8">
          <h1 className="text-4xl font-bold gradient-text mb-6">Privacy Policy</h1>
          <p className="text-sm text-[#94A3B8] mb-8">Last updated: November 6, 2024</p>

          <div className="prose prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">1. Information We Collect</h2>
              <p className="text-[#b8c5d6] leading-relaxed mb-4">
                We collect information that you provide directly to us:
              </p>
              <ul className="list-disc list-inside text-[#b8c5d6] space-y-2 ml-4">
                <li><strong>Account Information:</strong> Email address, password (hashed), subscription status</li>
                <li><strong>Telegram Information:</strong> Telegram username and chat ID (when you link your Telegram account)</li>
                <li><strong>Alert Preferences:</strong> Token addresses, score thresholds, and notification settings</li>
                <li><strong>Payment Information:</strong> Solana wallet addresses and transaction IDs (processed via Solana Pay)</li>
              </ul>
              <p className="text-[#b8c5d6] leading-relaxed mt-4">
                We also automatically collect certain information when you use the Service:
              </p>
              <ul className="list-disc list-inside text-[#b8c5d6] space-y-2 ml-4">
                <li>Usage data and analytics (via Google Analytics)</li>
                <li>IP address and browser information</li>
                <li>Device information and operating system</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">2. How We Use Your Information</h2>
              <p className="text-[#b8c5d6] leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-[#b8c5d6] space-y-2 ml-4">
                <li>Provide, maintain, and improve the Service</li>
                <li>Send you alerts and notifications (Telegram, email)</li>
                <li>Process payments and manage subscriptions</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Analyze usage patterns to improve user experience</li>
                <li>Detect and prevent fraud or abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">3. Data Storage and Security</h2>
              <p className="text-[#b8c5d6] leading-relaxed">
                We use Supabase (PostgreSQL database) to store your data securely. 
                All data is encrypted in transit and at rest. We implement industry-standard security measures including:
              </p>
              <ul className="list-disc list-inside text-[#b8c5d6] space-y-2 ml-4 mt-4">
                <li>Password hashing (bcrypt)</li>
                <li>Row-level security (RLS) policies</li>
                <li>Secure API endpoints</li>
                <li>Regular security audits</li>
              </ul>
              <p className="text-[#b8c5d6] leading-relaxed mt-4">
                However, no method of transmission over the Internet is 100% secure. 
                While we strive to protect your data, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">4. Third-Party Services</h2>
              <p className="text-[#b8c5d6] leading-relaxed mb-4">
                We use the following third-party services:
              </p>
              <ul className="list-disc list-inside text-[#b8c5d6] space-y-2 ml-4">
                <li><strong>Supabase:</strong> Database and authentication (privacy policy: supabase.com/privacy)</li>
                <li><strong>Google Analytics:</strong> Website analytics (privacy policy: policies.google.com/privacy)</li>
                <li><strong>Vercel:</strong> Hosting and deployment (privacy policy: vercel.com/legal/privacy-policy)</li>
                <li><strong>Telegram:</strong> Notification delivery (privacy policy: telegram.org/privacy)</li>
              </ul>
              <p className="text-[#b8c5d6] leading-relaxed mt-4">
                These services have their own privacy policies. We encourage you to review them.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">5. Data Sharing</h2>
              <p className="text-[#b8c5d6] leading-relaxed">
                We do not sell, trade, or rent your personal information to third parties. 
                We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-[#b8c5d6] space-y-2 ml-4 mt-4">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations or court orders</li>
                <li>To protect our rights, property, or safety</li>
                <li>In connection with a business transfer (merger, acquisition)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">6. Your Rights</h2>
              <p className="text-[#b8c5d6] leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-[#b8c5d6] space-y-2 ml-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and data</li>
                <li>Export your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Withdraw consent for data processing</li>
              </ul>
              <p className="text-[#b8c5d6] leading-relaxed mt-4">
                To exercise these rights, contact us at <a href="mailto:support@cryptoflash.app" className="text-[#00FFA3] hover:underline">support@cryptoflash.app</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">7. Cookies and Tracking</h2>
              <p className="text-[#b8c5d6] leading-relaxed">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-[#b8c5d6] space-y-2 ml-4 mt-4">
                <li>Maintain your session (authentication)</li>
                <li>Remember your preferences</li>
                <li>Analyze website traffic (Google Analytics)</li>
              </ul>
              <p className="text-[#b8c5d6] leading-relaxed mt-4">
                You can control cookies through your browser settings. 
                However, disabling cookies may affect the functionality of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">8. Children's Privacy</h2>
              <p className="text-[#b8c5d6] leading-relaxed">
                The Service is not intended for users under the age of 18. 
                We do not knowingly collect personal information from children. 
                If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">9. Changes to Privacy Policy</h2>
              <p className="text-[#b8c5d6] leading-relaxed">
                We may update this Privacy Policy from time to time. 
                We will notify you of significant changes via email or through the Service. 
                Continued use of the Service after changes constitutes acceptance of the new Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#F8FAFC] mt-8 mb-4">10. Contact Us</h2>
              <p className="text-[#b8c5d6] leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-[#b8c5d6] leading-relaxed mt-2">
                Email: <a href="mailto:support@cryptoflash.app" className="text-[#00FFA3] hover:underline">support@cryptoflash.app</a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

