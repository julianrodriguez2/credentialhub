"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, RefreshCw, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  confirmParsedCredential,
  deleteCredential,
  getCredentials,
  parseCredentialDocument,
  reparseCredentialDocument,
  type ConfirmCredentialPayload,
  type Credential,
  type CredentialType,
} from "@/lib/worker-api-client";
import { workerQueryKeys } from "@/lib/worker-query-keys";

type ParseStage =
  | "idle"
  | "uploading"
  | "extracting"
  | "parsing"
  | "ready";

type ReviewFormState = ConfirmCredentialPayload & {
  confidence_score: number | null;
  raw_extracted_text: string | null;
  parse_warning: string | null;
};

const statusClassByType: Record<Credential["status"], string> = {
  valid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  expiring: "border-amber-200 bg-amber-50 text-amber-700",
  expired: "border-red-200 bg-red-50 text-red-700",
};

const parseStageLabel: Record<ParseStage, string> = {
  idle: "Idle",
  uploading: "Uploading",
  extracting: "Extracting text",
  parsing: "Parsing with AI",
  ready: "Ready for review",
};

function formatDate(dateValue: string | null): string {
  if (!dateValue) {
    return "No expiration";
  }
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString();
}

function toInputDate(value: string | null): string {
  return value ?? "";
}

function normalizeCredentialType(value: CredentialType | null): CredentialType {
  if (value === "license" || value === "certificate" || value === "training") {
    return value;
  }
  return "certificate";
}

