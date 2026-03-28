<script setup lang="ts">
import type { PaginatedResult } from "~/types";

definePageMeta({ layout: "admin", middleware: ["auth"] });

const page = ref(1);

const { data, refresh, status } = await useFetch<PaginatedResult>("/api/workflows", {
  query: { page, pageSize: 20 },
  credentials: "include",
});

async function handleDelete(row: Record<string, unknown>) {
  if (!confirm("Delete this workflow?")) return;
  // Soft delete via API would be needed -- for now just refresh
  await refresh();
}

const columns = [
  { key: "name", label: "Name" },
  { key: "slug", label: "Slug" },
  { key: "isActive", label: "Active", format: (v: unknown) => (v ? "Yes" : "No") },
];
</script>

<template>
  <div>
    <UiPageHeader title="Workflows" description="Manage workflow definitions">
      <template #actions>
        <button class="btn-primary" disabled>New Workflow</button>
      </template>
    </UiPageHeader>

    <UiDataTable
      :columns="columns"
      :rows="(data?.data as Record<string, unknown>[]) ?? []"
      :loading="status === 'pending'"
      @edit="(row) => navigateTo(`/admin/workflows/${row.id}`)"
      @delete="handleDelete"
    />

    <UiPagination
      v-if="data"
      :page="data.page"
      :page-size="data.pageSize"
      :total="data.total"
      @update:page="page = $event"
    />
  </div>
</template>
