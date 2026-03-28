<script setup lang="ts">
import type { PaginatedResult } from "~/types";

definePageMeta({ layout: "admin", middleware: ["auth", "admin"] });

const page = ref(1);
const showCreate = ref(false);

const { data, refresh, status } = await useFetch<PaginatedResult>("/api/admin/users", {
  query: { page, pageSize: 20 },
  credentials: "include",
});

const form = ref({
  email: "",
  name: "",
  password: "",
  isActive: true,
  isSuperuser: false,
});

function resetForm() {
  form.value = { email: "", name: "", password: "", isActive: true, isSuperuser: false };
}

async function save() {
  await $fetch("/api/admin/users", {
    method: "POST",
    body: form.value,
    credentials: "include",
  });
  showCreate.value = false;
  resetForm();
  await refresh();
}

const columns = [
  { key: "email", label: "Email" },
  { key: "name", label: "Name" },
  { key: "isActive", label: "Active", format: (v: unknown) => (v ? "Yes" : "No") },
  { key: "isSuperuser", label: "Superuser", format: (v: unknown) => (v ? "Yes" : "No") },
];
</script>

<template>
  <div>
    <UiPageHeader title="Users" description="Manage user accounts">
      <template #actions>
        <button class="btn-primary" @click="showCreate = true">New User</button>
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

    <UiModal :open="showCreate" title="New User" @close="showCreate = false">
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="label">Email</label>
          <input v-model="form.email" type="email" class="input" required />
        </div>
        <div>
          <label class="label">Name</label>
          <input v-model="form.name" class="input" required />
        </div>
        <div>
          <label class="label">Password</label>
          <input v-model="form.password" type="password" class="input" required minlength="8" />
        </div>
        <div class="flex gap-6">
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="form.isActive" type="checkbox" class="h-4 w-4 rounded" />
            <span class="text-sm text-surface-300">Active</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="form.isSuperuser" type="checkbox" class="h-4 w-4 rounded" />
            <span class="text-sm text-surface-300">Superuser</span>
          </label>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="btn-secondary" @click="showCreate = false">Cancel</button>
          <button type="submit" class="btn-primary">Create</button>
        </div>
      </form>
    </UiModal>
  </div>
</template>
