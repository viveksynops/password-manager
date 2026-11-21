import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { DataTable } from "@/components/data-table";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

// Mock next/navigation
const mockPathname = vi.fn().mockReturnValue("/");
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("EmptyState Component", () => {
  it("renders title, description and action button", () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="No clients found"
        description="Get started by creating your first client."
        action={{ label: "Add Client", onClick: handleAction }}
      />
    );

    expect(screen.getByText("No clients found")).toBeInTheDocument();
    expect(screen.getByText("Get started by creating your first client.")).toBeInTheDocument();

    const button = screen.getByRole("button", { name: "Add Client" });
    fireEvent.click(button);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });
});

describe("ErrorState Component", () => {
  it("renders error message and triggers retry", () => {
    const handleRetry = vi.fn();
    render(<ErrorState message="Failed to load database records." onRetry={handleRetry} />);

    expect(screen.getByText("Failed to load database records.")).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});

describe("DataTable Component", () => {
  interface TestItem {
    id: string;
    name: string;
    status: string;
  }

  const columns = [
    { header: "Name", cell: (item: TestItem) => item.name },
    { header: "Status", cell: (item: TestItem) => item.status },
  ];

  it("renders empty state when data is empty", () => {
    render(
      <DataTable<TestItem>
        columns={columns}
        data={[]}
        keyExtractor={(item) => item.id}
        emptyTitle="No items"
        emptyDescription="Empty list description"
      />
    );

    expect(screen.getByText("No items")).toBeInTheDocument();
    expect(screen.getByText("Empty list description")).toBeInTheDocument();
  });

  it("renders rows when data is provided", () => {
    const data: TestItem[] = [
      { id: "1", name: "Alpha Project", status: "Active" },
      { id: "2", name: "Beta Project", status: "Archived" },
    ];

    render(
      <DataTable<TestItem>
        columns={columns}
        data={data}
        keyExtractor={(item) => item.id}
      />
    );

    expect(screen.getByText("Alpha Project")).toBeInTheDocument();
    expect(screen.getByText("Beta Project")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Archived")).toBeInTheDocument();
  });
});

describe("Sidebar Component (Role-Based Navigation with shadcn)", () => {
  it("hides Team and Audit Logs for developer role", () => {
    mockPathname.mockReturnValue("/");
    render(
      <SidebarProvider>
        <Sidebar
          user={{
            email: "dev@vault.local",
            fullName: "Dev User",
            role: "developer",
          }}
        />
      </SidebarProvider>
    );

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Clients")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();

    expect(screen.queryByText("Team")).not.toBeInTheDocument();
    expect(screen.queryByText("Audit Logs")).not.toBeInTheDocument();
  });

  it("shows Team and Audit Logs for admin role", () => {
    mockPathname.mockReturnValue("/");
    render(
      <SidebarProvider>
        <Sidebar
          user={{
            email: "admin@vault.local",
            fullName: "Admin User",
            role: "admin",
          }}
        />
      </SidebarProvider>
    );

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Clients")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Team")).toBeInTheDocument();
    expect(screen.getByText("Audit Logs")).toBeInTheDocument();
  });
});

describe("Breadcrumbs Component", () => {
  it("renders Dashboard at root path", () => {
    mockPathname.mockReturnValue("/");
    render(<Breadcrumbs />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders nested paths correctly", () => {
    mockPathname.mockReturnValue("/clients");
    render(<Breadcrumbs />);
    expect(screen.getByText("Clients")).toBeInTheDocument();
  });
});
