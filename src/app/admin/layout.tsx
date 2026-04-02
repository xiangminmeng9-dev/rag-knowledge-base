import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminLayout from "@/components/layout/admin-layout";

export default async function AdminRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "SUPER_ADMIN" && role !== "KB_ADMIN") {
    redirect("/");
  }

  return <AdminLayout>{children}</AdminLayout>;
}
