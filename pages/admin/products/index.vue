<script setup lang="ts">
import type { PaginatedResult, MutationResult } from "~/types";

definePageMeta({ layout: "admin", middleware: ["auth"] });

const page = ref(1);
const showCreate = ref(false);
const editingProduct = ref<Record<string, unknown> | null>(null);

const { data, refresh, status } = await useFetch<PaginatedResult>("/api/products", {
  query: { page, pageSize: 20 },
  credentials: "include",
});

const form = ref({
  name: "",
  slug: "",
  description: "",
  price: 0,
  sku: "",
  isPublished: false,
  categoryId: "",
});

function resetForm() {
  form.value = { name: "", slug: "", description: "", price: 0, sku: "", isPublished: false, categoryId: "" };
}

function openCreate() {
  resetForm();
  editingProduct.value = null;
  showCreate.value = true;
}

function openEdit(row: Record<string, unknown>) {
  editingProduct.value = row;
  form.value = {
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    description: String(row.description ?? ""),
    price: Number(row.price ?? 0),
    sku: String(row.sku ?? ""),
    isPublished: Boolean(row.isPublished),
    categoryId: String(row.categoryId ?? ""),
  };
  showCreate.value = true;
}

async function save() {
  if (editingProduct.value) {
    await $fetch(`/api/products/${editingProduct.value.id}`, {
      method: "PUT",
      body: form.value,
      credentials: "include",
    });
  } else {
    await $fetch("/api/products", {
      method: "POST",
      body: form.value,
      credentials: "include",
    });
  }
  showCreate.value = false;
  await refresh();
}

async function handleDelete(row: Record<string, unknown>) {
  if (!confirm("Delete this product?")) return;
  await $fetch(`/api/products/${row.id}`, {
    method: "DELETE",
    credentials: "include",
  });
  await refresh();
}

const columns = [
  { key: "name", label: "Name" },
  { key: "slug", label: "Slug" },
  { key: "price", label: "Price", format: (v: unknown) => `$${(Number(v) / 100).toFixed(2)}` },
  { key: "sku", label: "SKU" },
  { key: "isPublished", label: "Published", format: (v: unknown) => (v ? "Yes" : "No") },
];
</script>

<template>
  <div>
    <UiPageHeader title="Products" description="Manage your product catalogue">
      <template #actions>
        <button class="btn-primary" @click="openCreate">New Product</button>
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

    <UiModal :open="showCreate" :title="editingProduct ? 'Edit Product' : 'New Product'" @close="showCreate = false">
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
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Price (cents)</label>
            <input v-model.number="form.price" type="number" class="input" required />
          </div>
          <div>
            <label class="label">SKU</label>
            <input v-model="form.sku" class="input" />
          </div>
        </div>
        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="form.isPublished" type="checkbox" class="h-4 w-4 rounded" />
          <span class="text-sm text-surface-300">Published</span>
        </label>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" class="btn-secondary" @click="showCreate = false">Cancel</button>
          <button type="submit" class="btn-primary">Save</button>
        </div>
      </form>
    </UiModal>
  </div>
</template>
