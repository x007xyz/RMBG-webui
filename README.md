# RMBG WebUI

一个基于浏览器的 AI 抠图工具，完全在本地运行，保护您的隐私。

## ✨ 特性

- 🔒 **本地处理**：使用 [Transformers.js](https://huggingface.co/docs/transformers.js) 在浏览器中直接运行 [RMBG-1.4](https://huggingface.co/briaai/RMBG-1.4) 模型，无需上传图片到服务器。
- 🚀 **高性能**：自动检测并利用 WebGPU 加速推理（如果浏览器支持），否则回退到 WASM。
- ⚡ **实时预览**：提供原图与处理后图片的实时对比滑块。
- 🎨 **现代界面**：基于 React + Tailwind CSS + Radix UI 构建的响应式界面。
- 📥 **一键下载**：支持高清下载处理后的透明背景图片。

## 🛠️ 技术栈

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Transformers.js](https://huggingface.co/docs/transformers.js)

## 🚀 快速开始

1. 克隆项目

```bash
git clone https://github.com/your-username/rmbg-webui.git
cd rmbg-webui
```

2. 安装依赖

```bash
pnpm install
```

3. 启动开发服务器

```bash
pnpm dev
```

4. 构建生产版本

```bash
pnpm build
```

## 📝 许可证

MIT License


## 🌐 托管声明

本项目由阿里云 ESA 提供加速、计算和保护。

![阿里云 ESA Pages](/public/esa-banner.png)

> 阿里云 ESA Pages - 构建、加速并保护你的网站