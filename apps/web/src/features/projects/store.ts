import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ProjectStatusFilter = "all" | "active" | "archived";
export type ProjectViewMode = "folders" | "table";

interface ProjectStore {
  searchQuery: string;
  statusFilter: ProjectStatusFilter;
  clientFilter: string; // client UUID or "all"
  viewMode: ProjectViewMode;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: ProjectStatusFilter) => void;
  setClientFilter: (clientId: string) => void;
  setViewMode: (mode: ProjectViewMode) => void;
  resetFilters: () => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      searchQuery: "",
      statusFilter: "active",
      clientFilter: "all",
      viewMode: "folders",
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setStatusFilter: (statusFilter) => set({ statusFilter }),
      setClientFilter: (clientFilter) => set({ clientFilter }),
      setViewMode: (viewMode) => set({ viewMode }),
      resetFilters: () =>
        set({
          searchQuery: "",
          statusFilter: "active",
          clientFilter: "all",
          viewMode: "folders",
        }),
    }),
    {
      name: "company-vault-project-view",
      partialize: (state) => ({ viewMode: state.viewMode }),
    }
  )
);
