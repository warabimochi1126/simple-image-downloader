/* preload.jsはメインプロセスとレンダラープロセスの橋渡しを行っています */
const { contextBridge, ipcRenderer } = require("electron");

// contextBridge.exposeInMainWorldに登録した関数はレンダラープロセスから使用する事が出来ます
contextBridge.exposeInMainWorld("imgDl", {
  // window.imgDl.fetchImgs("http://localhost:3000");
  async fetchImgs(targetUrl) {
    const result = await ipcRenderer.invoke("fetchImgs", targetUrl);
    return result;
  },
  // window.imgDl.saveImgs();
  async saveImgs() {
    const result = await ipcRenderer.invoke("saveImgs");
    return result;
  }
});