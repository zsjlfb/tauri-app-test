import {WebviewWindow, WindowOptions} from "@tauri-apps/api/window";

enum WinType {
  /**
   * 百度弹窗
   */
  BAIDU = "baidu"
}

const optionMap = new Map<WinType, WindowOptions>([
  // [WinType.MAIN, {url: '/', visible: false}],
  [WinType.BAIDU, {url: "https://www.baidu.com", visible: false}]
]);

// 定义一个名为 Windows 的类
class Windows {

  // 类的构造函数
  constructor() {
  }

  /**
   * 创建窗口
   * @param label 标签
   */
  createWin(label: WinType): Promise<WebviewWindow> {
    // 如果 Promise 不存在，创建一个新的 Promise
    const promise = new Promise<WebviewWindow>((resolve, reject) => {
      // 创建一个新的 WebviewWindow 对象
      const webview = new WebviewWindow(label, optionMap.get(label));
      // 当 webview 创建成功时，解析 Promise
      webview.once('tauri://created', () => {
        console.log('webview window successfully created');
        resolve(webview);
      });
      // 当 webview 创建失败时，拒绝 Promise
      webview.once('tauri://error', (e) => {
        console.log('an error occurred during webview window creation', e);
        reject(e);
      });

      webview.listen('message-from-child', (data) => {
        console.log(data) // prints the data sent from the child window
      })
      webview.emit("message-from-child","message-from-child-2341234123")
    });
    // 返回新创建的 Promise
    return promise;
  }

}

const windows = new Windows();

export {windows, WinType}
