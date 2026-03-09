"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getWorkerProfile,
  updateWorkerProfile,
  type WorkerProfilePayload,
} from "@/lib/worker-api-client";
import { workerQueryKeys } from "@/lib/worker-query-keys";

export default function WorkerPublicProfilePage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: workerQueryKeys.profile,
    queryFn: getWorkerProfile,
  });

  const [form, setForm] = useState<WorkerProfilePayload>({
    full_name: "",
    bio: "",
    years_experience: 0,
    profile_visibility: false,
  });
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (data) {
      setForm({
        full_name: data.full_name,
        bio: data.bio,
        years_experience: data.years_experience,
        profile_visibility: data.profile_visibility,
      });
    }
  }, [data]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const saveMutation = useMutation({
    mutationFn: updateWorkerProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerQueryKeys.profile });
      toast.success("Public profile settings saved.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const publicPath = data?.public_slug ? `/workers/${data.public_slug}` : null;
  const publicUrl = useMemo(() => {
    if (!publicPath || !origin) return "";
    return `${origin}${publicPath}`;
  }, [publicPath, origin]);

  const copyPublicLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Public profile link copied.");
    } catch {
      toast.error("Unable to copy link.");
    }
  };

  const previewPublicProfile = () => {
    if (!publicPath) return;
    window.open(publicPath, "_blank", "noopener,noreferrer");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Public Profile</CardTitle>
        <CardDescription>
          Control public visibility and share your profile URL with employers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="sharing">
          <TabsList>
            <TabsTrigger value="sharing">Sharing Settings</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="sharing" className="space-y-5 pt-2">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Enable public profile</p>
                  <p className="text-sm text-muted-foreground">
                    Public visitors can view your profile without logging in.
                  </p>
                </div>
                <Switch
                  checked={form.profile_visibility}
                  disabled={isLoading || saveMutation.isPending}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, profile_visibility: checked }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Visibility status</p>
              <Badge
                variant="outline"
                className={
                  form.profile_visibility
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-100 text-slate-700"
                }
              >
                {form.profile_visibility ? "Public" : "Private"}
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Shareable URL</p>
              <p className="rounded-md border bg-muted/20 px-3 py-2 text-sm break-all">
                {publicUrl || "Enable public profile to generate a shareable URL."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => saveMutation.mutate(form)}
                disabled={saveMutation.isPending || isLoading}
              >
                {saveMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
              <Button
                variant="outline"
                onClick={copyPublicLink}
                disabled={!publicUrl || !form.profile_visibility}
              >
                Copy Public Link
              </Button>
              <Button
                variant="outline"
                onClick={previewPublicProfile}
                disabled={!publicPath || !form.profile_visibility}
              >
                Preview Public Profile
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Use preview to view exactly what public visitors will see.
            </p>
            {publicPath ? (
              <Button asChild variant="outline">
                <Link href={publicPath} target="_blank" rel="noreferrer">
                  Open Public Profile
                </Link>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                A public URL will appear after you save with sharing enabled.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
