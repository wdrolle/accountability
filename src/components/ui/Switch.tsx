'use client'

import { useState } from 'react'

interface SwitchProps {
  label: string;
  isSelected: boolean;
  onChange: (selected: boolean) => void;
  disabled?: boolean;
}

export function Switch({ label, isSelected, onChange, disabled = false }: SwitchProps) {
  const handleClick = () => {
    if (!disabled) {
      onChange(!isSelected)
    }
  }

  return (
    <div className="flex items-center space-x-3">
      <button
        type="button"
        role="switch"
        aria-checked={isSelected}
        onClick={handleClick}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full 
          border-2 border-transparent transition-colors duration-200 ease-in-out 
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isSelected ? 'bg-indigo-600' : 'bg-gray-200'}
        `}
      >
        <span
          aria-hidden="true"
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full 
            bg-white shadow ring-0 transition duration-200 ease-in-out
            ${isSelected ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
      <span className="text-sm font-medium text-gray-900">{label}</span>
    </div>
  )
} 