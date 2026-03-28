<script setup lang="ts">
import type { PaginatedResult } from "~/types";

definePageMeta({ layout: "admin", middleware: ["auth"] });

const page = ref(1);

const { data, refresh, status } = await useFetch<PaginatedResult>("/api/forms", {
  query: { page, pageSize: 20 },
  credentials: "include",
});

async function handleDelete(row: Record<string, unknown>) {
  if (!confirm("Delete this form?")) return;
  await $fetch(`/api/forms/${row.id}`, {
    method: "DELETE",
    credentials: "include",
  });
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
    <UiPageHeader title="Forms" description="Manage dynamic form definitions">
      <template #actions>
        <NuxtLink to="/admin/forms/new" class="btn-primary">New Form</NuxtLink>
      </template>
    </UiPageHeader>

    <UiDataTable
      :columns="columns"
      :rows="(data?.data as Record<string, unknown>[]) ?? []"
      :loading="status === 'pending'"
      @edit="(row) => navigateTo(`/admin/forms/${row.id}`)"
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
