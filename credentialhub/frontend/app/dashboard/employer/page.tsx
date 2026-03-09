"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useEmployerViewStore } from "@/lib/store/employer-view-store";

export default function EmployerDashboardPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const viewedWorkers = useEmployerViewStore((state) => state.viewedWorkers);

  const recentlyViewed = useMemo(() => viewedWorkers.slice(0, 5), [viewedWorkers]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Employer Portal</CardTitle>
          <CardDescription>
            Browse worker profiles and review credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Total workers viewed</p>
            <p className="text-2xl font-semibold">{viewedWorkers.length}</p>
          </div>
          <div className="rounded-lg border p-4 md:col-span-2">
            <p className="mb-3 text-sm text-muted-foreground">Quick search</p>
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const value = search.trim();
                router.push(
                  value
                    ? `/dashboard/employer/workers?search=${encodeURIComponent(value)}`
                    : "/dashboard/employer/workers",
                );
              }}
            >
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search workers by name or competency"
              />
              <Button type="submit">Search</Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recently Viewed Workers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentlyViewed.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No workers viewed yet.
            </p>
          ) : null}
          {recentlyViewed.map((worker) => (
            <div
              key={worker.worker_id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">{worker.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  Viewed {new Date(worker.viewed_at).toLocaleString()}
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/employer/workers/${worker.worker_id}`}>
                  View profile
                </Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
