import type { EmployerWorkerQueryParams } from "@/lib/employer-api-client";

export const employerQueryKeys = {
  workers: (filters: EmployerWorkerQueryParams) =>
    ["employer", "workers", filters] as const,
  workerProfile: (workerId: number | string) =>
    ["employer", "worker-profile", workerId] as const,
};
