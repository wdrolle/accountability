"use client";

import axios from "axios";
import Image from "next/image";
import OfferItem from "./OfferItem";
import { integrations, messages } from "../../../integrations.config";
import toast from "react-hot-toast";

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number | null;
  productId: string | null;
  features: string[];
  popular?: boolean;
  contactSales?: boolean;
}

interface MultiPricingProps {
  plans?: PricingPlan[];
}

const MultiPricing = ({ plans = [] }: MultiPricingProps) => {
  if (!plans || plans.length === 0) {
    return null;
  }

  const handleSubscription = async (productId: string | null, planName: string) => {
    if (!productId) {
      window.location.href = '/contact?subject=Custom Pricing Inquiry';
      return;
    }

    if (!integrations?.isStripeEnabled) {
      toast.error(messages.stripe);
      return;
    }

    try {
      const response = await axios.post(
        "/api/payment",
        {
          priceId: productId,
          mode: 'subscription',
          successUrl: `${window.location.origin}/success`,
          cancelUrl: `${window.location.origin}/pricing`,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data?.url) {
        window.location.assign(response.data.url);
      } else {
        throw new Error('Invalid response from payment API');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to process subscription. Please try again later.');
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter':
        return "./images/pricing/pricing-icon-01.svg";
      case 'premium':
        return "./images/pricing/pricing-icon-02.svg";
      case 'family':
        return "./images/pricing/pricing-icon-03.svg";
      case 'custom':
        return "./images/pricing/pricing-icon-04.svg";
      default:
        return "./images/pricing/pricing-icon-01.svg";
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className="relative rounded-xl bg-white/10 dark:bg-dark/40 light:bg-white p-6 border dark:border-white/[0.1] light:border-black shadow-lg transform hover:-translate-y-1 hover:shadow-xl transition-all flex flex-col"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.1), rgba(0,0,0,0.1))',
            boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1)'
          }}
        >
          <div className="relative z-10 flex-grow">
            <span className="absolute right-0 top-0 transform hover:scale-105 transition-transform">
              <Image
                src={getPlanIcon(plan.id)}
                alt={`${plan.name} icon`}
                width={36}
                height={36}
              />
            </span>

            <h3 className="mb-3 text-xl font-bold text-white dark:text-white light:text-black transform hover:-translate-y-0.5 transition-transform">
              {plan.name}
            </h3>

            <div className="flex items-baseline gap-2">
              {plan.price !== null ? (
                <>
                  <h2 className="text-2xl font-bold text-white dark:text-white light:text-black transform hover:-translate-y-0.5 transition-transform">
                    ${plan.price}
                  </h2>
                  <p className="text-sm font-medium text-gray-400 dark:text-gray-400 light:text-black/80">
                    USD/month
                  </p>
                </>
              ) : (
                <h2 className="text-2xl font-bold text-white dark:text-white light:text-black transform hover:-translate-y-0.5 transition-transform">
                  Custom Pricing
                </h2>
              )}
            </div>

            <div className="pricing-gradient-divider my-4 h-[1px] w-full"></div>

            <ul className="flex flex-col gap-2.5 mb-4">
              {plan.features.map((feature, index) => (
                <OfferItem key={index} text={feature} />
              ))}
            </ul>
          </div>

          <div className="mt-auto">
            <div className="flex items-center justify-center">
              <button
                aria-label={plan.contactSales ? 'Contact Sales' : 'Get the plan'}
                onClick={() => handleSubscription(plan.productId, plan.name)}
                className="relative flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white dark:text-white light:text-black transition-all duration-300 ease-in-out hover:shadow-button transform hover:-translate-y-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
              >
                {plan.contactSales ? 'Contact Sales' : 'Get the plan'}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 17 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="transform group-hover:translate-x-0.5 transition-transform"
                >
                  <path
                    d="M14.8992 7.5999L9.72422 2.3499C9.49922 2.1249 9.14922 2.1249 8.92422 2.3499C8.69922 2.5749 8.69922 2.9249 8.92422 3.1499L13.1242 7.4249H2.49922C2.19922 7.4249 1.94922 7.6749 1.94922 7.9749C1.94922 8.2749 2.19922 8.5499 2.49922 8.5499H13.1742L8.92422 12.8749C8.69922 13.0999 8.69922 13.4499 8.92422 13.6749C9.02422 13.7749 9.17422 13.8249 9.32422 13.8249C9.47422 13.8249 9.62422 13.7749 9.72422 13.6499L14.8992 8.3999C15.1242 8.1749 15.1242 7.8249 14.8992 7.5999Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>

            <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-400 light:text-black/80">
              No extra hidden charge
            </p>
          </div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
        </div>
      ))}
    </div>
  );
};

export default MultiPricing; 