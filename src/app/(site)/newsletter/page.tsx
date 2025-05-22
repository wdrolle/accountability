import { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import NewsletterForm from "./NewsletterForm";

export const metadata: Metadata = {
  title: "Newsletter | CStudios",
  description: "Subscribe to our newsletter to receive CStudios messages and updates.",
};

export default function NewsletterPage() {
  return (
    <>
    <Breadcrumb pageTitle="Newsletter" />
      <NewsletterForm />
    </>
  );
} 