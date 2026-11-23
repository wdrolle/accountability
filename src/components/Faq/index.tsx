"use client";

import React from 'react';
import SectionTitle from "../Common/SectionTitle";
import faqData from "./faqData";
import SingleFaq from "./SingleFaq";
import ContactSection from './ContactSection';

const Faq = () => {
  const renderAnswer = (answer: string) => {
    if (answer === "<ContactSection />") {
      return <ContactSection />;
    }
    return answer;
  };

  return (
    <section className="relative overflow-hidden pb-17.5 pt-10 lg:pb-22.5 lg:pt-10 xl:pb-27.5">
      {/* <!-- divider --> */}
      <div className="about-divider-gradient absolute left-1/2 top-0 h-[1px] w-full max-w-[1170px] -translate-x-1/2"></div>

      <div className="mx-auto max-w-[770px] px-4 sm:px-8 xl:px-0">
        <SectionTitle
          subTitle="Questions about the journal?"
          title="Frequently Asked Questions"
          paragraph="A private journal with optional AI assistance for insights, reminders, and everyday lists. Not a therapy replacement — in a crisis, call or text 988."
        />

        <div className="wow fadeInUp">
          {faqData.map((faq, key) => (
            <SingleFaq key={key} faq={{ ...faq, answer: renderAnswer(faq.answer) }} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Faq;
