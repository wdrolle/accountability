import Login from "@/components/Auth/Login";
import Breadcrumb from "@/components/Breadcrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In | CStudios",
  description: "This is Log In page for CStudios",
  // other metadata
};

const LoginPage = () => {
  return (
    <>
      <Breadcrumb pageTitle="Log In" />
      <Login />
    </>
  );
};

export default LoginPage;
