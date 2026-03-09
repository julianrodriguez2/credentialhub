export const publicQueryKeys = {
  workerProfile: (slug: string) => ["public", "worker-profile", slug] as const,
};
