'use client';

import React from 'react';
import Link from 'next/link';

const ContactSection = () => {
  return (
    <div>
      <p>We're here to help you on your spiritual journey! If you have any questions, thoughts to share, or need guidance, please don't hesitate to reach out.</p>
      <div className="mt-4">
        <Link 
          href="/contact" 
          className="button-border-gradient hover:button-gradient-hover relative inline-flex items-center gap-1.5 rounded-lg px-6 py-3 text-sm text-white shadow-button hover:shadow-none"
        >
          Contact Us
        </Link>
      </div>
      <p className="mt-4">We look forward to supporting you in your faith journey.</p>
    </div>
  );
};

export default ContactSection; 