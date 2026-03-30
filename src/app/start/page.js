import { redirect } from "next/navigation";

/** Entry point for the voice session (shared link for this subdomain). */
export default function StartSessionRedirect() {
  redirect("/session?mode=calm_support&voice=female&recording=0");
}
