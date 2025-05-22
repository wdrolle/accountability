import React from 'react';
import { Metadata } from "next";
import Breadcrumb from "../../../components/Breadcrumb";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Integrations - CStudios",
  description: "Explore the technologies and services powering CStudios",
};

const integrations = [
  {
    category: "Scripture & Content",
    items: [
      {
        name: "API.agents",
        logo: "/images/logo/api.agents/api-agents.png",
        description: "Powers our comprehensive agents content delivery system, providing multiple translations, verse lookup, and search functionality.",
        features: [
          "Multiple agents translations",
          "Verse lookup API",
          "Search functionality",
          "Study materials access"
        ]
      },
    ]
  },
  {
    category: "Payment Processing",
    items: [
      {
        name: "Stripe",
        logo: "/images/logo/stripe/stripe-svgrepo-com.svg",
        description: "Handles secure payment processing for premium subscriptions and donations.",
        features: [
          "Secure transactions",
          "Multiple currencies",
          "Subscription management",
          "Payment analytics"
        ]
      },
      {
        name: "PayPal",
        logo: "/images/logo/paypal/paypal-3-svgrepo-com.svg",
        description: "Alternative payment options for subscriptions and donations.",
        features: [
          "Easy transactions",
          "Global payments",
          "Secure checkout",
          "Donation processing"
        ]
      },
    ]
  },
  {
    category: "Infrastructure",
    items: [
      {
        name: "Supabase",
        logo: "/images/logo/supabase/676c8f5445242-Supabase.svg",
        description: "Our primary database and authentication provider.",
        features: [
          "User authentication",
          "Real-time updates",
          "Data management",
          "API services"
        ]
      },
      {
        name: "Vercel",
        logo: "/images/logo/vercel/vercel-svgrepo-com.svg",
        description: "Hosts our application with automatic deployments and global CDN.",
        features: [
          "Global CDN",
          "Auto deployments",
          "Edge functions",
          "Analytics"
        ]
      },
    ]
  },
  {
    category: "Communication",
    items: [
      {
        name: "Twilio",
        logo: "/images/logo/twillo/twilio-svgrepo-com.svg",
        description: "Powers our SMS notifications and communication system.",
        features: [
          "SMS notifications",
          "Prayer reminders",
          "Group updates",
          "Event alerts"
        ]
      },
      {
        name: "Resend",
        logo: "/images/logo/resend/resend-icon-black.svg",
        description: "Handles all transactional emails with high deliverability.",
        features: [
          "Transactional emails",
          "Welcome messages",
          "Password resets",
          "Daily devotionals"
        ]
      },
    ]
  },
  {
    category: "Core Tech",
    items: [
      {
        name: "Next.js",
        logo: "/images/logo/next/nextjs-svgrepo-com.svg",
        description: "The foundation of our web application framework.",
        features: [
          "Server components",
          "Fast rendering",
          "SEO optimization",
          "Dynamic routing"
        ]
      },
      {
        name: "React",
        logo: "/images/logo/react/react-javascript-js-framework-facebook-svgrepo-com.svg",
        description: "Powers our user interface and components.",
        features: [
          "Component system",
          "State management",
          "Virtual DOM",
          "React hooks"
        ]
      },
    ]
  },
  {
    category: "AI Services",
    items: [
      {
        name: "OpenAI",
        logo: "/images/logo/openai/openai-svgrepo-com.svg",
        description: "Powers our advanced AI features and analysis.",
        features: [
          "Scripture analysis",
          "Study recommendations",
          "Content generation",
          "Smart search"
        ]
      },
      {
        name: "Llama 3.2",
        logo: "/images/logo/ollama/ollama.svg",
        description: "Provides on-device AI capabilities for privacy.",
        features: [
          "Private analysis",
          "Offline features",
          "Local processing",
          "Custom models"
        ]
      },
    ]
  }
];

export default function IntegrationsPage() {
  return (
    <>
      <Breadcrumb pageTitle="Integrations" />
      <section className="relative z-10 overflow-hidden pt-[80px] pb-16 md:pt-[100px] md:pb-[120px] xl:pt-[120px] xl:pb-[160px] 2xl:pt-[140px] 2xl:pb-[200px]">
        <div className="container">
          <div className="wow fadeInUp mb-8" data-wow-delay=".1s">
            <div className="flex flex-wrap justify-center">
              <div className="w-full px-4">
                <div className="mb-12 lg:mb-16 max-w-[720px] lg:text-center mx-auto">
                  <h2 className="font-bold text-3xl sm:text-4xl md:text-[50px] text-black dark:text-white mb-5">
                    Our Technology Stack
                  </h2>
                  <p className="text-lg md:text-xl text-body-color dark:text-gray-400">
                    CStudios is built on a robust foundation of modern technologies and services.
                    Each integration is carefully chosen to provide the best possible experience.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {integrations.map((category) => (
            <div key={category.category} className="mb-16">
              <h3 className="text-2xl md:text-3xl font-bold text-black dark:text-white mb-10 text-center">
                {category.category}
              </h3>
              <div className="flex flex-wrap justify-center -mx-4">
                {category.items.map((item) => (
                  <div key={item.name} className="w-full md:w-1/2 lg:w-1/3 px-4 mb-8">
                    <div className="backdrop-blur-sm bg-white/10 dark:bg-dark/10 rounded-lg relative z-10 overflow-hidden border border-white/20 dark:border-white/10 shadow-pricing py-10 px-8 sm:p-12 lg:py-10 lg:px-6 xl:p-12 hover:border-primary/20 hover:shadow-lg transition duration-300">
                      <div className="flex justify-center mb-10">
                        <Image
                          src={item.logo}
                          alt={`${item.name} logo`}
                          width={100}
                          height={100}
                          className="object-contain dark:brightness-200"
                        />
                      </div>
                      <h3 className="font-bold text-2xl md:text-3xl text-black dark:text-white mb-5 text-center">
                        {item.name}
                      </h3>
                      <p className="text-lg text-body-color dark:text-gray-400 mb-8 text-center border-b border-white/20 dark:border-white/10 pb-8">
                        {item.description}
                      </p>
                      <div className="mb-8">
                        <div className="flex flex-col gap-5">
                          {item.features.map((feature, index) => (
                            <div key={index} className="flex items-center">
                              <span className="w-[20px] h-[20px] inline-flex items-center justify-center rounded-full bg-primary/20 text-primary mr-3">
                                <svg width="10" height="8" viewBox="0 0 8 6" className="fill-current">
                                  <path d="M2.90567 6.00024C2.68031 6.00024 2.48715 5.92812 2.294 5.74764L0.169254 3.43784C-0.0560926 3.18523 -0.0560926 2.78827 0.169254 2.53566C0.39461 2.28298 0.74873 2.28298 0.974086 2.53566L2.90567 4.66497L7.02642 0.189715C7.25175 -0.062913 7.60585 -0.062913 7.83118 0.189715C8.0566 0.442354 8.0566 0.839355 7.83118 1.09198L3.54957 5.78375C3.32415 5.92812 3.09882 6.00024 2.90567 6.00024Z" />
                                </svg>
                              </span>
                              <p className="text-base md:text-lg text-body-color dark:text-gray-400">{feature}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
} 