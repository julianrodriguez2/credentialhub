"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  downloadResumePdf,
  generateResume,
  getGeneratedResume,
} from "@/lib/worker-api-client";
import { workerQueryKeys } from "@/lib/worker-query-keys";

export default function WorkerResumePage() {
  const queryClient = useQueryClient();

  const {
    data: resume,
    isLoading,
    error,
  } = useQuery({
    queryKey: workerQueryKeys.resume,
    queryFn: getGeneratedResume,
    retry: false,
  });

  const generateMutation = useMutation({
    mutationFn: generateResume,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerQueryKeys.resume });
      toast.success("Resume generated successfully.");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const downloadMutation = useMutation({
    mutationFn: downloadResumePdf,
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const hasResume = Boolean(resume?.resume_text);
  const showEmptyState =
    !isLoading &&
    (!hasResume ||
      (error instanceof Error &&
        error.message.toLowerCase().includes("no generated resume")));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>AI Resume Generation</CardTitle>
          <CardDescription>
            Generate a professional resume from your profile, experience, and credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {generateMutation.isPending ? "Generating..." : "Generate Resume"}
          </Button>
          <Button
            variant="outline"
            onClick={() => downloadMutation.mutate()}
            disabled={!hasResume || downloadMutation.isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            {downloadMutation.isPending ? "Preparing..." : "Download PDF"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resume Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading resume...</p>
          ) : null}
          {showEmptyState ? (
            <p className="text-sm text-muted-foreground">
              No resume generated yet. Click "Generate Resume" to create one.
            </p>
          ) : null}
          {error && !showEmptyState ? (
            <p className="text-sm text-red-600">{error.message}</p>
          ) : null}
          {hasResume ? (
            <div className="rounded-lg border bg-muted/20 p-4">
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6">
                {resume.resume_text}
              </pre>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
