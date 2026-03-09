"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { employerQueryKeys } from "@/lib/employer-query-keys";
import { getEmployerWorkerProfile } from "@/lib/employer-api-client";
import { useEmployerViewStore } from "@/lib/store/employer-view-store";

const statusClassByType = {
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

export default function EmployerWorkerProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const workerId = params.id;
  const recordView = useEmployerViewStore((state) => state.recordView);

  const { data, isLoading } = useQuery({
    queryKey: employerQueryKeys.workerProfile(workerId),
    queryFn: () => getEmployerWorkerProfile(workerId),
    enabled: Boolean(workerId),
  });

  useEffect(() => {
    if (data) {
      recordView({ worker_id: data.worker_id, full_name: data.full_name });
    }
  }, [data, recordView]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Loading worker profile...
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6">
          <p className="text-sm text-muted-foreground">
            Worker profile not found or not shared publicly.
          </p>
          <Button variant="outline" onClick={() => router.push("/dashboard/employer/workers")}>
            Back to directory
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{data.full_name}</CardTitle>
          <CardDescription>
            {data.years_experience} years experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">{data.bio || "No bio provided."}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              Profile sharing: {data.profile_visibility ? "Enabled" : "Disabled"}
            </Badge>
            <Badge
              variant="outline"
              className={
                complianceStatusClassByType[
                  data.worker_compliance_status as keyof typeof complianceStatusClassByType
                ]
              }
            >
              Compliance: {data.worker_compliance_status.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
          <div className="grid gap-2 pt-2 md:grid-cols-4">
            <div className="rounded-lg border p-3 text-sm">
              <p className="text-xs text-muted-foreground">Valid credentials</p>
              <p className="font-semibold text-emerald-700">
                {data.credential_summary.valid_count}
              </p>
            </div>
            <div className="rounded-lg border p-3 text-sm">
              <p className="text-xs text-muted-foreground">Expiring credentials</p>
              <p className="font-semibold text-amber-700">
                {data.credential_summary.expiring_count}
              </p>
            </div>
            <div className="rounded-lg border p-3 text-sm">
              <p className="text-xs text-muted-foreground">Expired credentials</p>
              <p className="font-semibold text-red-700">
                {data.credential_summary.expired_count}
              </p>
            </div>
            <div className="rounded-lg border p-3 text-sm">
              <p className="text-xs text-muted-foreground">Total credentials</p>
              <p className="font-semibold">{data.credential_summary.total_count}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="experience">
        <TabsList>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="competencies">Competencies</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="references">References</TabsTrigger>
        </TabsList>

        <TabsContent value="experience">
          <Card>
            <CardHeader>
              <CardTitle>Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Equipment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.work_experiences.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">
                        No experience shared.
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {data.work_experiences.map((item) => (
                    <TableRow key={`${item.company_name}-${item.role_title}-${item.start_date}`}>
                      <TableCell>{item.company_name}</TableCell>
                      <TableCell>{item.role_title}</TableCell>
                      <TableCell>
                        {formatDate(item.start_date)} - {formatDate(item.end_date)}
                      </TableCell>
                      <TableCell>{item.equipment_used || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competencies">
          <Card>
            <CardHeader>
              <CardTitle>Competencies</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {data.competencies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No competencies shared.</p>
              ) : null}
              {data.competencies.map((item) => (
                <Badge key={`${item.competency_name}-${item.years_experience}`} variant="secondary">
                  {item.competency_name} ({item.years_experience}y)
                </Badge>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials">
          <Card>
            <CardHeader>
              <CardTitle>Credentials</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.credentials.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">
                        No credentials shared.
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {data.credentials.map((item) => (
                    <TableRow key={`${item.credential_name}-${item.issuing_organization}`}>
                      <TableCell>{item.credential_name}</TableCell>
                      <TableCell>{item.issuing_organization}</TableCell>
                      <TableCell>{formatDate(item.expiration_date)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            statusClassByType[
                              item.status as keyof typeof statusClassByType
                            ]
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="references">
          <Card>
            <CardHeader>
              <CardTitle>References</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Relationship</TableHead>
                    <TableHead>Verified</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.references.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        No references shared.
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {data.references.map((item) => (
                    <TableRow key={`${item.reference_name}-${item.company}`}>
                      <TableCell>{item.reference_name}</TableCell>
                      <TableCell>{item.company}</TableCell>
                      <TableCell>{item.position}</TableCell>
                      <TableCell>{item.relationship}</TableCell>
                      <TableCell>
                        <Badge variant={item.verified ? "default" : "outline"}>
                          {item.verified ? "Verified" : "Unverified"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
