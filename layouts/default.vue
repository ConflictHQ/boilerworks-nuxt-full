<script setup lang="ts">
const { isAuthenticated } = useAuth();
</script>

<template>
  <div class="min-h-screen bg-surface-950">
    <slot />
  </div>
</template>
