export type ComplianceStatus =
  | "compliant"
  | "warning"
  | "non_compliant"
  | "incomplete";

export type WorkerProfile = {
  id: number;
  user_id: number;
  full_name: string;
  bio: string;
  years_experience: number;
  profile_visibility: boolean;
  compliance_status: ComplianceStatus;
  last_compliance_check: string | null;
  created_at: string;
};

export type WorkerProfilePayload = {
  full_name: string;
  bio: string;
  years_experience: number;
  profile_visibility: boolean;
};

export type WorkExperience = {
  id: string;
  worker_id: number;
  company_name: string;
  role_title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  equipment_used: string;
  created_at: string;
};

export type WorkExperiencePayload = {
  company_name: string;
  role_title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  equipment_used: string;
};

export type WorkExperienceUpdatePayload = WorkExperiencePayload & {
  id: string;
};

export type Competency = {
  id: number;
  worker_id: number;
  competency_name: string;
  years_experience: number;
  certification_related: string | null;
};

export type CompetencyPayload = {
  competency_name: string;
  years_experience: number;
  certification_related: string | null;
};

export type Reference = {
  id: number;
  worker_id: number;
  reference_name: string;
  company: string;
  position: string;
  email: string;
  phone: string;
  relationship: string;
  verified: boolean;
  verification_sent_at: string | null;
  verification_confirmed_at: string | null;
};

export type ReferencePayload = {
  reference_name: string;
  company: string;
  position: string;
  email: string;
  phone: string;
  relationship: string;
};

export type CredentialType = "license" | "certificate" | "training";
export type CredentialStatus = "valid" | "expiring" | "expired";

export type Credential = {
  id: string;
  worker_id: number;
  credential_name: string;
  credential_type: CredentialType;
  issuing_organization: string;
  issue_date: string;
  expiration_date: string | null;
  document_url: string;
  created_at: string;
  status: CredentialStatus;
};

export type UploadCredentialPayload = {
  credential_name: string;
  credential_type: CredentialType;
  issuing_organization: string;
  issue_date: string;
  expiration_date: string | null;
  file: File;
};

export type ParsedCredentialResult = {
  credential_name: string | null;
  credential_type: CredentialType | null;
  issuing_organization: string | null;
  issue_date: string | null;
  expiration_date: string | null;
  confidence_score: number | null;
  raw_extracted_text: string | null;
};

export type CredentialParseResponse = {
  file_url: string;
  parsed_fields: ParsedCredentialResult;
  parse_warning: string | null;
};

export type ConfirmCredentialPayload = {
  file_url: string;
  credential_name: string;
  credential_type: CredentialType;
  issuing_organization: string;
  issue_date: string;
  expiration_date: string | null;
};

export type ComplianceSummary = {
  valid_count: number;
  expiring_count: number;
  expired_count: number;
  total_count: number;
};

export type ComplianceCredential = {
  id: string;
  credential_name: string;
  credential_type: CredentialType;
  issuing_organization: string;
  expiration_date: string | null;
  status: CredentialStatus;
};

export type WorkerCompliance = {
  compliance_status: ComplianceStatus;
  last_compliance_check: string | null;
  credential_summary: ComplianceSummary;
  expiring_credentials: ComplianceCredential[];
  expired_credentials: ComplianceCredential[];
};

export type SendReferenceVerificationResponse = {
  message: string;
  verification_sent_at: string;
};

export type GeneratedResume = {
  id: string;
  worker_id: number;
  resume_text: string;
  created_at: string;
};

export type GenerateResumeResponse = {
  resume_text: string;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data.detail === "string" ? data.detail : "Request failed.";
    throw new Error(message);
  }

  return data as T;
}

export async function getWorkerProfile(): Promise<WorkerProfile> {
  const response = await fetch("/api/worker/profile", { cache: "no-store" });
  return parseResponse<WorkerProfile>(response);
}

