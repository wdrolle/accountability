import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  redirect("/api/auth/hub-signin?next=/journal");
}
