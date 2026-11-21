import React from "react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { GlobalSearchDialog } from "@/components/global-search-dialog";

const { push, searchGlobalAction } = vi.hoisted(() => ({
  push: vi.fn(),
  searchGlobalAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/actions/search.actions", () => ({ searchGlobalAction }));

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(Element.prototype, "scrollIntoView");
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("GlobalSearchDialog", () => {
  it("opens with a functioning command input instead of crashing", async () => {
    render(<GlobalSearchDialog open onOpenChange={vi.fn()} />);
    await waitFor(() => expect(screen.getByRole("combobox")).toHaveFocus());
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("keeps server-matched results visible and navigates when selected", async () => {
    searchGlobalAction.mockResolvedValue({
      success: true,
      data: {
        projects: [
          {
            id: "example-project",
            title: "Example Project",
            subtitle: "Client: Example Organization",
            type: "project",
            href: "/projects/example-project",
          },
        ],
        clients: [],
        credentials: [],
        navigation: [],
      },
    });
    const onOpenChange = vi.fn();
    render(<GlobalSearchDialog open onOpenChange={onOpenChange} />);
    // The server can match metadata that is absent from the option's text.
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "hosting" } });
    const result = await screen.findByRole("option", { name: /Example Project/ });
    expect(searchGlobalAction).toHaveBeenCalledWith("hosting");
    fireEvent.click(result);
    expect(push).toHaveBeenCalledWith("/projects/example-project");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
