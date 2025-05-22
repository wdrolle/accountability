"use client";
import { motion } from "framer-motion";
import Breadcrumb from "@/components/Breadcrumb";
const AIServicesHero = () => {
  return (
    <>
    <Breadcrumb pageTitle="Advanced AI Services" />
    <section className="relative z-10 overflow-hidden pb-1 pt-3 md:pb-2 lg:pb-2 lg:pt-[18px]">
      <div className="container">
        <div className="-mx-4 flex flex-wrap">
          <div className="w-full px-4">
            <div className="mx-auto max-w-[800px] text-center">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-1 text-base !leading-relaxed light:text-body-color dark:text-body-color md:text-lg"
              >
                Powerful AI integration with multiple LLM options, voice synthesis, and speech recognition capabilities.
              </motion.p>
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
};

export default AIServicesHero; 