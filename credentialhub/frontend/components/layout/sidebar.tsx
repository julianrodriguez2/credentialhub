"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { type Role } from "@/lib/auth";
import { useAuthStore } from "@/lib/store/auth-store";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type SidebarProps = {
  email: string;
  role: Role;
};

const navItemsByRole: Record<Role, Array<{ href: string; label: string }>> = {
  worker: [
    { href: "/dashboard/worker/profile", label: "Profile" },
    { href: "/dashboard/worker/experience", label: "Experience" },
    { href: "/dashboard/worker/competencies", label: "Competencies" },
    { href: "/dashboard/worker/references", label: "References" },
  ],
  employer: [{ href: "/dashboard/employer", label: "Dashboard" }],
  admin: [{ href: "/dashboard/admin", label: "Dashboard" }],
};

export function Sidebar({ email, role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const clearUser = useAuthStore((state) => state.clearUser);
  const navItems = navItemsByRole[role];

  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    clearUser();
    router.push("/login");
    router.refresh();
  };

  return (
    <Card className="sticky top-6 hidden h-fit w-72 p-5 lg:block">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">CredentialHub</p>
        <p className="text-sm font-semibold">{email}</p>
        <p className="text-xs text-muted-foreground">{role.toUpperCase()}</p>
      </div>

      <nav className="mt-6 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-md px-3 py-2 text-sm",
              pathname === item.href || pathname.startsWith(`${item.href}/`)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <Button className="mt-6 w-full" variant="outline" onClick={onLogout}>
        Logout
      </Button>
    </Card>
  );
}