export async function updateWorkerProfile(
  payload: WorkerProfilePayload,
): Promise<WorkerProfile> {
  const response = await fetch("/api/worker/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<WorkerProfile>(response);
}

export async function getExperiences(): Promise<WorkExperience[]> {
  const response = await fetch("/api/worker/experience", { cache: "no-store" });
  return parseResponse<WorkExperience[]>(response);
}

export async function addExperience(
  payload: WorkExperiencePayload,
): Promise<WorkExperience> {
  const response = await fetch("/api/worker/experience", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<WorkExperience>(response);
}

export async function updateExperience(
  payload: WorkExperienceUpdatePayload,
): Promise<WorkExperience> {
  const response = await fetch("/api/worker/experience", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<WorkExperience>(response);
}

export async function deleteExperience(id: string): Promise<{ success: true }> {
  const response = await fetch(`/api/worker/experience?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return parseResponse<{ success: true }>(response);
}

export async function getCompetencies(): Promise<Competency[]> {
  const response = await fetch("/api/worker/competencies", { cache: "no-store" });
  return parseResponse<Competency[]>(response);
}

export async function addCompetency(
  payload: CompetencyPayload,
): Promise<Competency> {
  const response = await fetch("/api/worker/competencies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<Competency>(response);
}

export async function deleteCompetency(id: number): Promise<{ success: true }> {
  const response = await fetch(`/api/worker/competencies?id=${id}`, {
    method: "DELETE",
  });
  return parseResponse<{ success: true }>(response);
}

export async function getReferences(): Promise<Reference[]> {
  const response = await fetch("/api/worker/references", { cache: "no-store" });
  return parseResponse<Reference[]>(response);
}

export async function sendReferenceVerification(
  id: number,
): Promise<SendReferenceVerificationResponse> {
  const response = await fetch(
    `/api/worker/references/send-verification/${id}`,
    { method: "POST" },
  );
  return parseResponse<SendReferenceVerificationResponse>(response);
}

export async function addReference(
  payload: ReferencePayload,
): Promise<Reference> {
  const response = await fetch("/api/worker/references", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<Reference>(response);
}

export async function deleteReference(id: number): Promise<{ success: true }> {
  const response = await fetch(`/api/worker/references?id=${id}`, {
    method: "DELETE",
  });
  return parseResponse<{ success: true }>(response);
}

export async function getCredentials(): Promise<Credential[]> {
  const response = await fetch("/api/worker/credentials/", { cache: "no-store" });
  return parseResponse<Credential[]>(response);
}

export async function parseCredentialDocument(
  file: File,
): Promise<CredentialParseResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/worker/credentials/parse", {
    method: "POST",
    body: formData,
  });
  return parseResponse<CredentialParseResponse>(response);
}

export async function reparseCredentialDocument(
  fileUrl: string,
): Promise<CredentialParseResponse> {
  const response = await fetch("/api/worker/credentials/reparse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_url: fileUrl }),
  });
  return parseResponse<CredentialParseResponse>(response);
}

export async function confirmParsedCredential(
  payload: ConfirmCredentialPayload,
): Promise<Credential> {
  const response = await fetch("/api/worker/credentials/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<Credential>(response);
}

export async function getWorkerCompliance(): Promise<WorkerCompliance> {
  const response = await fetch("/api/worker/compliance", { cache: "no-store" });
  return parseResponse<WorkerCompliance>(response);
}

export async function getGeneratedResume(): Promise<GeneratedResume> {
  const response = await fetch("/api/worker/resume", { cache: "no-store" });
  return parseResponse<GeneratedResume>(response);
}

export async function generateResume(): Promise<GenerateResumeResponse> {
  const response = await fetch("/api/worker/resume", { method: "POST" });
  return parseResponse<GenerateResumeResponse>(response);
}

export async function downloadResumePdf(): Promise<void> {
  const response = await fetch("/api/worker/resume/download", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message =
      typeof data.detail === "string" ? data.detail : "Failed to download PDF.";
    throw new Error(message);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const contentDisposition = response.headers.get("content-disposition");
  const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/i);
  anchor.href = url;
  anchor.download = filenameMatch?.[1] ?? "credentialhub_resume.pdf";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function getCredential(id: string): Promise<Credential> {
  const response = await fetch(`/api/worker/credentials/${id}`, {
    cache: "no-store",
  });
  return parseResponse<Credential>(response);
}

export async function deleteCredential(id: string): Promise<{ success: true }> {
  const response = await fetch(`/api/worker/credentials/${id}`, {
    method: "DELETE",
  });
  return parseResponse<{ success: true }>(response);
}

export function uploadCredential(
  payload: UploadCredentialPayload,
  onProgress?: (progress: number) => void,
): Promise<Credential> {
  const formData = new FormData();
  formData.append("credential_name", payload.credential_name);
  formData.append("credential_type", payload.credential_type);
  formData.append("issuing_organization", payload.issuing_organization);
  formData.append("issue_date", payload.issue_date);
  if (payload.expiration_date) {
    formData.append("expiration_date", payload.expiration_date);
  }
  formData.append("file", payload.file);

  return new Promise<Credential>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/worker/credentials/upload");

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) {
        return;
      }
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress(percent);
    };

    xhr.onload = () => {
      let data: unknown = {};
      try {
        data = JSON.parse(xhr.responseText || "{}");
      } catch {
        data = {};
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data as Credential);
        return;
      }
      const detail =
        typeof data === "object" && data !== null && "detail" in data
          ? (data as { detail?: unknown }).detail
          : null;
      reject(new Error(typeof detail === "string" ? detail : "Upload failed."));
    };

    xhr.onerror = () => reject(new Error("Upload failed."));
    xhr.send(formData);
  });
}
