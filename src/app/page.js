import { redirect } from "next/navigation";

/**
 * Marketing landing is disabled for this subdomain — users go straight into the flow.
 * Previous full-page marketing content lived here (see git history).
 */
export default function HomePage() {
  redirect("/start");
}
