export function sendMessage<T>(message: any): Promise<T> {
  return new Promise((resolve, reject) => {
    browser.runtime.sendMessage(message, (response) => {
      if (response.error) {
        reject(response.error);
      } else {
        resolve(response);
      }
    });
  });
}
