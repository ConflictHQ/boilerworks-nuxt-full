import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  jsonb,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Base columns shared across all tables
// ---------------------------------------------------------------------------
const baseColumns = {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: uuid("created_by"),
  updatedBy: uuid("updated_by"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  deletedBy: uuid("deleted_by"),
};

// ---------------------------------------------------------------------------
// Auth: Users
// ---------------------------------------------------------------------------
export const users = pgTable(
  "users",
  {
    ...baseColumns,
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    isSuperuser: boolean("is_superuser").notNull().default(false),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

// ---------------------------------------------------------------------------
// Auth: Sessions
// ---------------------------------------------------------------------------
export const sessions = pgTable("sessions", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Auth: Groups & Permissions
// ---------------------------------------------------------------------------
export const groups = pgTable(
  "groups",
  {
    ...baseColumns,
    name: text("name").notNull(),
    description: text("description"),
  },
  (table) => [uniqueIndex("groups_name_idx").on(table.name)],
);

export const permissions = pgTable(
  "permissions",
  {
    ...baseColumns,
    codename: text("codename").notNull(),
    name: text("name").notNull(),
    description: text("description"),
  },
  (table) => [uniqueIndex("permissions_codename_idx").on(table.codename)],
);

export const groupPermissions = pgTable("group_permissions", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id),
  permissionId: uuid("permission_id")
    .notNull()
    .references(() => permissions.id),
});

export const userGroups = pgTable("user_groups", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id),
});

// ---------------------------------------------------------------------------
// Items & Categories
// ---------------------------------------------------------------------------
export const categories = pgTable(
  "categories",
  {
    ...baseColumns,
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    parentId: uuid("parent_id"),
  },
  (table) => [uniqueIndex("categories_slug_idx").on(table.slug)],
);

export const items = pgTable("items", {
  ...baseColumns,
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  price: integer("price").notNull().default(0), // stored in cents
  sku: text("sku"),
  isPublished: boolean("is_published").notNull().default(false),
  categoryId: uuid("category_id").references(() => categories.id),
});

// ---------------------------------------------------------------------------
// Forms Engine
// ---------------------------------------------------------------------------
export const formDefinitions = pgTable("form_definitions", {
  ...baseColumns,
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  fields: jsonb("fields").notNull().$type<
    {
      name: string;
      label: string;
      type: string;
      required?: boolean;
      options?: { label: string; value: string }[];
      placeholder?: string;
      defaultValue?: string;
    }[]
  >(),
  isActive: boolean("is_active").notNull().default(true),
});

export const formSubmissions = pgTable("form_submissions", {
  ...baseColumns,
  formDefinitionId: uuid("form_definition_id")
    .notNull()
    .references(() => formDefinitions.id),
  data: jsonb("data").notNull().$type<Record<string, unknown>>(),
  status: text("status").notNull().default("submitted"),
});

// ---------------------------------------------------------------------------
// Workflow Engine
// ---------------------------------------------------------------------------
export const workflowDefinitions = pgTable("workflow_definitions", {
  ...baseColumns,
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  steps: jsonb("steps").notNull().$type<
    {
      name: string;
      label: string;
      type: string;
      assigneeGroupId?: string;
      nextSteps: string[];
    }[]
  >(),
  isActive: boolean("is_active").notNull().default(true),
});

export const workflowInstances = pgTable("workflow_instances", {
  ...baseColumns,
  workflowDefinitionId: uuid("workflow_definition_id")
    .notNull()
    .references(() => workflowDefinitions.id),
  currentStep: text("current_step").notNull(),
  status: text("status").notNull().default("active"), // active, completed, cancelled
  context: jsonb("context").$type<Record<string, unknown>>(),
});

export const workflowTransitions = pgTable("workflow_transitions", {
  ...baseColumns,
  instanceId: uuid("instance_id")
    .notNull()
    .references(() => workflowInstances.id),
  fromStep: text("from_step").notNull(),
  toStep: text("to_step").notNull(),
  action: text("action"),
  comment: text("comment"),
});

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  oldValues: jsonb("old_values").$type<Record<string, unknown>>(),
  newValues: jsonb("new_values").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------
export const usersRelations = relations(users, ({ many }) => ({
  userGroups: many(userGroups),
  sessions: many(sessions),
}));

export const groupsRelations = relations(groups, ({ many }) => ({
  userGroups: many(userGroups),
  groupPermissions: many(groupPermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  groupPermissions: many(groupPermissions),
}));

export const userGroupsRelations = relations(userGroups, ({ one }) => ({
  user: one(users, { fields: [userGroups.userId], references: [users.id] }),
  group: one(groups, { fields: [userGroups.groupId], references: [groups.id] }),
}));

export const groupPermissionsRelations = relations(
  groupPermissions,
  ({ one }) => ({
    group: one(groups, {
      fields: [groupPermissions.groupId],
      references: [groups.id],
    }),
    permission: one(permissions, {
      fields: [groupPermissions.permissionId],
      references: [permissions.id],
    }),
  }),
);

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  items: many(items),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  category: one(categories, {
    fields: [items.categoryId],
    references: [categories.id],
  }),
}));

export const formSubmissionsRelations = relations(
  formSubmissions,
  ({ one }) => ({
    definition: one(formDefinitions, {
      fields: [formSubmissions.formDefinitionId],
      references: [formDefinitions.id],
    }),
  }),
);

export const workflowInstancesRelations = relations(
  workflowInstances,
  ({ one, many }) => ({
    definition: one(workflowDefinitions, {
      fields: [workflowInstances.workflowDefinitionId],
      references: [workflowDefinitions.id],
    }),
    transitions: many(workflowTransitions),
  }),
);

export const workflowTransitionsRelations = relations(
  workflowTransitions,
  ({ one }) => ({
    instance: one(workflowInstances, {
      fields: [workflowTransitions.instanceId],
      references: [workflowInstances.id],
    }),
  }),
);