export default function WorkerCredentialsPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stageTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseStage, setParseStage] = useState<ParseStage>("idle");
  const [reviewForm, setReviewForm] = useState<ReviewFormState | null>(null);

  const { data: credentials = [], isLoading } = useQuery({
    queryKey: workerQueryKeys.credentials,
    queryFn: getCredentials,
  });

  const clearStageTimers = () => {
    stageTimersRef.current.forEach((timer) => clearTimeout(timer));
    stageTimersRef.current = [];
  };

  const startParsingStages = () => {
    clearStageTimers();
    setParseStage("uploading");
    stageTimersRef.current.push(
      setTimeout(() => setParseStage("extracting"), 600),
      setTimeout(() => setParseStage("parsing"), 1400),
    );
  };

  const resetModalState = () => {
    clearStageTimers();
    setSelectedFile(null);
    setParseStage("idle");
    setReviewForm(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const parseMutation = useMutation({
    mutationFn: () => {
      if (!selectedFile) {
        throw new Error("Please choose a credential document.");
      }
      return parseCredentialDocument(selectedFile);
    },
    onMutate: () => {
      startParsingStages();
    },
    onSuccess: (result) => {
      clearStageTimers();
      setParseStage("ready");
      setReviewForm({
        file_url: result.file_url,
        credential_name: result.parsed_fields.credential_name ?? "",
        credential_type: normalizeCredentialType(result.parsed_fields.credential_type),
        issuing_organization: result.parsed_fields.issuing_organization ?? "",
        issue_date: toInputDate(result.parsed_fields.issue_date),
        expiration_date: toInputDate(result.parsed_fields.expiration_date),
        confidence_score: result.parsed_fields.confidence_score,
        raw_extracted_text: result.parsed_fields.raw_extracted_text,
        parse_warning: result.parse_warning,
      });

      if (result.parse_warning) {
        toast.warning("Parsing completed with warnings. Please review carefully.");
      } else {
        toast.success("Document parsed. Review the extracted fields.");
      }
    },
    onError: (error: Error) => {
      clearStageTimers();
      setParseStage("idle");
      toast.error(
        `${error.message} You can retry parsing or upload a different file.`,
      );
    },
  });

  const reparseMutation = useMutation({
    mutationFn: () => {
      if (!reviewForm?.file_url) {
        throw new Error("No file URL available to re-parse.");
      }
      return reparseCredentialDocument(reviewForm.file_url);
    },
    onMutate: () => {
      startParsingStages();
    },
    onSuccess: (result) => {
      clearStageTimers();
      setParseStage("ready");
      setReviewForm((prev) => ({
        file_url: result.file_url,
        credential_name: result.parsed_fields.credential_name ?? prev?.credential_name ?? "",
        credential_type: normalizeCredentialType(result.parsed_fields.credential_type),
        issuing_organization:
          result.parsed_fields.issuing_organization ?? prev?.issuing_organization ?? "",
        issue_date: toInputDate(result.parsed_fields.issue_date) || prev?.issue_date || "",
        expiration_date:
          toInputDate(result.parsed_fields.expiration_date) || prev?.expiration_date || "",
        confidence_score: result.parsed_fields.confidence_score,
        raw_extracted_text: result.parsed_fields.raw_extracted_text,
        parse_warning: result.parse_warning,
      }));
      if (result.parse_warning) {
        toast.warning("Re-parse completed with warnings.");
      } else {
        toast.success("Re-parse completed.");
      }
    },
    onError: (error: Error) => {
      clearStageTimers();
      setParseStage("ready");
      toast.error(error.message);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (payload: ConfirmCredentialPayload) =>
      confirmParsedCredential(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerQueryKeys.credentials });
      queryClient.invalidateQueries({ queryKey: workerQueryKeys.compliance });
      setDialogOpen(false);
      resetModalState();
      toast.success("Credential saved successfully.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCredential,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerQueryKeys.credentials });
      queryClient.invalidateQueries({ queryKey: workerQueryKeys.compliance });
      toast.success("Credential deleted.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const confidenceScore = reviewForm?.confidence_score ?? null;
  const lowConfidence =
    typeof confidenceScore === "number" && confidenceScore < 0.6;

  const onConfirm = () => {
    if (!reviewForm) return;
    if (!reviewForm.credential_name.trim()) {
      toast.error("Credential name is required.");
      return;
    }
    if (!reviewForm.issuing_organization.trim()) {
      toast.error("Issuing organization is required.");
      return;
    }
    if (!reviewForm.issue_date) {
      toast.error("Issue date is required.");
      return;
    }

    confirmMutation.mutate({
      file_url: reviewForm.file_url,
      credential_name: reviewForm.credential_name.trim(),
      credential_type: reviewForm.credential_type,
      issuing_organization: reviewForm.issuing_organization.trim(),
      issue_date: reviewForm.issue_date,
      expiration_date: reviewForm.expiration_date || null,
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>AI Credential Parsing</CardTitle>
          <CardDescription>
            Upload a document, review AI-extracted fields, and confirm to save.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                resetModalState();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload and Parse Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Credential Upload Flow</DialogTitle>
                <DialogDescription>
                  Step 1 upload, Step 2 review extracted fields, Step 3 confirm and save.
                </DialogDescription>
              </DialogHeader>

              {!reviewForm ? (
                <div className="space-y-4">
                  <Form>
                    <FormItem>
                      <Label htmlFor="parse_document">Credential Document</Label>
                      <Input
                        id="parse_document"
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(event) =>
                          setSelectedFile(event.target.files?.[0] ?? null)
                        }
                      />
                    </FormItem>
                  </Form>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{parseStageLabel[parseStage]}</Badge>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDialogOpen(false);
                        resetModalState();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => parseMutation.mutate()}
                      disabled={parseMutation.isPending || !selectedFile}
                    >
                      {parseMutation.isPending ? "Processing..." : "Parse Document"}
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{parseStageLabel[parseStage]}</Badge>
                    {typeof confidenceScore === "number" ? (
                      <Badge
                        variant="outline"
                        className={
                          lowConfidence
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        }
                      >
                        Confidence: {(confidenceScore * 100).toFixed(0)}%
                      </Badge>
                    ) : null}
                  </div>

                  {reviewForm.parse_warning ? (
                    <Alert className="border-amber-200 bg-amber-50">
                      <AlertTitle>Parsing warning</AlertTitle>
                      <AlertDescription>{reviewForm.parse_warning}</AlertDescription>
                    </Alert>
                  ) : null}

                  {lowConfidence ? (
                    <Alert className="border-amber-200 bg-amber-50">
                      <AlertTitle>Low confidence</AlertTitle>
                      <AlertDescription>
                        Low confidence - please review carefully before saving.
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  <Form className="grid gap-4 md:grid-cols-2">
                    <FormItem>
                      <Label htmlFor="review_name">Credential Name</Label>
                      <Input
                        id="review_name"
                        value={reviewForm.credential_name}
                        onChange={(event) =>
                          setReviewForm((prev) =>
                            prev
                              ? { ...prev, credential_name: event.target.value }
                              : prev,
                          )
                        }
                      />
                    </FormItem>
                    <FormItem>
                      <Label htmlFor="review_type">Credential Type</Label>
                      <Select
                        id="review_type"
                        value={reviewForm.credential_type}
                        onChange={(event) =>
                          setReviewForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  credential_type: event.target
                                    .value as CredentialType,
                                }
                              : prev,
                          )
                        }
                      >
                        <option value="license">License</option>
                        <option value="certificate">Certificate</option>
                        <option value="training">Training</option>
                      </Select>
                    </FormItem>
                    <FormItem>
                      <Label htmlFor="review_org">Issuing Organization</Label>
                      <Input
                        id="review_org"
                        value={reviewForm.issuing_organization}
                        onChange={(event) =>
                          setReviewForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  issuing_organization: event.target.value,
                                }
                              : prev,
                          )
                        }
                      />
                    </FormItem>
                    <FormItem>
                      <Label htmlFor="review_issue_date">Issue Date</Label>
                      <Input
                        id="review_issue_date"
                        type="date"
                        value={reviewForm.issue_date}
                        onChange={(event) =>
                          setReviewForm((prev) =>
                            prev ? { ...prev, issue_date: event.target.value } : prev,
                          )
                        }
                      />
                    </FormItem>
                    <FormItem>
                      <Label htmlFor="review_expiration_date">Expiration Date</Label>
                      <Input
                        id="review_expiration_date"
                        type="date"
                        value={reviewForm.expiration_date}
                        onChange={(event) =>
                          setReviewForm((prev) =>
                            prev
                              ? { ...prev, expiration_date: event.target.value }
                              : prev,
                          )
                        }
                      />
                    </FormItem>
                    <FormItem>
                      <Label>Stored File URL</Label>
                      <Input value={reviewForm.file_url} readOnly />
                    </FormItem>
                  </Form>

                  <details className="rounded-lg border p-3">
                    <summary className="cursor-pointer text-sm font-medium">
                      View extracted text preview
                    </summary>
                    <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
                      {reviewForm.raw_extracted_text || "No text extracted."}
                    </pre>
                  </details>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => reparseMutation.mutate()}
                      disabled={reparseMutation.isPending}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {reparseMutation.isPending ? "Re-parsing..." : "Re-parse"}
                    </Button>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={onConfirm}
                      disabled={confirmMutation.isPending}
                    >
                      {confirmMutation.isPending ? "Saving..." : "Confirm and Save"}
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credentials</CardTitle>
          <CardDescription>
            Saved credentials from AI-assisted parsing and manual entries.
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



