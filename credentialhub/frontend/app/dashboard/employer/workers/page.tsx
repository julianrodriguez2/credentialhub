"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getEmployerWorkers,
  type EmployerWorkerQueryParams,
} from "@/lib/employer-api-client";
import { employerQueryKeys } from "@/lib/employer-query-keys";

export default function EmployerWorkersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [yearsExperience, setYearsExperience] = useState(
    searchParams.get("years_experience") ?? "",
  );
  const [credentialStatus, setCredentialStatus] = useState(
    searchParams.get("credential_status") ?? "",
  );

  const filters = useMemo<EmployerWorkerQueryParams>(() => {
    const years = yearsExperience.trim()
      ? Number(yearsExperience.trim())
      : undefined;

    return {
      search: search.trim() || undefined,
      years_experience:
        typeof years === "number" && !Number.isNaN(years) ? years : undefined,
      credential_status:
        credentialStatus === "valid" ||
        credentialStatus === "expiring" ||
        credentialStatus === "expired"
          ? credentialStatus
          : undefined,
    };
  }, [search, yearsExperience, credentialStatus]);

  const { data = [], isLoading } = useQuery({
    queryKey: employerQueryKeys.workers(filters),
    queryFn: () => getEmployerWorkers(filters),
  });

  const applyFilters = () => {
    const query = new URLSearchParams();
    if (filters.search) query.set("search", filters.search);
    if (typeof filters.years_experience === "number") {
      query.set("years_experience", String(filters.years_experience));
    }
    if (filters.credential_status) {
      query.set("credential_status", filters.credential_status);
    }
    const suffix = query.toString() ? `?${query.toString()}` : "";
    router.push(`/dashboard/employer/workers${suffix}`);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Worker Directory</CardTitle>
          <CardDescription>
            Search workers by competency, experience, and credential health.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or competency"
          />
          <Input
            type="number"
            min={0}
            value={yearsExperience}
            onChange={(event) => setYearsExperience(event.target.value)}
            placeholder="Min years experience"
          />
          <select
            value={credentialStatus}
            onChange={(event) => setCredentialStatus(event.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Any credential status</option>
            <option value="valid">Valid</option>
            <option value="expiring">Expiring</option>
            <option value="expired">Expired</option>
          </select>
          <Button onClick={applyFilters}>Apply Filters</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {!isLoading && data.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="p-6 text-sm text-muted-foreground">
              No workers match the selected filters.
            </CardContent>
          </Card>
        ) : null}

        {data.map((worker) => (
          <Card key={worker.worker_id}>
            <CardHeader>
              <CardTitle>{worker.full_name}</CardTitle>
              <CardDescription>
                {worker.years_experience} years experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Top competencies</p>
                <div className="flex flex-wrap gap-2">
                  {worker.top_competencies.length > 0 ? (
                    worker.top_competencies.map((item) => (
                      <Badge key={item} variant="secondary">
                        {item}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No competencies listed.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs">
                <Badge variant="outline" className="justify-center border-emerald-200 bg-emerald-50 text-emerald-700">
                  Valid: {worker.credential_summary.valid}
                </Badge>
                <Badge variant="outline" className="justify-center border-amber-200 bg-amber-50 text-amber-700">
                  Expiring: {worker.credential_summary.expiring}
                </Badge>
                <Badge variant="outline" className="justify-center border-red-200 bg-red-50 text-red-700">
                  Expired: {worker.credential_summary.expired}
                </Badge>
                <Badge variant="outline" className="justify-center">
                  Total: {worker.credential_summary.total}
                </Badge>
              </div>

              <Button asChild>
                <Link href={`/dashboard/employer/workers/${worker.worker_id}`}>
                  View Profile
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
