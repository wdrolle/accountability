import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AccessRequired() {
  redirect("/api/auth/hub-signin?next=/journal");
}
