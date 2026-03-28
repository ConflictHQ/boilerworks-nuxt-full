<script setup lang="ts">
import type { PaginatedResult } from "~/types";

definePageMeta({ layout: "admin", middleware: ["auth"] });

const page = ref(1);
const showCreate = ref(false);
const editingCategory = ref<Record<string, unknown> | null>(null);

const { data, refresh, status } = await useFetch<PaginatedResult>("/api/categories", {
  query: { page, pageSize: 20 },
  credentials: "include",
});

const form = ref({ name: "", slug: "", description: "" });

function resetForm() {
  form.value = { name: "", slug: "", description: "" };
}

function openCreate() {
  resetForm();
  editingCategory.value = null;
  showCreate.value = true;
}

function openEdit(row: Record<string, unknown>) {
  editingCategory.value = row;
  form.value = {
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    description: String(row.description ?? ""),
  };
  showCreate.value = true;
}

async function save() {
  if (editingCategory.value) {
    await $fetch(`/api/categories/${editingCategory.value.id}`, {
      method: "PUT",
      body: form.value,
      credentials: "include",
    });
  } else {
    await $fetch("/api/categories", {
      method: "POST",
      body: form.value,
      credentials: "include",
    });
  }
  showCreate.value = false;
  await refresh();
}

async function handleDelete(row: Record<string, unknown>) {
  if (!confirm("Delete this category?")) return;
  await $fetch(`/api/categories/${row.id}`, {
    method: "DELETE",
    credentials: "include",
  });
  await refresh();
}

const columns = [
  { key: "name", label: "Name" },
  { key: "slug", label: "Slug" },
  { key: "description", label: "Description" },
];
</script>

<template>
  <div>
    <UiPageHeader title="Categories" description="Manage product categories">
      <template #actions>
        <button class="btn-primary" @click="openCreate">New Category</button>
      </template>
    </UiPageHeader>

    <UiDataTable
      :columns="columns"
      :rows="(data?.data as Record<string, unknown>[]) ?? []"
      :loading="status === 'pending'"
      @edit="openEdit"
      @delete="handleDelete"
    />

    <UiPagination
      v-if="data"
      :page="data.page"
      :page-size="data.pageSize"
      :total="data.total"
      @update:page="page = $event"
    />

    <UiModal :open="showCreate" :title="editingCategory ? 'Edit Category' : 'New Category'" @close="showCreate = false">
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="label">Name</label>
          <input v-model="form.name" class="input" required />
        </div>
        <div>
          <label class="label">Slug</label>
          <input v-model="form.slug" class="input" required />
        </div>
        <div>
          <label class="label">Description</label>
          <textarea v-model="form.description" class="input min-h-[60px]" />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="btn-secondary" @click="showCreate = false">Cancel</button>
          <button type="submit" class="btn-primary">Save</button>
        </div>
      </form>
    </UiModal>
  </div>
</template>
