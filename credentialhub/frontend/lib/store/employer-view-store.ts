import { create } from "zustand";
import { persist } from "zustand/middleware";

type ViewedWorker = {
  worker_id: number;
  full_name: string;
  viewed_at: string;
};

type EmployerViewState = {
  viewedWorkers: ViewedWorker[];
  recordView: (worker: { worker_id: number; full_name: string }) => void;
  clearViewedWorkers: () => void;
};

export const useEmployerViewStore = create<EmployerViewState>()(
  persist(
    (set) => ({
      viewedWorkers: [],
      recordView: (worker) =>
        set((state) => {
          const next: ViewedWorker = {
            ...worker,
            viewed_at: new Date().toISOString(),
          };
          const deduped = state.viewedWorkers.filter(
            (item) => item.worker_id !== worker.worker_id,
          );
          return { viewedWorkers: [next, ...deduped].slice(0, 20) };
        }),
      clearViewedWorkers: () => set({ viewedWorkers: [] }),
    }),
    { name: "credentialhub-employer-viewed-workers" },
  ),
);
