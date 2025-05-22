import React from "react";

import { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import ResetPassword from "@/components/Auth/ResetPassword";

export const metadata: Metadata = {
  title: "Reset Password | CStudios",
  description: "This is Reset Password page for CStudios",
  // other metadata
};

const ResetPasswordPage = async (props: { params: Promise<{ token: string }> }) => {
  const params = await props.params;
  return (
    <>
      <Breadcrumb pageTitle="Reset Password" />
      <ResetPassword token={params.token!} />
    </>
  );
};

export default ResetPasswordPage;
