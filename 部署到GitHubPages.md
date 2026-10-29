# 部署到 GitHub Pages（开源 + 免费托管）

## 一、准备

1. 注册 GitHub 账号：https://github.com/join （免费）
2. 本文件夹就是"待上传的网站全部文件"

## 二、上传代码（网页操作，可不用装任何软件）

1. 登录 GitHub → 右上角 **+** → **New repository**
2. 仓库名任意（如 `cet-practice`）→ 选择 **Public**（开源）→ 点 **Create repository**
3. 进入仓库页面，点 **Add file → Upload files**
4. 把本文件夹里的**所有文件和文件夹**（index.html、css/、js/、README.md、LICENSE 等）拖进上传区
5. 点 **Commit changes**

## 三、开启 GitHub Pages（自动获得公网网址）

1. 仓库 → **Settings → Pages**
2. **Build and deployment → Source** 选 **Deploy from a branch**
3. Branch 选 **main**，目录选 **/(root)** → 点 **Save**
4. 等约 1 分钟，页面顶部会出现网址：**https://<你的用户名>.github.io/<仓库名>/**

## 四、AI 功能（可选，需免费代理）

GitHub Pages 是纯静态托管，`/api/chat` 不会生效（AI 自动降级为本地模式）。
想要 AI 对话：

1. 打开 https://workers.cloudflare.com → 注册（免费）→ 创建 Worker
2. 把本目录 `cloudflare-worker.js` 的内容粘贴进在线编辑器 → **Deploy**
3. 得到 `https://你的名字.workers.dev` 地址
4. 打开 `js/config.js`，把地址填进：
   ```js
   window.CET_API_BASE = 'https://你的名字.workers.dev';
   ```
5. 重新上传 `js/config.js`（仓库里点该文件 → 铅笔编辑 → 粘贴保存）

## 五、注意事项

- GitHub Pages 在国内访问**经常不稳定或打不开**，主要给国外/开放网络用；国内长期稳定使用请选国内云服务器 + 备案
- 每位用户仍需在网站「设置」里填自己的 DeepSeek API Key（Key 只存在其浏览器里）
- 开源礼仪：保留 README.md 和 LICENSE（MIT），欢迎别人 Fork / Star
