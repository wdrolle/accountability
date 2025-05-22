'use client';

import { Suspense } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import Faq from "@/components/Faq";
import PricingGrids from '@/components/Pricing/PricingGrids';
import { pricingData } from '@/stripe/pricingData';

const pricingPlans = [
  {
    id: 'starter',
    name: 'STARTER',
    description: 'Perfect for individuals starting their spiritual journey.',
    price: 5,
    productId: pricingData[0].id,
    features: [
      '1 CStudios Message',
      '20 AI Chat Messages per Month',
      'Basic Website Access',
      'Blog Access',
      'Single User Account',
      'Standard Support'
    ],
    popular: false
  },
  {
    id: 'premium',
    name: 'PREMIUM',
    description: 'Enhanced features for a deeper spiritual experience.',
    price: 10,
    productId: pricingData[1].id,
    features: [
      '2 CStudios Messages',
      '50 AI Chat Messages per Month',
      'Full Website Access',
      'Premium Blog Content',
      'Advanced Prayer Resources',
      'Scripture Search Tools',
      'Community Access',
      'Priority Support'
    ],
    popular: true
  },
  {
    id: 'family',
    name: 'FAMILY & FRIENDS',
    description: 'Share your spiritual journey with your loved ones.',
    price: 25,
    productId: pricingData[2].id,
    features: [
      '2 Daily Messages for Each Family Member',
      '50 AI Chats per Month per Member',
      'Full Access for up to 5 Family Members',
      'Family Prayer Dashboard',
      'Shared Prayer Requests',
      'Family Study Resources',
      'Community Access',
      'Premium Support'
    ],
    popular: false
  },
  {
    id: 'custom',
    name: 'CUSTOM',
    description: 'Tailored solutions for religious organizations.',
    price: null,
    productId: null,
    features: [
      'Customized Daily Messages',
      'Unlimited AI Chat Messages',
      'Full Platform Access',
      'Organization Dashboard',
      'Bulk User Management',
      'Custom Integration Options',
      'Dedicated Account Manager',
      'Priority Support'
    ],
    contactSales: true,
    popular: false
  }
];

export default function PricingPage() {
  return (
    <>
      <Breadcrumb pageTitle="Pricing" />
      <section className="relative z-10 pb-12 pt-10">
        <div className="container mx-auto">
          <Suspense fallback={<div>Loading...</div>}>
            <PricingGrids plans={pricingPlans} />
          </Suspense>
        </div>
      </section>
    </>
  );
}