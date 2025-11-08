// 拦截fetch
const originalFetch = window.fetch;
window.fetch = function (...args) {
  console.log("Intercepted fetch:", args);
  return originalFetch.apply(this, args);
};

// 拦截XMLHttpRequest
const originalXMLHttpRequest = window.XMLHttpRequest;
window.XMLHttpRequest = function () {
  const xhr = new originalXMLHttpRequest();
  const originalOpen = xhr.open;
  const originalSend = xhr.send;
  xhr.open = function (...args) {
    console.log("Intercepted XMLHttpRequest open:", args);
    return originalOpen.apply(this, args);
  };
  // xhr.addEventListener("loadend", (e) => {
  //   console.log("Intercepted XMLHttpRequest loadend:", e.target.responseText);
  // });
  xhr.send = function (...args) {
    console.log("Intercepted XMLHttpRequest:", args);
    return originalSend.apply(this, args);
  };
  return xhr;
};
