import Signup from "@/components/Auth/Signup";
import Breadcrumb from "@/components/Breadcrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up | CStudios",
  description: "This is Sign up for CStudios",
  // other metadata
};

const SignupPage = () => {
  return (
    <>
      <Breadcrumb pageTitle="Sign up" />

      <Signup />
    </>
  );
};

export default SignupPage;
