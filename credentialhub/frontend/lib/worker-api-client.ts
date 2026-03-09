export type WorkerProfile = {
  id: number;
  user_id: number;
  full_name: string;
  bio: string;
  years_experience: number;
  created_at: string;
};

export type WorkerProfilePayload = {
  full_name: string;
  bio: string;
  years_experience: number;
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
