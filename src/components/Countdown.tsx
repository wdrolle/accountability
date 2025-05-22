'use client';

import React, { useEffect, useState } from 'react';

interface CountdownProps {
  isActive: boolean;
  onComplete: () => void;
  onCancel: () => void;
}

export function Countdown({ isActive, onComplete, onCancel }: CountdownProps) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isActive && count > 0) {
      timer = setTimeout(() => {
        setCount(prev => prev - 1);
      }, 1000);
    } else if (count === 0 && isActive) {
      onComplete();
      setCount(3); // Reset for next use
    }

    return () => {
      clearTimeout(timer);
    };
  }, [count, isActive, onComplete]);

  useEffect(() => {
    if (isActive) {
      setCount(3); // Reset counter when activated
    }
  }, [isActive]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-background p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Processing in</h2>
        <div className="text-4xl font-bold mb-4">{count}</div>
        <button
          onClick={() => {
            onCancel();
            setCount(3); // Reset counter
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Cancel
        </button>
      </div>
    </div>
  );
} 