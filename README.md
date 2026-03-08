# 天命职场 (Destiny Career)

前后端同构全栈应用：React + Vite + Tailwind v4 + Express + DeepSeek API。

## 本地开发

1. 准备环境变量：
```bash
cp .env.example .env
```

2. 如果你系统已经有 Node 18+，直接运行：
```bash
npm install
npm run dev
```

3. 如果你系统还没有 Node（本项目已内置本地 Node 到 `.tools/node`），运行：
```bash
export PATH="$(pwd)/.tools/node/bin:$PATH"
npm install
npm run dev
```

## 生产构建

```bash
npm run build
npm run start
```

默认端口 `3000`，可用 `PORT` 环境变量覆盖。

## 目录结构

- `server.ts`：后端入口（开发时集成 Vite middleware，生产时托管静态文件）
- `src/frontend`：前端页面与组件
- `src/backend/api/analyze.ts`：AI 报告接口与 Prompt 逻辑
- `src/utils/baziCalculator.ts`：八字排盘与五行统计
- `src/utils/pdfExporter.ts`：报告 PDF 导出

## 部署

详见 [DEPLOYMENT.md](./DEPLOYMENT.md)
