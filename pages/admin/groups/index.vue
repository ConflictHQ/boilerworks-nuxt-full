<script setup lang="ts">
import type { PaginatedResult } from "~/types";

definePageMeta({ layout: "admin", middleware: ["auth", "admin"] });

const page = ref(1);
const showCreate = ref(false);

const { data, refresh, status } = await useFetch<PaginatedResult>("/api/admin/groups", {
  query: { page, pageSize: 20 },
  credentials: "include",
});

const form = ref({ name: "", description: "" });

function resetForm() {
  form.value = { name: "", description: "" };
}

async function save() {
  await $fetch("/api/admin/groups", {
    method: "POST",
    body: form.value,
    credentials: "include",
  });
  showCreate.value = false;
  resetForm();
  await refresh();
}

const columns = [
  { key: "name", label: "Name" },
  { key: "description", label: "Description" },
];
</script>

<template>
  <div>
    <UiPageHeader title="Groups" description="Manage permission groups">
      <template #actions>
        <button class="btn-primary" @click="showCreate = true">New Group</button>
      </template>
    </UiPageHeader>

    <UiDataTable
      :columns="columns"
      :rows="(data?.data as Record<string, unknown>[]) ?? []"
      :loading="status === 'pending'"
      @edit="() => {}"
      @delete="() => {}"
    />

    <UiPagination
      v-if="data"
      :page="data.page"
      :page-size="data.pageSize"
      :total="data.total"
      @update:page="page = $event"
    />

    <UiModal :open="showCreate" title="New Group" @close="showCreate = false">
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="label">Name</label>
          <input v-model="form.name" class="input" required />
        </div>
        <div>
          <label class="label">Description</label>
          <textarea v-model="form.description" class="input min-h-[60px]" />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="btn-secondary" @click="showCreate = false">Cancel</button>
          <button type="submit" class="btn-primary">Create</button>
        </div>
      </form>
    </UiModal>
  </div>
</template>
