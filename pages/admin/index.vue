<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: ["auth"] });

const { user } = useAuth();
</script>

<template>
  <div>
    <UiPageHeader title="Dashboard" description="Overview of your application" />

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <NuxtLink to="/admin/items" class="card hover:border-brand-600 transition-colors">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-600/20">
            <Icon name="heroicons:cube" class="h-6 w-6 text-brand-400" />
          </div>
          <div>
            <p class="text-sm text-surface-400">Items</p>
            <p class="text-lg font-semibold text-surface-100">Manage</p>
          </div>
        </div>
      </NuxtLink>

      <NuxtLink to="/admin/categories" class="card hover:border-brand-600 transition-colors">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-600/20">
            <Icon name="heroicons:tag" class="h-6 w-6 text-green-400" />
          </div>
          <div>
            <p class="text-sm text-surface-400">Categories</p>
            <p class="text-lg font-semibold text-surface-100">Manage</p>
          </div>
        </div>
      </NuxtLink>

      <NuxtLink to="/admin/forms" class="card hover:border-brand-600 transition-colors">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600/20">
            <Icon name="heroicons:document-text" class="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <p class="text-sm text-surface-400">Forms</p>
            <p class="text-lg font-semibold text-surface-100">Manage</p>
          </div>
        </div>
      </NuxtLink>

      <NuxtLink to="/admin/workflows" class="card hover:border-brand-600 transition-colors">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-600/20">
            <Icon name="heroicons:arrow-path" class="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <p class="text-sm text-surface-400">Workflows</p>
            <p class="text-lg font-semibold text-surface-100">Manage</p>
          </div>
        </div>
      </NuxtLink>
    </div>

    <div class="card mt-6">
      <h2 class="text-lg font-semibold text-surface-100 mb-2">Welcome back, {{ user?.name }}</h2>
      <p class="text-sm text-surface-400">
        This is the Boilerworks admin panel. Use the sidebar to navigate between sections.
      </p>
    </div>
  </div>
</template>
