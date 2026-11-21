import { create } from "zustand";
import { Environment } from "@/types/database.types";

interface EnvStoreState {
  activeEnvironment: Environment;
  searchQuery: string;
  setActiveEnvironment: (env: Environment) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
}

export const useEnvStore = create<EnvStoreState>((set) => ({
  activeEnvironment: "development",
  searchQuery: "",
  setActiveEnvironment: (env) => set({ activeEnvironment: env }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  resetFilters: () => set({ activeEnvironment: "development", searchQuery: "" }),
}));
