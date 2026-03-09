"use client";

import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getWorkerCompliance } from "@/lib/worker-api-client";
import { workerQueryKeys } from "@/lib/worker-query-keys";

const complianceBadgeClass: Record<string, string> = {
  compliant: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  non_compliant: "border-red-200 bg-red-50 text-red-700",
  incomplete: "border-slate-200 bg-slate-100 text-slate-700",
};

function formatDate(value: string | null): string {
  if (!value) return "N/A";
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

function prettyComplianceStatus(value: string): string {
  return value.replace("_", " ").toUpperCase();
}

export default function WorkerCompliancePage() {
  const { data, isLoading } = useQuery({
    queryKey: workerQueryKeys.compliance,
    queryFn: getWorkerCompliance,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Loading compliance data...
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Unable to load compliance data.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Compliance Monitoring</CardTitle>
          <CardDescription>
            Track credential risk and overall compliance status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium">Compliance Status</p>
            <Badge
              variant="outline"
              className={complianceBadgeClass[data.compliance_status] ?? complianceBadgeClass.incomplete}
            >
              {prettyComplianceStatus(data.compliance_status)}
            </Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Total credentials</p>
              <p className="text-xl font-semibold">{data.credential_summary.total_count}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Valid</p>
              <p className="text-xl font-semibold text-emerald-700">
                {data.credential_summary.valid_count}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Expiring</p>
              <p className="text-xl font-semibold text-amber-700">
                {data.credential_summary.expiring_count}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Expired</p>
              <p className="text-xl font-semibold text-red-700">
                {data.credential_summary.expired_count}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Last compliance check:{" "}
            {data.last_compliance_check
              ? new Date(data.last_compliance_check).toLocaleString()
              : "N/A"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expiring Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.expiring_credentials.length === 0 ? (
            <p className="text-sm text-muted-foreground">No credentials expiring soon.</p>
          ) : null}
          {data.expiring_credentials.map((credential) => (
            <div key={credential.id} className="rounded-lg border p-3">
              <p className="font-medium">{credential.credential_name}</p>
              <p className="text-sm text-muted-foreground">
                {credential.issuing_organization}
              </p>
              <p className="text-sm text-muted-foreground">
                Expires: {formatDate(credential.expiration_date)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expired Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.expired_credentials.length === 0 ? (
            <p className="text-sm text-muted-foreground">No expired credentials.</p>
          ) : null}
          {data.expired_credentials.map((credential) => (
            <div key={credential.id} className="rounded-lg border p-3">
              <p className="font-medium">{credential.credential_name}</p>
              <p className="text-sm text-muted-foreground">
                {credential.issuing_organization}
              </p>
              <p className="text-sm text-muted-foreground">
                Expired: {formatDate(credential.expiration_date)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
