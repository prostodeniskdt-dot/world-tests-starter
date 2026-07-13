import { requireServerAdmin } from "@/lib/auth-server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireServerAdmin();
  return <>{children}</>;
}
