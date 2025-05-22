'use client';

import React from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import { Brain, Heart, Book, MessageCircle, Sparkles, Shield } from 'lucide-react';

const aiAgentFeatures = [
  {
    title: "Advanced Understanding",
    description: "Trained on extensive texts and writings, Zoe helps provide deeper insights into various topics.",
    icon: Brain,
    color: "text-gray-300",
    bgColor: "bg-gray-900",
  },
  {
    title: "Compassionate Guidance",
    description: "Designed to offer empathetic and thoughtful responses to personal challenges.",
    icon: Heart,
    color: "text-gray-300",
    bgColor: "bg-gray-900",
  },
  {
    title: "Contextual Analysis",
    description: "Assists in understanding complex passages through contextual analysis and historical background.",
    icon: Book,
    color: "text-gray-300",
    bgColor: "bg-gray-900",
  },
  {
    title: "Interactive Discussions",
    description: "Engages in meaningful conversations, helping users explore their journey.",
    icon: MessageCircle,
    color: "text-gray-300",
    bgColor: "bg-gray-900",
  },
  {
    title: "AI-Enhanced Learning",
    description: "Utilizes advanced language models to provide personalized guidance and learning experiences.",
    icon: Sparkles,
    color: "text-gray-300",
    bgColor: "bg-gray-900",
  },
  {
    title: "Ethical Framework",
    description: "Operates within carefully designed ethical guidelines to ensure respectful and appropriate discussions.",
    icon: Shield,
    color: "text-gray-300",
    bgColor: "bg-gray-900",
  },
];

export default function AboutZoePage() {
  return (
    <>
      <Breadcrumb pageTitle="Meet Zoe" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-center text-white dark:text-white light:text-black mb-6">
            Meet Zoe: Your Intelligent AI Companion
          </h1>
          <p className="text-center text-gray-300 dark:text-gray-300 light:text-black max-w-3xl mx-auto">
            Zoe is an advanced AI model designed to assist in personal growth and knowledge enhancement. 
            Built on the powerful Llama 3.2 architecture and integrated with ChatGPT 3.2, Zoe serves as a 
            reliable guide in your daily tasks and learning journey.
          </p>
        </div>

        <div className="mb-16">
          <div 
            className="relative rounded-xl bg-white/10 dark:bg-dark/40 light:bg-white p-8 border dark:border-white/[0.1] light:border-black shadow-lg transform hover:-translate-y-1 hover:shadow-xl transition-all"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(0,0,0,0.1))',
              boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1)'
            }}
          >
            <div className="relative z-10">
              <h2 className="text-2xl font-semibold text-white dark:text-white light:text-black mb-4">Who is Zoe?</h2>
              <div className="space-y-4 text-gray-300 dark:text-gray-300 light:text-black">
                <p>
                  Zoe is a specialized AI assistant, carefully adapted to serve as your personal companion and guide. 
                  She combines advanced artificial intelligence with extensive knowledge to provide meaningful insights 
                  and support for your daily tasks and learning endeavors.
                </p>
                <p>
                  Unlike traditional AI models, Zoe has been specifically trained to understand and discuss a wide range 
                  of topics, ensuring she can assist you effectively in various aspects of your personal and professional life. 
                  She approaches each interaction with efficiency and intelligence, drawing from her extensive knowledge base 
                  while maintaining respect for diverse perspectives.
                </p>
                <p>
                  On CStudios, Zoe helps users by:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Providing detailed explanations and insights on various topics</li>
                  <li>Offering guidance and suggestions for personal development</li>
                  <li>Answering questions and solving problems across multiple domains</li>
                  <li>Assisting with planning and organization</li>
                  <li>Facilitating meaningful and productive discussions</li>
                </ul>
              </div>
            </div>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {aiAgentFeatures.map((feature) => (
            <div
              key={feature.title}
              className="relative rounded-xl bg-white/10 dark:bg-dark/40 light:bg-white p-8 h-full transition-all border dark:border-white/[0.1] light:border-black shadow-lg transform hover:-translate-y-1 hover:shadow-xl"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(0,0,0,0.1))',
                boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1)'
              }}
            >
              <div className="relative z-10">
                <div className={`relative flex h-16 w-16 items-center justify-center rounded-full ${feature.bgColor} mb-6 border border-black/10 transform hover:scale-105 transition-transform`}>
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
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
            </div>
          ))}
        </div>

        <div className="mt-16">
          <div 
            className="relative rounded-xl bg-white/10 dark:bg-dark/40 light:bg-white p-8 border dark:border-white/[0.1] light:border-black shadow-lg transform hover:-translate-y-1 hover:shadow-xl transition-all"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(0,0,0,0.1))',
              boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1)'
            }}
          >
            <div className="relative z-10">
              <h2 className="text-2xl font-semibold text-white dark:text-white light:text-black mb-4">Ethical Considerations</h2>
              <div className="space-y-4 text-gray-300 dark:text-gray-300 light:text-black">
                <p>
                  Zoe operates with a strong ethical framework, designed to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Respect all user preferences and privacy</li>
                  <li>Maintain appropriate boundaries in assistance</li>
                  <li>Acknowledge her role as an AI assistant, not a replacement for human expertise</li>
                  <li>Protect user data and confidentiality</li>
                  <li>Provide accurate and well-researched information</li>
                </ul>
                <p className="mt-6">
                  While Zoe is a powerful tool for personal growth and knowledge enhancement, she is designed to complement, 
                  not replace, traditional methods of learning and human interaction. She encourages users to maintain connections 
                  with their communities and experts while providing additional support for their personal and professional journeys.
                </p>
              </div>
            </div>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
          </div>
        </div>
      </div>
    </>
  );
}