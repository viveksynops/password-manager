import { describe, it, expect } from "vitest";
import { parseEnvText, exportEnvText } from "@/utils/env-parser";

describe("env-parser utility (TASK-091 / TASK-092)", () => {
  it("should parse standard KEY=value pairs", () => {
    const raw = `
PORT=3000
HOST=localhost
NODE_ENV=production
`;
    const res = parseEnvText(raw);
    expect(res.errors).toHaveLength(0);
    expect(res.items).toHaveLength(3);
    expect(res.items[0]).toEqual({
      key: "PORT",
      value: "3000",
      comment: undefined,
      lineNumber: 2,
    });
    expect(res.items[1].key).toBe("HOST");
    expect(res.items[1].value).toBe("localhost");
    expect(res.items[2].key).toBe("NODE_ENV");
    expect(res.items[2].value).toBe("production");
  });

  it("should ignore empty lines and full-line comments", () => {
    const raw = `
# This is a comment
# Another comment line

APP_NAME=CompanyVault

# Footer comment
`;
    const res = parseEnvText(raw);
    expect(res.items).toHaveLength(1);
    expect(res.items[0].key).toBe("APP_NAME");
    expect(res.items[0].value).toBe("CompanyVault");
  });

  it("should handle single and double quotes correctly", () => {
    const raw = `
DOUBLE_QUOTED="hello world"
SINGLE_QUOTED='single world'
WITH_INNER_QUOTES="hello 'inner' world"
`;
    const res = parseEnvText(raw);
    expect(res.items).toHaveLength(3);
    expect(res.items[0].value).toBe("hello world");
    expect(res.items[1].value).toBe("single world");
    expect(res.items[2].value).toBe("hello 'inner' world");
  });

  it("should parse inline comments properly without mangling values", () => {
    const raw = `
API_KEY=xyz123 # Production key for payment
DEBUG_MODE=true # enable verbose logs
QUOTED_WITH_HASH="value with # hash inside" # inline comment here
`;
    const res = parseEnvText(raw);
    expect(res.items).toHaveLength(3);
    expect(res.items[0].value).toBe("xyz123");
    expect(res.items[0].comment).toBe("Production key for payment");
    expect(res.items[1].value).toBe("true");
    expect(res.items[1].comment).toBe("enable verbose logs");
    expect(res.items[2].value).toBe("value with # hash inside");
    expect(res.items[2].comment).toBe("inline comment here");
  });

  it("should handle empty values", () => {
    const raw = `
EMPTY_ONE=
EMPTY_TWO=""
EMPTY_THREE=''
`;
    const res = parseEnvText(raw);
    expect(res.items).toHaveLength(3);
    expect(res.items[0].value).toBe("");
    expect(res.items[1].value).toBe("");
    expect(res.items[2].value).toBe("");
  });

  it("should handle multiple '=' signs in values (URLs, base64)", () => {
    const raw = `
DATABASE_URL=postgres://user:pass=123@localhost:5432/vault?sslmode=require&connect_timeout=10
BASE64_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9==
`;
    const res = parseEnvText(raw);
    expect(res.items).toHaveLength(2);
    expect(res.items[0].key).toBe("DATABASE_URL");
    expect(res.items[0].value).toBe(
      "postgres://user:pass=123@localhost:5432/vault?sslmode=require&connect_timeout=10"
    );
    expect(res.items[1].key).toBe("BASE64_TOKEN");
    expect(res.items[1].value).toBe("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9==");
  });

  it("should strip bash 'export' prefix", () => {
    const raw = `
export SECRET_KEY=supersecret
export PORT=8080
`;
    const res = parseEnvText(raw);
    expect(res.items).toHaveLength(2);
    expect(res.items[0].key).toBe("SECRET_KEY");
    expect(res.items[0].value).toBe("supersecret");
    expect(res.items[1].key).toBe("PORT");
    expect(res.items[1].value).toBe("8080");
  });

  it("should detect duplicate keys and keep the latest value", () => {
    const raw = `
REDIS_URL=redis://localhost:6379/0
REDIS_URL=redis://cluster.production:6379/0
`;
    const res = parseEnvText(raw);
    expect(res.duplicates).toContain("REDIS_URL");
    expect(res.items).toHaveLength(1);
    expect(res.items[0].value).toBe("redis://cluster.production:6379/0");
  });

  it("should collect syntax errors for invalid lines without crashing", () => {
    const raw = `
VALID_KEY=123
INVALID LINE WITHOUT EQUALS
123_INVALID_START=456
ANOTHER_VALID=true
`;
    const res = parseEnvText(raw);
    expect(res.items).toHaveLength(2);
    expect(res.errors).toHaveLength(2);
    expect(res.errors[0].message).toContain("Missing '=' separator");
    expect(res.errors[1].message).toContain("Invalid key name");
  });

  it("should round-trip export key-value pairs back to .env format", () => {
    const items = [
      { key: "API_URL", value: "https://api.example.com" },
      { key: "SITE_NAME", value: "Company Vault Portal" },
      { key: "SECRET", value: "abc=123#xyz" },
      { key: "EMPTY", value: "" },
    ];

    const exported = exportEnvText(items, {
      projectName: "Ecommerce App",
      environment: "production",
    });

    expect(exported).toContain("# Project: Ecommerce App");
    expect(exported).toContain("# Environment: PRODUCTION");
    expect(exported).toContain("API_URL=https://api.example.com");
    expect(exported).toContain('SITE_NAME="Company Vault Portal"');
    expect(exported).toContain('SECRET="abc=123#xyz"');
    expect(exported).toContain('EMPTY=""');

    // Parse the exported string back to verify round-trip fidelity
    const parsedBack = parseEnvText(exported);
    expect(parsedBack.items).toHaveLength(4);
    expect(parsedBack.items[0].value).toBe("https://api.example.com");
    expect(parsedBack.items[1].value).toBe("Company Vault Portal");
    expect(parsedBack.items[2].value).toBe("abc=123#xyz");
    expect(parsedBack.items[3].value).toBe("");
  });
});
