import { create } from "zustand";

interface TeamFilterState {
  searchQuery: string;
  roleFilter: "all" | "admin" | "manager" | "developer";
  statusFilter: "all" | "active" | "invited" | "deactivated";
  setSearchQuery: (query: string) => void;
  setRoleFilter: (role: "all" | "admin" | "manager" | "developer") => void;
  setStatusFilter: (status: "all" | "active" | "invited" | "deactivated") => void;
  resetFilters: () => void;
}

export const useTeamFilterStore = create<TeamFilterState>((set) => ({
  searchQuery: "",
  roleFilter: "all",
  statusFilter: "all",
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setRoleFilter: (roleFilter) => set({ roleFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  resetFilters: () => set({ searchQuery: "", roleFilter: "all", statusFilter: "all" }),
}));
