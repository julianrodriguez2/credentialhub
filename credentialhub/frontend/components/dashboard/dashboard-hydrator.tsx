"use client";

import { useEffect } from "react";

import type { SessionUser } from "@/lib/auth";
import { useAuthStore } from "@/lib/store/auth-store";

type DashboardHydratorProps = {
  user: SessionUser;
};

export function DashboardHydrator({ user }: DashboardHydratorProps) {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    setUser(user);
  }, [setUser, user]);

  return null;
}