export default defineNuxtRouteMiddleware(async () => {
  const { isSuperuser, fetchUser, user } = useAuth();

  if (!user.value) {
    await fetchUser();
  }

  if (!isSuperuser.value) {
    return navigateTo("/");
  }
});
