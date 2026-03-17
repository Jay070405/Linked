# Shijie Lin Portfolio

当前项目只保留一套前端：`Next.js + TypeScript + Tailwind CSS`。

## 开发

```bash
npm install
npm run dev
```

默认打开 `http://localhost:3000`。

## 构建

```bash
npm run build
npm run start
```

## 现在主要看这些文件

- `src/app/page.tsx`：首页结构
- `src/components/home/HeroScene.tsx`：3D 首页 Hero
- `src/components/home/SelectedWorks.tsx`：作品展示区
- `src/app/globals.css`：全局样式
- `public/image/`：作品图片和视频
- `public/resume/`：简历文件

## 说明

- 旧的静态 HTML 版本已经移除，不再作为项目入口。
- 现在首页入口是 `src/app/page.tsx`，不是根目录的 `index.html`。
