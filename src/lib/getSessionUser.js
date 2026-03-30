import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/authSession";
import { getUserById } from "@/lib/userStore";

export async function getSessionUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const userId = await verifySessionToken(token);
  if (!userId) return null;
  const user = getUserById(userId);
  if (!user) return null;
  return user;
}
