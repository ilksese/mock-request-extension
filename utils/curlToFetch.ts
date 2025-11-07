export function curlToFetch(curlString: string) {
  // 初始化请求参数
  let url = "";
  let method = "GET";
  const headers = {};
  let body = null;

  // 解析 URL
  const urlMatch = curlString.match(/cURL\s+['"]?([^'"\s]+)/);
  if (urlMatch) {
    url = urlMatch[1];
  }

  console.debug("%c[url]", "color: red;background:yellow", url);

  // 解析请求方法
  if (curlString.includes("-X POST")) {
    method = "POST";
  } else if (curlString.includes("-X PUT")) {
    method = "PUT";
  } else if (curlString.includes("-X DELETE")) {
    method = "DELETE";
  } else if (curlString.includes("-X PATCH")) {
    method = "PATCH";
  } else if (curlString.includes("-d") || curlString.includes("--data")) {
    method = "POST";
  }

  // 解析请求头
  const headerMatches = curlString.match(/-H\s+['"]([^'"]+)['"]/g);
  if (headerMatches) {
    headerMatches.forEach((header) => {
      const headerMatch = header.match(/-H\s+['"]([^'"]+)['"]/);
      if (headerMatch) {
        const [key, value] = headerMatch[1].split(":");
        // @ts-ignore
        headers[key.trim()] = value.trim();
      }
    });
  }

  // 解析请求体
  const dataMatch = curlString.match(/-d\s+['"]([^'"]+)['"]/);
  if (dataMatch) {
    body = dataMatch[1];
    // 如果没有设置 Content-Type，默认设置为 application/json
    // @ts-ignore
    if (!headers["Content-Type"] && !headers["content-type"]) {
      // @ts-ignore
      headers["Content-Type"] = "application/json";
    }
  }

  // 构建 fetch 请求参数
  const fetchOptions = {
    method,
    headers,
  };

  // 如果有请求体，添加到请求参数中
  if (body) {
    // @ts-ignore
    fetchOptions.body = body;
  }

  // 发起 fetch 请求
  return fetch(url, fetchOptions);
}
