<script setup lang="ts">
definePageMeta({ middleware: ["auth"] });

const { user } = useAuth();
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <div class="card max-w-md text-center">
      <h1 class="text-2xl font-bold text-surface-100 mb-2">Welcome to Boilerworks</h1>
      <p class="text-surface-400 mb-6">
        Hello, {{ user?.name }}. You are logged in.
      </p>
      <NuxtLink to="/admin" class="btn-primary">
        Go to Admin
      </NuxtLink>
    </div>
  </div>
</template>
