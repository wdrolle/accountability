import { Metadata } from "next";
import AIServicesHero from "@/components/AIServices/Hero";
import AIServicesList from "@/components/AIServices/ServicesList";
import CallToAction from "@/components/CallToAction";

export const metadata: Metadata = {
  title: "AI Services - CStudios",
  description: "Advanced AI services including LLM integration, voice synthesis, and speech recognition",
};

export default function AIServicesPage() {
  return (
    <>
      <AIServicesHero />
      <AIServicesList />
      <CallToAction />
    </>
  );
} 