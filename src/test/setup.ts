import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock 'server-only' so server-only modules (crypto, auth, admin) can be unit-tested in Vitest
vi.mock("server-only", () => ({}));

// Mock window.matchMedia for JSDOM environments (used by useIsMobile / sidebar)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
