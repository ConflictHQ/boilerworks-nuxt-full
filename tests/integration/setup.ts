/**
 * Setup file for integration tests.
 * Stubs Nitro auto-imports that are evaluated at module scope in handler files.
 * Runs before test file collection so globals exist when handler modules load.
 */

// defineEventHandler is called at module scope — just pass through the handler fn
(globalThis as any).defineEventHandler = (handler: Function) => handler;

// useRuntimeConfig is sometimes called at module scope
(globalThis as any).useRuntimeConfig = () => ({
  bcryptRounds: 10,
  databaseUrl: "",
});
