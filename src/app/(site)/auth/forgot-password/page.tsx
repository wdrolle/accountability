import React from "react";
import Breadcrumb from "@/components/Breadcrumb";
import ForgotPassword from "@/components/Auth/ForgotPassword";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | CStudios",
  description: "This is Forgot Password page for CStudios",
  // other metadata
};

const ForgotPasswordPage = () => {
  return (
    <>
      <Breadcrumb pageTitle="Forgot Password" />
      <ForgotPassword />
    </>
  );
};

export default ForgotPasswordPage;
