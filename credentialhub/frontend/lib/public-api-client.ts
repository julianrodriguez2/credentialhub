import type {
  ComplianceStatus,
  CredentialStatus,
  CredentialType,
} from "@/lib/worker-api-client";

export type PublicWorkerCompetency = {
  competency_name: string;
  years_experience: number;
  certification_related: string | null;
};

export type PublicWorkerExperience = {
  company_name: string;
  role_title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  equipment_used: string;
};

export type PublicWorkerCredential = {
  credential_name: string;
  credential_type: CredentialType;
  issuing_organization: string;
  expiration_date: string | null;
  status: CredentialStatus;
};

export type PublicWorkerProfile = {
  public_slug: string;
  full_name: string;
  bio: string;
  years_experience: number;
  compliance_status: ComplianceStatus;
  competencies: PublicWorkerCompetency[];
  work_experiences: PublicWorkerExperience[];
  credentials: PublicWorkerCredential[];
  generated_resume_text: string | null;
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

export async function getPublicWorkerProfile(
  slug: string,
): Promise<PublicWorkerProfile> {
  const response = await fetch(`/api/public/workers/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  return parseResponse<PublicWorkerProfile>(response);
}
