<script setup lang="ts">
interface Column {
  key: string;
  label: string;
  format?: (value: unknown) => string;
}

defineProps<{
  columns: Column[];
  rows: Record<string, unknown>[];
  loading?: boolean;
}>();

defineEmits<{
  edit: [row: Record<string, unknown>];
  delete: [row: Record<string, unknown>];
}>();
</script>

<template>
  <div class="table-container">
    <table class="admin-table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
          <th class="text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length + 1" class="text-center py-8 text-surface-400">
            Loading...
          </td>
        </tr>
        <tr v-else-if="rows.length === 0">
          <td :colspan="columns.length + 1" class="text-center py-8 text-surface-400">
            No records found
          </td>
        </tr>
        <tr v-for="row in rows" v-else :key="String(row.id)">
          <td v-for="col in columns" :key="col.key">
            {{ col.format ? col.format(row[col.key]) : row[col.key] }}
          </td>
          <td class="text-right">
            <button class="btn-ghost text-xs mr-1" @click="$emit('edit', row)">Edit</button>
            <button class="btn-ghost text-xs text-red-400" @click="$emit('delete', row)">
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
