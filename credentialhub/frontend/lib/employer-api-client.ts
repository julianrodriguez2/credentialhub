import type {
  ComplianceStatus,
  CredentialStatus,
  CredentialType,
} from "@/lib/worker-api-client";

export type EmployerCredentialSummary = {
  valid_count: number;
  expiring_count: number;
  expired_count: number;
  total_count: number;
};

export type EmployerWorkerListItem = {
  worker_id: number;
  full_name: string;
  years_experience: number;
  top_competencies: string[];
  credential_summary: EmployerCredentialSummary;
  profile_visibility: boolean;
};

export type EmployerWorkerCredential = {
  credential_name: string;
  credential_type: CredentialType;
  issuing_organization: string;
  expiration_date: string | null;
  status: CredentialStatus;
};

export type EmployerWorkerExperience = {
  company_name: string;
  role_title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  equipment_used: string;
};

export type EmployerWorkerCompetency = {
  competency_name: string;
  years_experience: number;
  certification_related: string | null;
};

export type EmployerWorkerReference = {
  reference_name: string;
  company: string;
  position: string;
  relationship: string;
  verified: boolean;
};

export type EmployerWorkerProfile = {
  worker_id: number;
  full_name: string;
  bio: string;
  years_experience: number;
  profile_visibility: boolean;
  worker_compliance_status: ComplianceStatus;
  credential_summary: EmployerCredentialSummary;
  generated_resume_text: string | null;
  work_experiences: EmployerWorkerExperience[];
  competencies: EmployerWorkerCompetency[];
  references: EmployerWorkerReference[];
  credentials: EmployerWorkerCredential[];
};

export type EmployerWorkerQueryParams = {
  search?: string;
  competency?: string;
  years_experience?: number;
  credential_status?: CredentialStatus;
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

export async function getEmployerWorkers(
  filters: EmployerWorkerQueryParams = {},
): Promise<EmployerWorkerListItem[]> {
  const query = new URLSearchParams();
  if (filters.search) query.set("search", filters.search);
  if (filters.competency) query.set("competency", filters.competency);
  if (typeof filters.years_experience === "number") {
    query.set("years_experience", String(filters.years_experience));
  }
  if (filters.credential_status) {
    query.set("credential_status", filters.credential_status);
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(`/api/employer/workers${suffix}`, {
    cache: "no-store",
  });
  return parseResponse<EmployerWorkerListItem[]>(response);
}

export async function getEmployerWorkerProfile(
  workerId: number | string,
): Promise<EmployerWorkerProfile> {
  const response = await fetch(`/api/employer/workers/${workerId}`, {
    cache: "no-store",
  });
  return parseResponse<EmployerWorkerProfile>(response);
}
