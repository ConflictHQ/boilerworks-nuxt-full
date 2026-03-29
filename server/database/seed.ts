import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://dbadmin:Password123@localhost:5450/boilerworks";

async function seed() {
  const client = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(client, { schema });

  console.log("Seeding database...");

  // Create permissions
  const permissionData = [
    { codename: "items.create", name: "Create items" },
    { codename: "items.update", name: "Update items" },
    { codename: "items.delete", name: "Delete items" },
    { codename: "items.view", name: "View items" },
    { codename: "categories.create", name: "Create categories" },
    { codename: "categories.update", name: "Update categories" },
    { codename: "categories.delete", name: "Delete categories" },
    { codename: "categories.view", name: "View categories" },
    { codename: "forms.create", name: "Create forms" },
    { codename: "forms.update", name: "Update forms" },
    { codename: "forms.delete", name: "Delete forms" },
    { codename: "forms.view", name: "View forms" },
    { codename: "forms.view_submissions", name: "View form submissions" },
    { codename: "workflows.create", name: "Create workflows" },
    { codename: "workflows.update", name: "Update workflows" },
    { codename: "workflows.delete", name: "Delete workflows" },
    { codename: "workflows.view", name: "View workflows" },
    { codename: "workflows.execute", name: "Execute workflows" },
  ];

  const insertedPermissions = await db
    .insert(schema.permissions)
    .values(permissionData)
    .onConflictDoNothing()
    .returning();

  console.log(`Inserted ${insertedPermissions.length} permissions`);

  // Create default groups
  const [adminGroup] = await db
    .insert(schema.groups)
    .values([
      { name: "Administrators", description: "Full access to all resources" },
      { name: "Editors", description: "Can manage items and categories" },
      { name: "Viewers", description: "Read-only access" },
    ])
    .onConflictDoNothing()
    .returning();

  // Assign all permissions to admin group
  if (adminGroup && insertedPermissions.length > 0) {
    await db
      .insert(schema.groupPermissions)
      .values(
        insertedPermissions.map((p) => ({
          groupId: adminGroup.id,
          permissionId: p.id,
        })),
      )
      .onConflictDoNothing();
  }

  console.log("Created groups with permissions");

  // Create superuser
  const passwordHash = await bcrypt.hash("admin123!", 12);
  const [superuser] = await db
    .insert(schema.users)
    .values({
      email: "admin@boilerworks.dev",
      name: "Admin",
      passwordHash,
      isActive: true,
      isSuperuser: true,
    })
    .onConflictDoNothing()
    .returning();

  if (superuser && adminGroup) {
    await db
      .insert(schema.userGroups)
      .values({ userId: superuser.id, groupId: adminGroup.id })
      .onConflictDoNothing();
  }

  console.log("Created superuser: admin@boilerworks.dev / admin123!");

  // Seed sample categories
  const [electronics] = await db
    .insert(schema.categories)
    .values([
      {
        name: "Electronics",
        slug: "electronics",
        description: "Electronic devices and gadgets",
      },
      {
        name: "Books",
        slug: "books",
        description: "Physical and digital books",
      },
      {
        name: "Clothing",
        slug: "clothing",
        description: "Apparel and accessories",
      },
    ])
    .onConflictDoNothing()
    .returning();

  console.log("Created sample categories");

  // Seed sample items
  if (electronics) {
    await db
      .insert(schema.items)
      .values([
        {
          name: "Wireless Headphones",
          slug: "wireless-headphones",
          description: "Premium noise-cancelling headphones",
          price: 29999,
          sku: "WH-001",
          isPublished: true,
          categoryId: electronics.id,
        },
        {
          name: "USB-C Hub",
          slug: "usb-c-hub",
          description: "7-port USB-C hub with HDMI",
          price: 4999,
          sku: "UCH-001",
          isPublished: true,
          categoryId: electronics.id,
        },
      ])
      .onConflictDoNothing();
  }

  console.log("Created sample items");
  console.log("Seed complete.");

  await client.end();
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
