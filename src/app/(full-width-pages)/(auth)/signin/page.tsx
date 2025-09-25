import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Superadmin Login | Hana Voice SaaS",
  description: "Superadmin login page for Hana Voice SaaS platform",
};

export default function SignIn() {
  return <SignInForm />;
}
