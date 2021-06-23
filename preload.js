// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener("DOMContentLoaded", () => {
  const { RequestBoy } = require("./RequestBoy");

  const requestBoy = new RequestBoy();

  requestBoy.init();
});
