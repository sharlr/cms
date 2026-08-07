import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/AuthLayout";
import { getSessionUserId } from "@/lib/auth";
import { ContestAdminLoginForm } from "./ContestAdminLoginForm";

export const metadata = { title: "Contest Admin Login" };

export default async function ContestAdminPage() {
  if (await getSessionUserId()) redirect("/admin");

  return (
    <AuthLayout
      title="Contest Administrator"
      subtitle="Access the contest administration panel to manage questions, contests, and view reports."
      footer={
        <p>
          Not a contest admin? <a href="/" className="font-semibold text-brand-600 underline">Return to home</a>
        </p>
      }
    >
      <ContestAdminLoginForm />
    </AuthLayout>
  );
}
