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
          subTitle="Questions About our CStudios?"
          title="Frequently Asked Questions"
          paragraph="Welcome to CStudios Messaging and Blog! Receive CStudios messages and explore insightful blog posts to inspire and uplift your spirit."
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
