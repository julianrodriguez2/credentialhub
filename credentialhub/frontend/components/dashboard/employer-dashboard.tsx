import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function EmployerDashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Employer Dashboard</CardTitle>
        <CardDescription>
          Explore credentialed worker profiles and manage hiring pipelines.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-secondary p-4">
          <p className="text-sm font-medium">Saved Candidates</p>
          <p className="mt-2 text-2xl font-semibold">0</p>
        </div>
        <div className="rounded-lg bg-secondary p-4">
          <p className="text-sm font-medium">Open Opportunities</p>
          <p className="mt-2 text-2xl font-semibold">0</p>
        </div>
      </CardContent>
    </Card>
  );
}