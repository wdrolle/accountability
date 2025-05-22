'use client';

import React, { useState } from 'react';

interface FaqProps {
  faq: {
    id: number;
    question: string;
    answer: string | React.ReactNode;
  };
}

const SingleFaq = ({ faq }: FaqProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col border-b border-white/[0.15]">
      <h3
        onClick={() => setIsOpen(!isOpen)}
        className={`flex cursor-pointer items-center justify-between py-5 text-[22px] font-semibold leading-[28px] lg:py-7 ${
          isOpen ? "text-white" : ""
        }`}
      >
        {faq.question}
        <span>
          {isOpen ? (
            <svg
              width="22"
              height="2"
              viewBox="0 0 22 2"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21.125 1.86263H0.875012C0.425012 1.86263 0.0125122 1.48763 0.0125122 1.00013C0.0125122 0.550134 0.387512 0.137634 0.875012 0.137634H21.125C21.575 0.137634 21.9875 0.512634 21.9875 1.00013C21.9875 1.45013 21.575 1.86263 21.125 1.86263Z"
                fill="white"
              />
            </svg>
          ) : (
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.5 11.1752H12.8625V1.5002C12.8625 1.0502 12.4875 0.637695 12 0.637695C11.55 0.637695 11.1375 1.0127 11.1375 1.5002V11.1752H1.50001C1.05001 11.1752 0.637512 11.5502 0.637512 12.0377C0.637512 12.4877 1.01251 12.9002 1.50001 12.9002H11.175V22.5002C11.175 22.9502 11.55 23.3627 12.0375 23.3627C12.4875 23.3627 12.9 22.9877 12.9 22.5002V12.8627H22.5C22.95 12.8627 23.3625 12.4877 23.3625 12.0002C23.3625 11.5502 22.95 11.1752 22.5 11.1752Z"
                fill=""
              />
            </svg>
          )}
        </span>
      </h3>
      <div
        className="text-body-color dark:text-body-color-dark grid text-base"
        style={{
          gridTemplateRows: `${isOpen ? "1fr" : "0fr"}`,
          transition: "grid-template-rows 300ms",
        }}
      >
        <div className="overflow-hidden transition-all duration-300">
          <div className="pb-6 pt-1 font-medium text-white/70">{faq.answer}</div>
        </div>
      </div>
    </div>
  );
};

export default SingleFaq;
