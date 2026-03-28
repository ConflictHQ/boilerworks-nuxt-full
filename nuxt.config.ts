export default defineNuxtConfig({
  compatibilityDate: "2025-01-01",

  devtools: { enabled: true },

  modules: [
    "@nuxtjs/tailwindcss",
    "@nuxtjs/color-mode",
    "@pinia/nuxt",
    "@vueuse/nuxt",
    "@nuxt/eslint",
    "@nuxt/icon",
  ],

  runtimeConfig: {
    sessionSecret: process.env.SESSION_SECRET || "change-me-in-production",
    databaseUrl:
      process.env.DATABASE_URL ||
      "postgres://dbadmin:Password123@localhost:5450/boilerworks",
    bcryptRounds: 12,
    public: {
      appName: "Boilerworks",
    },
  },

  colorMode: {
    classSuffix: "",
    preference: "dark",
    fallback: "dark",
  },

  tailwindcss: {
    cssPath: "~/assets/css/main.css",
  },

  nitro: {
    experimental: {
      asyncContext: true,
    },
  },

  typescript: {
    strict: true,
  },

  devServer: {
    port: 3005,
  },
});
