// 引入所需的模块
const os = require('os')
const path = require('path')
const {expect} = require('chai')
const {spawn, spawnSync} = require('child_process')
const {Builder, By, Capabilities} = require('selenium-webdriver')
const {Options} = require("selenium-webdriver/ie");

// 创建预期应用程序二进制文件的路径
const application = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'target',
    'release',
    'hello-tauri-webdriver'
)

// 跟踪我们创建的webdriver实例
let driver

// 跟踪我们启动的tauri-driver进程
let tauriDriver

before(async function () {
    // 设置超时为2分钟，以便在需要时构建程序
    // this.timeout(120000)

    // // 确保程序已经被构建
    // spawnSync('cargo', ['build', '--release'])
    //
    // // 启动tauri-driver
    // tauriDriver = spawn(
    //     path.resolve(os.homedir(), '.cargo', 'bin', 'tauri-driver'),
    //     [],
    //     {stdio: [null, process.stdout, process.stderr]}
    // )
    //
    // const capabilities = new Capabilities()
    // capabilities.set('tauri:options', {application})
    // capabilities.setBrowserName('wry')

    // 启动webdriver客户端
    // driver = await new Builder()
    //     .withCapabilities(capabilities)
    //     .usingServer('http://localhost:1420')
    //     .build()
    driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(new Options().addArguments(['--remote-debugging-port=9222']))
        .build();
    try {
        // 打开你的 Tauri 应用程序
        await driver.get('http://localhost:1420'); // 假设你的 Tauri 应用程序在 localhost:4000 上运行

        // 执行你的 Selenium 脚本
        // 例如，查找一个元素并进行点击操作
        await driver.findElement(By.id('openBaidu')).click();
    } finally {
        // 关闭 driver
        await driver.quit();
    }
})

after(async function () {
    // 停止webdriver会话
    await driver.quit()

    // 杀掉tauri-driver进程
    // tauriDriver.kill()
})

describe('Hello Tauri', () => {
    it('should be cordial', async () => {
        // 获取页面元素的文本，并检查是否以 "hello" 开头
        const text = await driver.findElement(By.css('body > h1')).getText()
        expect(text).to.match(/^[hH]ello/)
    })

    it('should be excited', async () => {
        // 获取页面元素的文本，并检查是否以 "!" 结尾
        const text = await driver.findElement(By.css('body > h1')).getText()
        expect(text).to.match(/!$/)
    })

    it('should be easy on the eyes', async () => {
        // 获取页面背景颜色，并计算其亮度
        const text = await driver
            .findElement(By.css('body'))
            .getCssValue('background-color')

        const rgb = text.match(/^rgb\((?<r>\d+), (?<g>\d+), (?<b>\d+)\)$/).groups
        expect(rgb).to.have.all.keys('r', 'g', 'b')

        const luma = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b
        expect(luma).to.be.lessThan(100)
    })
})
