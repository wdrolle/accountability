// /src/components/Card/CardBody.tsx

import React from 'react';
import classNames from 'classnames';

interface CardBodyProps {
  className?: string;
  children: React.ReactNode;
}

export default function CardBody(props: CardBodyProps) {
  const { className, children, ...rest } = props;
  const cardBodyClasses = classNames({
    'flex-auto p-6': true,
    [className || '']: className !== undefined
  });
  return (
    <div className={cardBodyClasses} {...rest}>
      {children}
    </div>
  );
} 