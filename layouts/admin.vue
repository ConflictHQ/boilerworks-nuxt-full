<script setup lang="ts">
const { user, logout, isSuperuser } = useAuth();
const route = useRoute();

const sidebarOpen = ref(true);

const navItems = computed(() => {
  const items = [
    { label: "Dashboard", to: "/admin", icon: "heroicons:home" },
    { label: "Items", to: "/admin/items", icon: "heroicons:cube" },
    { label: "Categories", to: "/admin/categories", icon: "heroicons:tag" },
    { label: "Forms", to: "/admin/forms", icon: "heroicons:document-text" },
    { label: "Workflows", to: "/admin/workflows", icon: "heroicons:arrow-path" },
  ];

  if (isSuperuser.value) {
    items.push(
      { label: "Users", to: "/admin/users", icon: "heroicons:users" },
      { label: "Groups", to: "/admin/groups", icon: "heroicons:user-group" },
    );
  }

  return items;
});

function isActive(to: string) {
  if (to === "/admin") return route.path === "/admin";
  return route.path.startsWith(to);
}
</script>

<template>
  <div class="min-h-screen bg-surface-950 flex">
    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-30 flex flex-col border-r border-surface-700 bg-surface-900 transition-all duration-200"
      :class="sidebarOpen ? 'w-64' : 'w-16'"
    >
      <!-- Logo -->
      <div class="flex h-16 items-center border-b border-surface-700 px-4">
        <span v-if="sidebarOpen" class="text-lg font-bold text-brand-400"> Boilerworks </span>
        <span v-else class="text-lg font-bold text-brand-400">B</span>
      </div>

      <!-- Nav -->
      <nav class="flex-1 overflow-y-auto py-4">
        <ul class="space-y-1 px-2">
          <li v-for="item in navItems" :key="item.to">
            <NuxtLink
              :to="item.to"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors"
              :class="
                isActive(item.to)
                  ? 'bg-brand-600/20 text-brand-400'
                  : 'text-surface-300 hover:bg-surface-800 hover:text-surface-100'
              "
            >
              <Icon :name="item.icon" class="h-5 w-5 flex-shrink-0" />
              <span v-if="sidebarOpen">{{ item.label }}</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <!-- User section -->
      <div class="border-t border-surface-700 p-4">
        <div v-if="sidebarOpen" class="flex items-center gap-3">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-medium text-white"
          >
            {{ user?.name?.charAt(0)?.toUpperCase() ?? "?" }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="truncate text-sm font-medium text-surface-100">{{ user?.name }}</p>
            <p class="truncate text-xs text-surface-400">{{ user?.email }}</p>
          </div>
        </div>
        <button
          class="mt-3 w-full btn-ghost text-xs"
          :class="sidebarOpen ? '' : 'px-0 justify-center'"
          @click="logout"
        >
          <Icon name="heroicons:arrow-right-on-rectangle" class="h-4 w-4" />
          <span v-if="sidebarOpen" class="ml-2">Sign out</span>
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 transition-all duration-200" :class="sidebarOpen ? 'ml-64' : 'ml-16'">
      <!-- Top bar -->
      <header
        class="sticky top-0 z-20 flex h-16 items-center border-b border-surface-700 bg-surface-900/80 px-6 backdrop-blur"
      >
        <button class="btn-ghost p-1" @click="sidebarOpen = !sidebarOpen">
          <Icon name="heroicons:bars-3" class="h-5 w-5" />
        </button>
      </header>

      <!-- Page content -->
      <main class="p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
