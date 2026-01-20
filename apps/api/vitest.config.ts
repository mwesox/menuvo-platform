import {defineConfig} from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        include: ["src/test/**/*.test.ts"],
        pool: "forks",
        poolOptions: {
            forks: {singleFork: true},
        },
        setupFiles: ["./src/test/setup.ts"],
        testTimeout: 60000, // Testcontainers startup can take a while
        hookTimeout: 60000, // Testcontainers startup in beforeAll
    },
});
