// 导入所需的模块
import fetch from 'node-fetch'; // 用于发起网络请求
import { getOctokit, context } from '@actions/github'; // 用于与 GitHub API 交互
import fs from 'fs'; // 用于文件系统操作

import updatelog from './updatelog.mjs'; // 导入更新日志模块

const token = process.env.GITHUB_TOKEN; // 从环境变量中获取 GitHub Token

// updater 函数用于更新版本信息
async function updater() {
    // 如果没有 GitHub Token，则打印错误信息并退出
    if (!token) {
        console.log('GITHUB_TOKEN is required');
        process.exit(1);
    }

    // 设置仓库的所有者和名称
    const options = { owner: context.repo.owner, repo: context.repo.repo };
    const github = getOctokit(token); // 使用 GitHub Token 创建 Octokit 实例

    // 获取仓库的标签
    const { data: tags } = await github.rest.repos.listTags({
        ...options,
        per_page: 10,
        page: 1,
    });

    // 找到以 'v' 开头的标签，这通常表示版本号
    const tag = tags.find((t) => t.name.startsWith('v'));

    // 如果没有找到标签，则直接返回
    if (!tag) return;

    // 获取该标签对应的发布信息
    const { data: latestRelease } = await github.rest.repos.getReleaseByTag({
        ...options,
        tag: tag.name,
    });

    // 准备要写入 JSON 文件的数据
    const updateData = {
        version: tag.name, // 版本号
        notes: updatelog(tag.name), // 更新日志
        pub_date: new Date().toISOString(), // 发布日期
        platforms: { // 各平台的信息
            win64: { signature: '', url: '' },
            linux: { signature: '', url: '' },
            darwin: { signature: '', url: '' },
            'darwin-aarch64': { signature: '', url: '' },
            'darwin-x86_64': { signature: '', url: '' },
            'linux-x86_64': { signature: '', url: '' },
            'windows-x86_64': { signature: '', url: '' },
        },
    };

    // setAsset 函数用于设置各平台的资产信息
    const setAsset = async (asset, reg, platforms) => {
        let sig = '';
        // 如果资产名称以 .sig 结尾，表示这是一个签名文件，需要获取签名内容
        if (/.sig$/.test(asset.name)) {
            sig = await getSignature(asset.browser_download_url);
        }
        platforms.forEach((platform) => {
            // 如果资产名称匹配平台，则设置相应的信息
            if (reg.test(asset.name)) {
                // 如果有签名，设置签名
                if (sig) {
                    updateData.platforms[platform].signature = sig;
                    return;
                }
                // 设置下载链接
                updateData.platforms[platform].url = asset.browser_download_url;
            }
        });
    };

    // 对每个资产进行处理
    const promises = latestRelease.assets.map(async (asset) => {
        // windows
        await setAsset(asset, /.msi.zip/, ['win64', 'windows-x86_64']);

        // darwin
        await setAsset(asset, /.app.tar.gz/, [
            'darwin',
            'darwin-x86_64',
            'darwin-aarch64',
        ]);

        // linux
        await setAsset(asset, /.AppImage.tar.gz/, ['linux', 'linux-x86_64']);
    });
    await Promise.allSettled(promises); // 等待所有 Promise 完成

    // 如果 updater 目录不存在，则创建该目录
    if (!fs.existsSync('updater')) {
        fs.mkdirSync('updater');
    }

    // 将数据写入文件
    fs.writeFileSync(
        './updater/install.json',
        JSON.stringify(updateData, null, 2)
    );
    console.log('Generate updater/install.json'); // 打印生成文件的信息
}

// 调用 updater 函数，并处理可能的错误
updater().catch(console.error);

// getSignature 函数用于获取签名内容
async function getSignature(url) {
    try {
        // 发起 GET 请求获取签名内容
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/octet-stream' },
        });
        return response.text(); // 返回签名内容
    } catch (_) {
        return ''; // 如果发生错误，则返回空字符串
    }
}
