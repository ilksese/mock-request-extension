import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifestVersion: 3,
  manifest: {
    permissions: [
      "storage",
      "scripting",
      "activeTab",
      "tabs",
      "declarativeNetRequest",
      "declarativeNetRequestWithHostAccess",
      "declarativeNetRequestFeedback",
    ],
    host_permissions: ["<all_urls>"],
    web_accessible_resources: [{ matches: ["*://*/*"], resources: ["hook.js"] }],
  },
  vite: () => {
    return {
      plugins: [tailwindcss()],
    };
  },
});
