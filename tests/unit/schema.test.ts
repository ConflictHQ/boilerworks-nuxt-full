import { describe, it, expect } from "vitest";
import * as schema from "~/server/database/schema";

describe("database schema", () => {
  it("exports users table", () => {
    expect(schema.users).toBeDefined();
  });

  it("exports sessions table", () => {
    expect(schema.sessions).toBeDefined();
  });

  it("exports groups table", () => {
    expect(schema.groups).toBeDefined();
  });

  it("exports permissions table", () => {
    expect(schema.permissions).toBeDefined();
  });

  it("exports items table", () => {
    expect(schema.items).toBeDefined();
  });

  it("exports categories table", () => {
    expect(schema.categories).toBeDefined();
  });

  it("exports formDefinitions table", () => {
    expect(schema.formDefinitions).toBeDefined();
  });

  it("exports formSubmissions table", () => {
    expect(schema.formSubmissions).toBeDefined();
  });

  it("exports workflowDefinitions table", () => {
    expect(schema.workflowDefinitions).toBeDefined();
  });

  it("exports workflowInstances table", () => {
    expect(schema.workflowInstances).toBeDefined();
  });

  it("exports workflowTransitions table", () => {
    expect(schema.workflowTransitions).toBeDefined();
  });

  it("exports auditLogs table", () => {
    expect(schema.auditLogs).toBeDefined();
  });

  it("exports relations for users", () => {
    expect(schema.usersRelations).toBeDefined();
  });

  it("exports relations for items", () => {
    expect(schema.itemsRelations).toBeDefined();
  });
});
