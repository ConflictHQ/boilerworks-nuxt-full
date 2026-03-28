<script setup lang="ts">
const props = defineProps<{
  page: number;
  pageSize: number;
  total: number;
}>();

const emit = defineEmits<{
  "update:page": [page: number];
}>();

const totalPages = computed(() => Math.ceil(props.total / props.pageSize));
const hasPrev = computed(() => props.page > 1);
const hasNext = computed(() => props.page < totalPages.value);
</script>

<template>
  <div class="flex items-center justify-between py-4" v-if="total > 0">
    <p class="text-sm text-surface-400">
      Showing {{ (page - 1) * pageSize + 1 }} to {{ Math.min(page * pageSize, total) }} of {{ total }}
    </p>
    <div class="flex gap-2">
      <button
        class="btn-secondary text-xs"
        :disabled="!hasPrev"
        @click="emit('update:page', page - 1)"
      >
        Previous
      </button>
      <button
        class="btn-secondary text-xs"
        :disabled="!hasNext"
        @click="emit('update:page', page + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>
