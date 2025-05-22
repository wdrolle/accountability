// /src/components/CustomButtons/Button.tsx

import React from 'react';
import classNames from 'classnames';

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  color?: 'transparent' | 'white' | 'primary' | 'info' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl' | '10xl';
  simple?: boolean;
  round?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export default function Button(props: ButtonProps) {
  const {
    color,
    round,
    children,
    fullWidth,
    disabled,
    simple,
    size,
    type,
    className,
    ...rest
  } = props;

  const btnClasses = classNames({
    'inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm transition-all duration-150 ease-in-out': true,
    'rounded-full': round,
    'w-full': fullWidth,
    'opacity-60 cursor-not-allowed': disabled,
    'text-white bg-gradient-to-r hover:opacity-80': !simple && color !== 'white' && color !== 'transparent',
    'from-indigo-500 to-purple-600': color === 'primary',
    'from-blue-400 to-blue-600': color === 'info',
    'from-green-400 to-green-600': color === 'success',
    'from-yellow-400 to-yellow-600': color === 'warning',
    'from-red-400 to-red-600': color === 'danger',
    'bg-white text-gray-700': color === 'white',
    'bg-transparent': color === 'transparent',
    'text-sm px-4 py-2': size === 'sm',
    'text-lg px-8 py-4': size === 'lg',
    'text-xl px-10 py-5': size === 'xl',
    'text-2xl px-12 py-6': size === '2xl',
    'text-3xl px-14 py-7': size === '3xl',
    'text-4xl px-14 py-7': size === '4xl',
    'text-5xl px-16 py-8': size === '5xl',
    'text-6xl px-18 py-9': size === '6xl',
    'text-7xl px-20 py-10': size === '7xl',
    'text-8xl px-22 py-11': size === '8xl',
    'text-9xl px-24 py-12': size === '9xl',
    'text-10xl px-26 py-13': size === '10xl',
    [className || '']: className !== undefined
  });

  return (
    <button
      type={type}
      disabled={disabled}
      className={btnClasses}
      {...rest}
    >
      {children}
    </button>
  );
} 