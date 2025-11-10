import { ApiRuleItem } from "@/types";

export default defineBackground(async () => {
  // console.log("Hello background!", { id: browser.runtime.id });
  function stringToBase64(str: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const binary = Array.from(data, (byte) => String.fromCharCode(byte)).join("");
    return btoa(binary);
  }
  async function addRules(rules: ApiRuleItem[]) {
    if (!rules.length) return;
    return browser.declarativeNetRequest.updateDynamicRules({
      addRules: rules.map((rule) => {
        return {
          id: rule.id,
          priority: 1,
          action: {
            type: "redirect",
            redirect: {
              url: `data:application/json;charset=utf-8,${rule.mock}`,
            },
          },
          condition: {
            urlFilter: rule.path,
            requestMethods: [rule.method.toLocaleLowerCase() as any],
            resourceTypes: ["xmlhttprequest"],
          },
        };
      }),
    });
  }
  async function removeRules(ids: number[]) {
    if (!ids.length) return;
    return browser.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ids,
    });
  }
  const initialRules: ApiRuleItem[] = (await storage.getItem("local:rules")) || [];
  if (initialRules.length > 0) {
    removeRules(initialRules.map((o) => o.id)).then(() => {
      addRules(initialRules);
    });
  }
  browser.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.type === "addDynamicRules") {
      const rules: ApiRuleItem[] = message.data;
      addRules(rules);
      sendResponse({ status: 1, error: null });
      return true;
    }
    if (message.type === "removeDynamicRules") {
      const ids: number[] = message.data;
      removeRules(ids);
      sendResponse({ status: 1, error: null });
      return true;
    }
    if (message.type === "updateDynamicRules") {
      const rules: ApiRuleItem[] = message.data;
      const ids = rules.map((o) => o.id);
      const enabledRules = rules.filter((o) => !!o.enabled);
      removeRules(ids).then(() => {
        addRules(enabledRules);
        sendResponse({ status: 1, error: null });
      });
      return true;
    }
  });
  // 监听网络请求
  // browser.declarativeNetRequest.onRuleMatchedDebug.addListener((details) => {
  //   console.log("Request matched:", details);
  // });
});
