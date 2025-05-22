'use client';

import React, { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import { Mail, MessageCircle, Clock, Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const contactFeatures = [
  {
    title: "Share Your Thoughts",
    description: "Tell us about your experience with spirituality and faith, and how we can better serve our community.",
    icon: MessageCircle,
    color: "text-gray-300 dark:text-gray-300 light:text-black",
    bgColor: "bg-light-4 dark:bg-gray-900",
  },
  {
    title: "Quick Response",
    description: "Our team is dedicated to responding to your inquiries promptly and thoughtfully.",
    icon: Clock,
    color: "text-gray-300 dark:text-gray-300 light:text-black",
    bgColor: "bg-light-4 dark:bg-gray-900",
  },
  {
    title: "Connect With Us",
    description: "Reach out for support, suggestions, or to share your spiritual journey with our community.",
    icon: Share2,
    color: "text-gray-300 dark:text-gray-300 light:text-black",
    bgColor: "bg-light-4 dark:bg-gray-900",
  },
];

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Message sent successfully!');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        toast.error(data.error || 'Failed to send message');
      }
    } catch (error) {
      toast.error('An error occurred while sending your message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <>
      <Breadcrumb pageTitle="Contact Us" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12">
          <p className="text-center text-gray-400 dark:text-gray-400 light:text-black/80 max-w-2xl mx-auto">
            We value your thoughts and questions. Reach out to us and be part of building
            a more connected and spiritually enriched community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {contactFeatures.map((feature) => (
            <div
              key={feature.title}
              className="relative rounded-xl bg-white/10 dark:bg-transparent light:bg-white p-8 border dark:border-white/[0.1] light:border-white shadow-lg transform hover:-translate-y-1 hover:shadow-xl transition-all"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(0,0,0,0.1))',
                boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1)'
              }}
            >
              <div className={`relative flex h-16 w-16 items-center justify-center rounded-full ${feature.bgColor} mb-6`}>
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/50 via-transparent to-white/20" />
                <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-white/10 via-transparent to-black/30" />
                <div className="absolute inset-[1px] rounded-full ring-1 ring-white/10 shadow-inner" />
                <div className="absolute inset-0 rounded-full shadow-lg" />
                <feature.icon className={`h-8 w-8 ${feature.color} relative z-10 drop-shadow-lg`} />
              </div>
              <h3 className="text-xl font-semibold text-white dark:text-white light:text-black mb-4 transform hover:-translate-y-0.5 transition-transform">
                {feature.title}
              </h3>
              <p className="text-gray-400 dark:text-gray-400 light:text-black/80 transform hover:-translate-y-0.5 transition-transform">
                {feature.description}
              </p>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
            </div>
          ))}
        </div>

        <div 
          className="relative rounded-xl bg-white/10 dark:bg-transparent light:bg-white p-8 border dark:border-white/[0.1] light:border-white shadow-lg transform hover:-translate-y-1 hover:shadow-xl transition-all"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(0,0,0,0.1))',
            boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1)'
          }}
        >
          <form
            onSubmit={handleSubmit}
            className="relative z-10"
          >
            <div className="-mx-4 flex flex-wrap xl:-mx-10">
              <div className="w-full px-4 md:w-1/2 xl:px-5">
                <div className="mb-9.5">
                  <label
                    htmlFor="name"
                    className="mb-2.5 block font-medium text-white dark:text-white light:text-black"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    required
                    className="w-full rounded-lg border dark:border-white/[0.12] light:border-white bg-white/[0.05] dark:bg-transparent light:bg-white px-6 py-3 text-white dark:text-white light:text-black outline-none focus:border-purple"
                  />
                </div>
              </div>
              <div className="w-full px-4 md:w-1/2 xl:px-5">
                <div className="mb-9.5">
                  <label
                    htmlFor="email"
                    className="mb-2.5 block font-medium text-white dark:text-white light:text-black"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    className="w-full rounded-lg border dark:border-white/[0.12] light:border-white bg-white/[0.05] dark:bg-transparent light:bg-white px-6 py-3 text-white dark:text-white light:text-black outline-none focus:border-purple"
                  />
                </div>
              </div>
              <div className="w-full px-4 xl:px-5">
                <div className="mb-9.5">
                  <label
                    htmlFor="subject"
                    className="mb-2.5 block font-medium text-white dark:text-white light:text-black"
                  >
                    Subject
                  </label>
                  <input
                    id="subject"
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Enter message subject"
                    required
                    className="w-full rounded-lg border dark:border-white/[0.12] light:border-white bg-white/[0.05] dark:bg-transparent light:bg-white px-6 py-3 text-white dark:text-white light:text-black outline-none focus:border-purple"
                  />
                </div>
              </div>
              <div className="w-full px-4 xl:px-5">
                <div className="mb-10">
                  <label
                    htmlFor="message"
                    className="mb-2.5 block font-medium text-white dark:text-white light:text-black"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Type your message"
                    rows={6}
                    required
                    className="w-full rounded-lg border dark:border-white/[0.12] light:border-white bg-white/[0.05] dark:bg-transparent light:bg-white px-6 py-5 text-white dark:text-white light:text-black outline-none focus:border-purple"
                  />
                </div>
              </div>
              <div className="w-full px-4 xl:px-5">
                <div className="text-center">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="hero-button-gradient inline-flex items-center gap-2 rounded-lg px-7 py-3 font-medium text-white dark:text-white light:text-black duration-300 ease-in hover:opacity-80 disabled:opacity-50 transform hover:-translate-y-0.5 transition-transform"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                    <Mail className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </form>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
        </div>
      </div>
    </>
  );
} 