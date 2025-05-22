// /src/components/Card/CardHeader.tsx

import React from 'react';
import classNames from 'classnames';

interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
  color?: 'primary' | 'info' | 'success' | 'warning' | 'danger';
  plain?: boolean;
}

export default function CardHeader(props: CardHeaderProps) {
  const { className, children, color, plain, ...rest } = props;
  const cardHeaderClasses = classNames({
    'px-6 py-4 rounded-lg -mt-6 mx-4': true,
    'bg-gradient-to-r shadow-md': !plain && color,
    'from-indigo-500 to-purple-600': color === 'primary',
    'from-blue-400 to-blue-600': color === 'info',
    'from-green-400 to-green-600': color === 'success',
    'from-yellow-400 to-yellow-600': color === 'warning',
    'from-red-400 to-red-600': color === 'danger',
    'text-white': color,
    [className || '']: className !== undefined
  });
  return (
    <div className={cardHeaderClasses} {...rest}>
      {children}
    </div>
  );
} 