"use client";
import { motion } from "framer-motion";

const services = [
  {
    title: "Multiple LLM Options",
    description: [
      "Groq (Primary Brain) - Fast inference, high performance",
      "Deepseek-v3 - Advanced reasoning capabilities",
      "Ollama Integration - Local models support (phi4 and others)",
      "Flexible model switching"
    ]
  },
  {
    title: "Voice Synthesis",
    description: [
      "Kokoro TTS - High-quality, fast synthesis",
      "ElevenLabs - Cloud-based alternative",
      "Local System TTS - Fallback option",
      "Voice mixing and customization"
    ]
  },
  {
    title: "Speech Recognition",
    description: [
      "Groq Whisper (large-v3-turbo) - High accuracy",
      "RealtimeSTT - Local processing, low latency",
      "Seamless switching between modes"
    ]
  }
];

const AIServicesList = () => {
  return (
    <section className="relative z-10 bg-primary/[.03] py-1 md:py-2 lg:py-2">
      <div className="container">
        <div className="grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="w-full"
            >
              <div className="wow fadeInUp rounded-md bg-white p-8 shadow-three dark:bg-gray-dark lg:px-5 xl:px-8">
                <h3 className="mb-5 text-xl font-bold text-black dark:text-black">
                  {service.title}
                </h3>
                <ul className="list-disc pl-5 space-y-4">
                  {service.description.map((item, idx) => (
                    <li key={idx} className="text-base light:text-black dark:text-black">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AIServicesList; 