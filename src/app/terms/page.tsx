import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Terms of Service</h1>
        
        <div className="space-y-8 text-gray-600 dark:text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">1. Acceptance of Terms</h2>
            <p>By accessing and using CStudios services, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">2. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must notify us immediately of any unauthorized access</li>
              <li>We reserve the right to terminate accounts at our discretion</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">3. Subscription and Payments</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Subscription fees are billed in advance on a recurring basis</li>
              <li>You may cancel your subscription at any time</li>
              <li>Refunds are handled according to our refund policy</li>
              <li>We reserve the right to modify pricing with notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">4. Acceptable Use</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the service for any illegal purpose</li>
              <li>Share your account credentials</li>
              <li>Attempt to access unauthorized areas of the service</li>
              <li>Upload malicious content or interfere with the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">5. Intellectual Property</h2>
            <p>All content and materials available through our service are protected by intellectual property rights. You may not use, reproduce, or distribute any content without our permission.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">6. Limitation of Liability</h2>
            <p>We provide the service "as is" without any warranty. We are not liable for any damages arising from your use of the service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">7. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. We will notify users of any material changes.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">8. Contact</h2>
            <p>For questions about these Terms, please contact us at:</p>
            <p className="mt-2">
              <a href="mailto:support@2920.ai" className="text-purple-600 hover:text-purple-500 dark:text-purple-400">
                support@2920.ai
              </a>
            </p>
          </section>

          <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
} 