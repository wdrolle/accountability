import React from 'react';
import { Metadata } from "next";
import Breadcrumb from "../../../components/Breadcrumb";

export const metadata: Metadata = {
  title: "Roadmap - CStudios",
  description: "Explore our current features and upcoming developments at CStudios",
};

export default function RoadmapPage() {
  return (
    <>
      <Breadcrumb pageTitle="Roadmap" />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white text-center">CStudios Roadmap</h1>
            
            {/* Current Features - 4 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              {/* Column 1 - Prayer & Community */}
              <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">🙏 Prayer & Community</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Prayer Request System</h3>
                    <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>Create and share prayer requests</li>
                      <li>Community prayer support</li>
                      <li>Prayer tracking and updates</li>
                      <li>Private and public prayer options</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Community Engagement</h3>
                    <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>Community feed</li>
                      <li>User profiles</li>
                      <li>Prayer groups</li>
                      <li>Community notifications</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Column 2 - Scripture Features */}
              <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">📖 Scripture Features</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">agents Reading</h3>
                    <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>Multiple agents versions</li>
                      <li>Chapter-by-chapter navigation</li>
                      <li>Verse highlighting</li>
                      <li>Reading progress tracking</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Study Tools</h3>
                    <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>Verse sharing</li>
                      <li>Personal notes</li>
                      <li>Advanced search</li>
                      <li>Cross-reference tools</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Column 3 - User Features */}
              <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">👤 User Features</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Account Management</h3>
                    <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>User registration</li>
                      <li>Profile customization</li>
                      <li>Privacy settings</li>
                      <li>Email preferences</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Personal Dashboard</h3>
                    <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>Reading progress</li>
                      <li>Prayer request tracking</li>
                      <li>Study group overview</li>
                      <li>Saved verses and notes</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Column 4 - Technical Features */}
              <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">📱 Technical Features</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Platform</h3>
                    <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>Responsive design</li>
                      <li>Dark/Light mode</li>
                      <li>Fast page loading</li>
                      <li>Progressive Web App</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Security</h3>
                    <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>Secure authentication</li>
                      <li>Data encryption</li>
                      <li>Privacy protection</li>
                      <li>Regular updates</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Features - Full Width */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-100 text-center border-b pb-2">Upcoming Features</h2>
              
              {/* Phase Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Phase 1 */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-blue-800 dark:text-blue-300">Phase 1 (Q4 2024)</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Enhanced Prayer Features</h4>
                      <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>Prayer analytics</li>
                        <li>Prayer reminders</li>
                        <li>Prayer categories</li>
                        <li>Prayer journals</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Phase 2 */}
                <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-orange-800 dark:text-orange-300">Phase 2 (Q1 2025)</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">AI Integration</h4>
                      <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>AI study assistance</li>
                        <li>Smart recommendations</li>
                        <li>Verse suggestions</li>
                        <li>Intelligent search</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Phase 3 */}
                <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-purple-800 dark:text-purple-300">Phase 3 (Q2 2025)</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Community Expansion</h4>
                      <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>Church directory</li>
                        <li>Ministry tools</li>
                        <li>Event management</li>
                        <li>Resource sharing</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Phase 4 */}
                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-green-800 dark:text-green-300">Phase 4 (Q2 2025)</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Mobile Experience</h4>
                      <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>Native mobile apps</li>
                        <li>Offline access</li>
                        <li>Push notifications</li>
                        <li>Mobile-optimized study</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Long-term Vision */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-8 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Long-term Vision</h2>
              <ul className="grid grid-cols-2 md:grid-cols-3 gap-4 text-gray-600 dark:text-gray-300">
                <li className="flex items-center space-x-2">
                  <span className="text-blue-500">•</span>
                  <span>Global scripture engagement platform</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-blue-500">•</span>
                  <span>Multi-language support</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-blue-500">•</span>
                  <span>Church management integration</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-blue-500">•</span>
                  <span>Advanced analytics and insights</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-blue-500">•</span>
                  <span>Virtual agents study experiences</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-blue-500">•</span>
                  <span>Community-driven content</span>
                </li>
              </ul>
            </div>

            {/* Feedback & Updates Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Feedback & Suggestions</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  We value your input! If you have suggestions for new features or improvements, please visit our{' '}
                  <a href="/contact" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline">
                    contact page
                  </a>{' '}
                  or email us at info@email.2920.ai.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Updates</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  This roadmap is regularly updated to reflect our progress and evolving priorities. Check back often for the latest updates on our development journey.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 