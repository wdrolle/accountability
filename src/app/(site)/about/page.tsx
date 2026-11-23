import AboutSection from "@/components/About/AboutSection";
import Breadcrumb from "@/components/Breadcrumb";
import CallToAction from "@/components/CallToAction";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Amorolle Journal",
  description: "A private journal with AI assistance for reflection, reminders, lists, and everyday life — not a therapy replacement.",
};

const AboutPage = () => {
  return (
    <>
      <Breadcrumb pageTitle="About Us" />
      <AboutSection />
      <CallToAction />
    </>
  );
};

export default AboutPage;
