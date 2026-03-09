import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/register-form";
import { TOKEN_COOKIE_NAME } from "@/lib/constants";

export default function RegisterPage() {
  const token = cookies().get(TOKEN_COOKIE_NAME)?.value;
  if (token) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <RegisterForm />
    </main>
  );
}