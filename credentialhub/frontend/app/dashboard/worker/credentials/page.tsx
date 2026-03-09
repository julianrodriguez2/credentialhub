"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
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
import { Form, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteCredential,
  getCredentials,
  uploadCredential,
  type Credential,
  type CredentialType,
} from "@/lib/worker-api-client";
import { workerQueryKeys } from "@/lib/worker-query-keys";

type CredentialFormState = {
  credential_name: string;
  credential_type: CredentialType;
  issuing_organization: string;
  issue_date: string;
  expiration_date: string;
  file: File | null;
};

const defaultCredentialForm: CredentialFormState = {
  credential_name: "",
  credential_type: "license",
  issuing_organization: "",
  issue_date: "",
  expiration_date: "",
  file: null,
};

const statusClassByType: Record<Credential["status"], string> = {
  valid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  expiring: "border-amber-200 bg-amber-50 text-amber-700",
  expired: "border-red-200 bg-red-50 text-red-700",
};

function formatDate(dateValue: string | null): string {
  if (!dateValue) {
    return "No expiration";
  }
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString();
}

export default function WorkerCredentialsPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState<CredentialFormState>(defaultCredentialForm);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: credentials = [], isLoading } = useQuery({
    queryKey: workerQueryKeys.credentials,
    queryFn: getCredentials,
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!form.file) {
        throw new Error("Please select a document file.");
      }
      return uploadCredential(
        {
          credential_name: form.credential_name,
          credential_type: form.credential_type,
          issuing_organization: form.issuing_organization,
          issue_date: form.issue_date,
          expiration_date: form.expiration_date || null,
          file: form.file,
        },
        setUploadProgress,
      );
    },
    onMutate: () => {
      setUploadProgress(0);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerQueryKeys.credentials });
      setForm(defaultCredentialForm);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.success("Credential uploaded successfully.");
    },
    onError: (error: Error) => {
      setUploadProgress(0);
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCredential,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerQueryKeys.credentials });
      toast.success("Credential deleted.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Upload Credential</CardTitle>
          <CardDescription>
            Upload licenses, certificates, and training records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              uploadMutation.mutate();
            }}
          >
            <FormItem>
              <Label htmlFor="credential_name">Credential Name</Label>
              <Input
                id="credential_name"
                value={form.credential_name}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    credential_name: event.target.value,
                  }))
                }
                placeholder="OSHA 30 Certification"
                required
              />
            </FormItem>
            <FormItem>
              <Label htmlFor="credential_type">Credential Type</Label>
              <select
                id="credential_type"
                value={form.credential_type}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    credential_type: event.target.value as CredentialType,
                  }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="license">License</option>
                <option value="certificate">Certificate</option>
                <option value="training">Training</option>
              </select>
            </FormItem>
            <FormItem>
              <Label htmlFor="issuing_organization">Issuing Organization</Label>
              <Input
                id="issuing_organization"
                value={form.issuing_organization}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    issuing_organization: event.target.value,
                  }))
                }
                placeholder="National Safety Council"
                required
              />
            </FormItem>
            <FormItem>
              <Label htmlFor="issue_date">Issue Date</Label>
              <Input
                id="issue_date"
                type="date"
                value={form.issue_date}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    issue_date: event.target.value,
                  }))
                }
                required
              />
            </FormItem>
            <FormItem>
              <Label htmlFor="expiration_date">Expiration Date</Label>
              <Input
                id="expiration_date"
                type="date"
                value={form.expiration_date}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    expiration_date: event.target.value,
                  }))
                }
              />
            </FormItem>
            <FormItem>
              <Label htmlFor="document">Upload Document (PDF / image)</Label>
              <Input
                id="document"
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    file: event.target.files?.[0] ?? null,
                  }))
                }
                required
              />
            </FormItem>
            <div className="md:col-span-2 space-y-3">
              <Button type="submit" disabled={uploadMutation.isPending}>
                <Upload className="mr-2 h-4 w-4" />
                {uploadMutation.isPending ? "Uploading..." : "Upload Credential"}
              </Button>
              {uploadMutation.isPending ? (
                <div className="space-y-1">
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload progress: {uploadProgress}%
                  </p>
                </div>
              ) : null}
            </div>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credentials</CardTitle>
          <CardDescription>
            Track credential validity and expiration status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!isLoading && credentials.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No credentials uploaded yet.
            </p>
          ) : null}

          {credentials.map((credential) => (
            <div key={credential.id} className="rounded-lg border p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{credential.credential_name}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {credential.credential_type}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {credential.issuing_organization}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expiration: {formatDate(credential.expiration_date)}
                  </p>
                </div>

                <div className="flex flex-col items-start gap-2 md:items-end">
                  <Badge
                    variant="outline"
                    className={statusClassByType[credential.status]}
                  >
                    {credential.status}
                  </Badge>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={credential.document_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Document
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMutation.mutate(credential.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
