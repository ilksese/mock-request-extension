import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifestVersion: 3,
  manifest: {
    permissions: ["storage", "webRequest", "webRequestBlocking"],
    host_permissions: ["<all_urls>"],
  },
  vite: () => {
    return {
      plugins: [tailwindcss()],
    };
  },
});
