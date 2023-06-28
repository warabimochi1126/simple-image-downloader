// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain, dialog, shell} = require('electron')
const path = require('path')
const download = require('image-downloader');
//各OSによって異なるchromeまでのパスを取得するライブラリ
const chromePath = require('chrome-paths');
function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // 自動的に検証を開くという設定です
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const { chromium } = require("@playwright/test");
const { url } = require('inspector');

let imgUrls;

//画像URLを取得する関数
//IPCでメソッドを呼んだ場合の第1引数はどういったイベントが発生したかを特定するオブジェクトが渡ってきます.なのでipcRendererで実行した引数は第2引数以下に渡ってきます
async function fetchImgs(event, targetUrl) {
  // ブラウザを開く.画像のURLを取得する.配列で返す
  // excutablePath: chromePath.chromeでPlayWrightをchromeで起動するように設定する
  const browser = await chromium.launch({ headless: false, slowMo: 500, executablePath: chromePath.chrome });
  const page = await browser.newPage();
  await page.goto(targetUrl);
  const imageLocators = page.locator("img");
  const imgCount = await imageLocators.count();

  imgUrls = [];
  
  for (let i = 0; i < imgCount; i++) {
    const imgLocator = imageLocators.locator(`nth=${i}`);
    // Locator.evaluate()は第1引数にLocatorのDOMが渡されます.DOMのメソッドを実行した結果が戻り値に返ってきます
    const imgSrc = await imgLocator.evaluate(node => node.currentSrc);
    imgUrls.push(imgSrc);
  }

  await browser.close();

  return imgUrls;
}

// 画像をローカルに保存する関数
// 取得した画像を特定のフォルダに対して保存する動作を行う
async function saveImgs() {
  //BrowserWindow.getFocusedWindow()で現在アクティブなウィンドウを取得します
  const win = BrowserWindow.getFocusedWindow();

  // フォルダを選択する処理
  // dialog.showOpenDialogはフォルダを開きます.第1引数にwin,第2引数に開くダイアログのオプションを渡します
  // properties;["openDirectory"]はフォルダ選択用のダイアログを表示する設定です
  // defaultPath;"."はダイアログを開いた時のパスを設定しています
  const pathResult = await dialog.showOpenDialog(win, {
    properties: ["openDirectory"],
    defaultPath: "."
  });

  //Electron.OpenDialogReturnValue.canceledは開かれたダイアログがキャンセルされた時trueになります
  if (pathResult.canceled) {
    return "cancel";
  }

  //pathresult.filePathsにダイアログで選択されたファイルパスが配列で代入されています
  const dest = pathResult.filePaths[0];

  try {
    for (const url of imgUrls) {
      //download.imageで画像保存に対する設定を行います.urlプロパティに保存したい画像のurl.destプロパティに保存先のファイルパスを設定します
      await download.image({
        url: url,
        dest: dest
      })
      .then((result) => {
        console.log("success : ", result);
      })
      .catch((e) => {
        console.error("error occured : ", e);
      })
    }
  } catch(e) {
    return "failed";
  }

  //保存が終わったら保存したフォルダのパスを開くようにします
  setTimeout(() => {
    shell.openPath(dest);
  }, 2000);

  return "success";
}

//IPCでデータをやり取りする準備を行っています
ipcMain.handle("fetchImgs", fetchImgs);
ipcMain.handle("saveImgs", saveImgs);