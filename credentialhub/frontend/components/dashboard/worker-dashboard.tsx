import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function WorkerDashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Worker Dashboard</CardTitle>
        <CardDescription>
          Build your profile and submit credentials for verification.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-secondary p-4">
          <p className="text-sm font-medium">Profile Completion</p>
          <p className="mt-2 text-2xl font-semibold">15%</p>
        </div>
        <div className="rounded-lg bg-secondary p-4">
          <p className="text-sm font-medium">Credentials Verified</p>
          <p className="mt-2 text-2xl font-semibold">0</p>
        </div>
      </CardContent>
    </Card>
  );
}