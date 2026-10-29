# 四六级 口语·听力 练习网站（开源版）

一个纯前端 + 轻后端的英语四六级（CET-4 / CET-6）口语与听力练习网站。

## 功能

- 🎙 **AI 考官语音模拟面试**：按官方 CET-SET4（5 部分）/ CET-SET6（3 部分）流程，AI 考官会实时对话、追问、互动讨论
- 🏆 **即时评分**：内容切题、流畅度、词汇、语法、语音语调、互动交际六维评分 + 等级 + 改进建议
- 🧩 **模拟题练习**：AI 现场出题
- 🎧 **听力专项**：真题风格套题，系统语音朗读，自动批改带解析
- 📅 **考试倒计时**：口试与笔试（含听力）分开倒计时，日期来自教育部教育考试院官网
- 📈 **历史成绩**：本地保存每次模拟成绩
- 🍎 **苹果风界面**：iOS 风格毛玻璃 / 深浅色 / 响应式，兼容电脑和手机

## 本地运行（需要 Node.js）

```bash
node 01_website/server.js    # 或者把本目录当作网站，用 node server.js
```

浏览器打开 http://127.0.0.1:8123/

> 页面上的「设置 → 每人填自己的 DeepSeek API Key」是唯一的 AI 依赖，Key 保存在各用户浏览器本地，不会上传到任何服务器。

## 部署到 GitHub Pages（免费开源托管）

1. 注册 / 登录 GitHub，点 **New repository** 新建仓库（选 **Public** 公开，即开源）
2. 进入仓库 → **Add file → Upload files**，把本目录的所有文件和文件夹（index.html、css/、js/、README.md、LICENSE 等）拖拽上传 → **Commit changes**
3. 仓库 **Settings → Pages → Build and deployment**：Source 选 **Deploy from a branch**，Branch 选 **main**，目录选 **/(root)** → **Save**
4. 等约 1 分钟，访问 `https://<你的用户名>.github.io/<仓库名>/`

## AI 功能说明（重要）

GitHub Pages 是**静态托管**，没有后端程序，所以页面上的 `/api/chat` AI 接口不会生效：
- 不配置代理时：网站其余功能（登录、倒计时、听力、本地评分）正常，AI 对话自动进入「本地模式」
- 想要完整 AI：用免费的 **Cloudflare Worker**（见本目录 `cloudflare-worker.js`）建一个代理，把地址填进 `js/config.js` 的 `window.CET_API_BASE`，重新上传即可

## 中国网络访问提醒

`*.github.io` 在国内经常访问不稳定甚至打不开。若主要在国内使用，建议改用国内云服务器 + ICP 备案（代码通用，无需改动）。

## 开源协议

MIT License，见 LICENSE 文件。
