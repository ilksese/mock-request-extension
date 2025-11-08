export default defineContentScript({
  matches: ["*://*/*"],
  runAt: "document_end",
  async main() {
    // const script = document.createElement("script");
    // script.src = browser.runtime.getURL("/hook.js");
    // console.log('script.src',script.src)
    // document.documentElement.appendChild(script);
  },
});
