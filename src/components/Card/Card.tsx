// /src/components/Card/Card.tsx

import React from 'react';
import classNames from 'classnames';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  plain?: boolean;
  carousel?: boolean;
}

export default function Card(props: CardProps) {
  const { className, children, plain, carousel, ...rest } = props;
  const cardClasses = classNames({
    'relative flex flex-col min-w-0 break-words rounded-lg shadow-lg': true,
    'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700': !plain,
    'no-shadow': plain,
    'break-words': carousel,
    'bg-[url(/images/cta/grid.svg)]': true,
    [className || '']: className !== undefined
  });
  return (
    <div className={cardClasses} {...rest}>
      {children}
    </div>
  );
}