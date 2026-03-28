export default defineNuxtRouteMiddleware(async () => {
  const { isAuthenticated, fetchUser, user } = useAuth();

  if (!user.value) {
    await fetchUser();
  }

  if (!isAuthenticated.value) {
    return navigateTo("/auth/login");
  }
});
