import { create } from "zustand";

interface ClientFilterState {
  searchQuery: string;
  statusFilter: "active" | "archived" | "all";
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: "active" | "archived" | "all") => void;
  resetFilters: () => void;
}

export const useClientFilterStore = create<ClientFilterState>((set) => ({
  searchQuery: "",
  statusFilter: "active",
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  resetFilters: () => set({ searchQuery: "", statusFilter: "active" }),
}));
