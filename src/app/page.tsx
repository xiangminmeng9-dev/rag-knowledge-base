import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function RootPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as { role?: string }).role;

  if (role === "SUPER_ADMIN" || role === "KB_ADMIN") {
    redirect("/admin/dashboard");
  }

  // QA_USER or any other role goes to chat
  redirect("/chat");
}
