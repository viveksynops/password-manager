import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock 'server-only' so server-only modules (crypto, auth, admin) can be unit-tested in Vitest
vi.mock("server-only", () => ({}));
