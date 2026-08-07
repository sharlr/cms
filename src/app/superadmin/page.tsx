import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/AuthLayout";
import { getSessionUserId } from "@/lib/auth";
import { SuperAdminLoginForm } from "./SuperAdminLoginForm";

export const metadata = { title: "System Admin Login" };

export default async function SuperAdminPage() {
  if (await getSessionUserId()) redirect("/admin");

  return (
    <AuthLayout
      title="System Administrator"
      subtitle="Access the system administration panel to manage contest administrators and system settings."
      footer={
        <p>
          Not an admin? <a href="/" className="font-semibold text-brand-600 underline">Return to home</a>
        </p>
      }
    >
      <SuperAdminLoginForm />
    </AuthLayout>
  );
}
