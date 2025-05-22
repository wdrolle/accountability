import CallToAction from "@/components/CallToAction";
import Clients from "@/components/Home/Clients";
import Features from "@/components/Home/Features";
import FeaturesList from "@/components/Home/FeaturesList";
import Hero from "@/components/Home/Hero";
import Reviews from "@/components/Home/Reviews";
import Newsletter from "@/components/Newsletter";
import Pricing from "@/components/Pricing";
import Support from "@/components/Support";
import { Metadata } from "next";
import { integrations } from "../../../integrations.config";

export const metadata: Metadata = {
  title: "CStudios",
  description: "This is Home for CStudios",
  // other metadata
};

export default function Home() {
  return (
    <>
      <Hero />
      {/* <Features /> */}
      {/* <FeaturesList /> */}
      <Pricing />
      <section className="relative z-20 overflow-hidden pb-20 pt-22.5 lg:pt-27.5 xl:pt-32.5 2xl:pt-45">
        <Reviews />
      </section>
      <Clients />
      <Support />
      <CallToAction />
      <Newsletter />
    </>
  );
}
