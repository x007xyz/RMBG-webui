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

3. （可选）配置 Hugging Face 镜像站点

如果国内无法访问 Hugging Face，可以创建 `.env` 文件配置镜像站点：

```bash
# 创建 .env 文件
echo "VITE_HF_MIRROR_URL=https://hf-mirror.com" > .env
```

或者直接在代码中修改 `src/utils/index.ts` 文件中的 `HF_MIRROR_URL` 变量。

**推荐的镜像站点：**
- `https://hf-mirror.com` - 国内镜像站点（推荐）
- `https://huggingface.co` - 原始站点（国内可能无法访问）

4. 启动开发服务器

```bash
pnpm dev
```

5. 构建生产版本

```bash
pnpm build
```

## 🌍 解决国内访问和 CORS 问题

### 🎯 推荐方案：使用阿里云 OSS（完全解决 CORS 和访问问题）

这是**最推荐的方案**，可以完全解决 CORS 问题和国内访问速度问题。

#### 🚀 一键部署（推荐）

使用一键脚本自动完成下载和上传：

```bash
# 安装依赖
pip install oss2 requests

# 方式一：使用环境变量（推荐）
export OSS_ACCESS_KEY_ID="your-access-key-id"
export OSS_ACCESS_KEY_SECRET="your-access-key-secret"
export OSS_BUCKET_NAME="your-bucket-name"
export OSS_ENDPOINT="oss-cn-hangzhou.aliyuncs.com"

# 运行一键脚本
python3 scripts/setup-model-oss.py
```

脚本会自动：
1. ✅ 从镜像站点下载模型文件（仅下载必要的文件）
2. ✅ 上传到阿里云 OSS
3. ✅ 创建 `.env` 配置文件

如果未设置环境变量，脚本会交互式提示输入 OSS 配置信息。

#### 📋 前置准备：配置 OSS Bucket

在运行脚本之前，需要先配置 OSS Bucket：

1. **创建 Bucket**
   - 登录 [阿里云 OSS 控制台](https://oss.console.aliyun.com/)
   - 创建新的 Bucket（如果还没有）

2. **配置 CORS（重要！）**
   - 进入 Bucket → **数据安全** → **跨域设置（CORS）**
   - 创建规则：
     - 来源: `*`
     - 允许方法: `GET, HEAD`
     - 允许头: `*`
     - 暴露头: `ETag, x-oss-request-id`
     - 缓存时间: `3600`


---

### 🔄 其他方案（备选）

#### 方案 2: 使用镜像站点 + 代理

**开发环境**：已自动配置 Vite 代理，无需额外配置。

**生产环境**：需要配置服务器代理（Nginx 示例）：

```nginx
location /hf-proxy/ {
    proxy_pass https://hf-mirror.com/;
    proxy_set_header Host hf-mirror.com;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

然后设置环境变量：
```env
VITE_CDN_TYPE=hf-mirror
```

#### 方案 3: 使用其他 CDN

可以通过环境变量配置：

```env
VITE_CDN_TYPE=jsdelivr  # 或其他支持的 CDN
```

## 📝 许可证

MIT License


## 🌐 托管声明

本项目由阿里云 ESA 提供加速、计算和保护。

![阿里云 ESA Pages](/public/esa-banner.png)

> 阿里云 ESA Pages - 构建、加速并保护你的网站