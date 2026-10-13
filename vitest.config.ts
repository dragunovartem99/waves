import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
	test: {
		environment: "node",
		mockReset: true,
		passWithNoTests: true,
		coverage: {
			provider: "v8",
			include: ["src/modules/*/utils/**/*.ts"],
			exclude: ["**/index.ts"],
		},
	},
});
