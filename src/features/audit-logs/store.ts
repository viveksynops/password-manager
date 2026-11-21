import { create } from "zustand";

interface AuditLogStoreState {
  action: string;
  userId: string;
  projectId: string;
  targetType: string;
  dateRange: "all" | "today" | "7d" | "30d";
  page: number;
  pageSize: number;

  setAction: (action: string) => void;
  setUserId: (userId: string) => void;
  setProjectId: (projectId: string) => void;
  setTargetType: (targetType: string) => void;
  setDateRange: (dateRange: "all" | "today" | "7d" | "30d") => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  resetFilters: () => void;
}

export const useAuditLogStore = create<AuditLogStoreState>((set) => ({
  action: "all",
  userId: "all",
  projectId: "all",
  targetType: "all",
  dateRange: "all",
  page: 1,
  pageSize: 25,

  setAction: (action) => set({ action, page: 1 }),
  setUserId: (userId) => set({ userId, page: 1 }),
  setProjectId: (projectId) => set({ projectId, page: 1 }),
  setTargetType: (targetType) => set({ targetType, page: 1 }),
  setDateRange: (dateRange) => set({ dateRange, page: 1 }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
  resetFilters: () =>
    set({
      action: "all",
      userId: "all",
      projectId: "all",
      targetType: "all",
      dateRange: "all",
      page: 1,
      pageSize: 25,
    }),
}));
