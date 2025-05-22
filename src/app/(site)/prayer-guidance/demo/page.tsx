import { Metadata } from "next";
import PrayerGuidanceDemo from "@/components/Prayer/PrayerGuidanceDemo";

export const metadata: Metadata = {
  title: "Prayer Guidance Demo",
  description: "Experience a demo of our AI-powered prayer guidance analysis",
};

export default function PrayerGuidanceDemoPage() {
  // Demo user ID
  const DEMO_USER_ID = "3509c6b9-c8d9-b406-b61d-4fed23d2fcbe";
  
  return <PrayerGuidanceDemo demoUserId={DEMO_USER_ID} />;
} 