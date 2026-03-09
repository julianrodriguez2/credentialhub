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
import {
  getPublicWorkerProfile,
  type PublicWorkerProfile,
} from "@/lib/public-api-client";
import { publicQueryKeys } from "@/lib/public-query-keys";

const credentialStatusClassByType = {
  valid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  expiring: "border-amber-200 bg-amber-50 text-amber-700",
  expired: "border-red-200 bg-red-50 text-red-700",
};

const complianceStatusClassByType = {
  compliant: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  non_compliant: "border-red-200 bg-red-50 text-red-700",
  incomplete: "border-slate-200 bg-slate-100 text-slate-700",
};

function formatDate(value: string | null): string {
  if (!value) return "N/A";
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

export function PublicWorkerProfileView({
  slug,
  initialData,
}: {
  slug: string;
  initialData?: PublicWorkerProfile;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: publicQueryKeys.workerProfile(slug),
    queryFn: () => getPublicWorkerProfile(slug),
    initialData,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Loading public profile...
        </CardContent>
      </Card>
    );
  }

  if (!data || error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Public profile not found.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>{data.full_name}</CardTitle>
              <CardDescription>
                {data.years_experience} years experience
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={
                complianceStatusClassByType[
                  data.compliance_status as keyof typeof complianceStatusClassByType
                ]
              }
            >
              {data.compliance_status.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Professional Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6">
            {data.bio || "No professional summary provided."}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills / Competencies</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {data.competencies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No competencies listed.</p>
          ) : null}
          {data.competencies.map((item) => (
            <Badge
              key={`${item.competency_name}-${item.years_experience}`}
              variant="secondary"
            >
              {item.competency_name} ({item.years_experience}y)
            </Badge>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Work Experience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.work_experiences.length === 0 ? (
            <p className="text-sm text-muted-foreground">No experience listed.</p>
          ) : null}
          {data.work_experiences.map((item) => (
            <div
              key={`${item.company_name}-${item.role_title}-${item.start_date}`}
              className="rounded-lg border p-4"
            >
              <p className="font-medium">{item.role_title}</p>
              <p className="text-sm text-muted-foreground">{item.company_name}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(item.start_date)} - {formatDate(item.end_date)}
              </p>
              <p className="mt-2 text-sm leading-6">{item.description || "N/A"}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.credentials.length === 0 ? (
            <p className="text-sm text-muted-foreground">No credentials listed.</p>
          ) : null}
          {data.credentials.map((item) => (
            <div
              key={`${item.credential_name}-${item.issuing_organization}`}
              className="rounded-lg border p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium">{item.credential_name}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {item.credential_type}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.issuing_organization}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expiration: {formatDate(item.expiration_date)}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    credentialStatusClassByType[
                      item.status as keyof typeof credentialStatusClassByType
                    ]
                  }
                >
                  {item.status}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Resume</CardTitle>
        </CardHeader>
        <CardContent>
          {data.generated_resume_text ? (
            <div className="rounded-lg border bg-muted/20 p-4">
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6">
                {data.generated_resume_text}
              </pre>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No generated resume available.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
