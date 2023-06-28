# 148 IPCを実装してみる
メインプロセスとレンダラープロセスでデータのやり取りを行うためにElectronではIPCを使います
①メインプロセス(main.js)にNode.jsで実行する関数を作成
②ipcMain.handle("name", func);をメインプロセスに記述してpreload.jsに対して露出する
③preload.jsにcontextBridge.exposeInMainWorld("name", object)を記述.objectにipcRenderer.invoke()を使って実行するコードをオーバーラップした関数をメソッドとして追加
そうする事でレンダラープロセス(renderer.js)に対して露出する
④レンダラープロセスでwindow.name.funcのように呼び出すとpreload.jsで露出された関数を呼び出す事が出来る