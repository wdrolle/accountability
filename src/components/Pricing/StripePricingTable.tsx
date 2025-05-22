'use client';

import React, { useState, useEffect } from 'react';
import Script from 'next/script';

const STRIPE_PRICING_TABLE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID || 'prctbl_1QbTR9RugV4BcfiwCchRQ7sT';
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_live_51Qb6rVRugV4BcfiwWyh6TRJVuMDqp8iaR8u7KB6oPCzPDtjCB4YT9kHOabhDeT9UPHpjRd2cypJATi0SO2zcWTvs00KCwlGlTa';

const StripePricingTable = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Reset error state when retrying
    if (retryCount > 0) {
      setError(null);
      setIsLoading(true);
    }
  }, [retryCount]);

  const handleScriptLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleScriptError = () => {
    setError('Failed to load pricing table');
    setIsLoading(false);
  };

  const handleRetry = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
    }
  };

  // Using a dynamic element to avoid TypeScript errors with custom elements
  const renderPricingTable = () => {
    return React.createElement('stripe-pricing-table', {
      'pricing-table-id': STRIPE_PRICING_TABLE_ID,
      'publishable-key': STRIPE_PUBLISHABLE_KEY,
    });
  };

  return (
    <div className="stripe-pricing-table-container relative min-h-[400px]">
      <Script 
        src="https://js.stripe.com/v3/pricing-table.js"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
        onError={handleScriptError}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark/5">
          <div className="rounded-lg bg-white p-4 text-center shadow-lg">
            <div className="mb-2 text-gray-800">Loading pricing plans...</div>
            <div className="text-sm text-gray-500">Please wait while we fetch the latest pricing information</div>
          </div>
        </div>
      )}
      
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg bg-white p-6 text-center shadow-lg">
            <div className="mb-4 text-red-500">{error}</div>
            {retryCount < 3 && (
              <button
                onClick={handleRetry}
                className="rounded bg-primary px-4 py-2 text-white hover:bg-primary/90"
              >
                Retry Loading
              </button>
            )}
          </div>
        </div>
      ) : (
        renderPricingTable()
      )}
    </div>
  );
};

export default StripePricingTable; 