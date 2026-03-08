# Deployment Guide

## 方案 A：Node 服务器部署（推荐）

适合你的一人公司全自动运营，部署最直接。

### 1. 上传代码
把项目上传到服务器目录，例如 `/opt/destiny-career`。

### 2. 安装依赖
```bash
cd /opt/destiny-career
npm install
```

### 3. 配置环境变量
```bash
cp .env.example .env
```

至少要填：
- `ACCESS_CODE`
- `AI_API_KEY`
- `AI_BASE_URL`
- `AI_MODEL`

### 4. 构建并启动
```bash
npm run build
npm run start
```

### 5. 用 PM2 守护进程（可选）
```bash
npm i -g pm2
pm2 start "npm run start" --name destiny-career
pm2 save
```

## 方案 B：Vercel 部署

适合快速上线。

### 1. 导入仓库
在 Vercel 新建项目并导入本仓库。

### 2. 配置环境变量
在 Vercel Project Settings -> Environment Variables 中添加：
- `ACCESS_CODE`
- `AI_API_KEY`
- `AI_BASE_URL`
- `AI_MODEL`

### 3. Build 与 Start
Vercel 会执行：
- Build: `npm run build`
- Runtime: 由 `server.ts` 提供 API 与静态文件

## 上线后自检

1. 健康检查：`/api/health` 返回 `{ ok: true }`
2. 测试解锁码错误提示是否生效
3. 测试结果页 PDF 导出
4. 测试移动端三步流程是否流畅
