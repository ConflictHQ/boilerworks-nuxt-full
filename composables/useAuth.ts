import type { SessionUser, MutationResult } from "~/types";

export function useAuth() {
  const user = useState<SessionUser | null>("auth-user", () => null);
  const loading = useState<boolean>("auth-loading", () => false);

  async function fetchUser() {
    loading.value = true;
    try {
      const res = await $fetch<MutationResult<SessionUser>>("/api/auth/me", {
        credentials: "include",
      });
      user.value = res.ok ? (res.data ?? null) : null;
    } catch {
      user.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function login(email: string, password: string) {
    const res = await $fetch<MutationResult<{ id: string; email: string; name: string }>>(
      "/api/auth/login",
      {
        method: "POST",
        body: { email, password },
        credentials: "include",
      },
    );
    if (res.ok) {
      await fetchUser();
    }
    return res;
  }

  async function logout() {
    await $fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    user.value = null;
    await navigateTo("/auth/login");
  }

  const isAuthenticated = computed(() => !!user.value);
  const isSuperuser = computed(() => !!user.value?.isSuperuser);

  function hasPermission(permission: string): boolean {
    if (!user.value) return false;
    if (user.value.isSuperuser) return true;
    return user.value.permissions.includes(permission);
  }

  return {
    user,
    loading,
    isAuthenticated,
    isSuperuser,
    fetchUser,
    login,
    logout,
    hasPermission,
  };
}
