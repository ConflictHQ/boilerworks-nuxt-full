<script setup lang="ts">
definePageMeta({ layout: "default" });

const { login, isAuthenticated } = useAuth();

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function handleLogin() {
  error.value = "";
  loading.value = true;
  try {
    const res = await login(email.value, password.value);
    if (res.ok) {
      await navigateTo("/admin");
    } else {
      error.value = res.errors?.join(", ") ?? "Login failed";
    }
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } };
    error.value = err?.data?.message ?? "Invalid credentials";
  } finally {
    loading.value = false;
  }
}

// Redirect if already logged in
watchEffect(() => {
  if (isAuthenticated.value) {
    navigateTo("/admin");
  }
});
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-surface-950">
    <div class="w-full max-w-sm">
      <div class="card">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-brand-400">Boilerworks</h1>
          <p class="mt-2 text-sm text-surface-400">Sign in to your account</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div v-if="error" class="rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400">
            {{ error }}
          </div>

          <div>
            <label for="email" class="label">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              class="input"
              placeholder="admin@boilerworks.dev"
            />
          </div>

          <div>
            <label for="password" class="label">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              class="input"
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" class="btn-primary w-full" :disabled="loading">
            {{ loading ? "Signing in..." : "Sign in" }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
