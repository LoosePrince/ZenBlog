# ZenBlog - Modern Git-Powered Blog

A sleek, modern personal blog system driven by the GitHub API. ZenBlog uses a "Storage-Compute Separation" architecture, where your code lives on the `main` branch and your content is stored in a clean, isolated `data` branch.

## Key Features

- **Isolated Storage**: Data is committed to a dedicated `data` branch, keeping your `main` branch clean.
- **Atomic Commits**: Content and index updates are merged into a single Git commit for integrity.
- **Markdown First**: High-quality post rendering with support for GFM.
- **Modern UI**: Built with React, Tailwind CSS, Framer Motion, and Lucide Icons.
- **Zero Backend**: Fully serverless, powered entirely by the GitHub Git API.
- **Static Site Generation**: Pages are prerendered at build time, so search engines and social crawlers see real HTML.
- **Editable About Page**: Fully customizable about page with interests, skills, works, music, contacts, and games.
- **Site Settings**: Configure site name, icon, and description.
- **Internationalization**: Support for Chinese and English.
- **Theme Support**: Light, dark, and auto theme modes.

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Locally**:
   ```bash
   npm run dev
   ```

3. **Configure**:
   - Create a `config.json` file in the `public/` directory (see Configuration section below)
   - Go to the **Settings** page in the app and provide your GitHub Personal Access Token (PAT)

4. **Deploy**:
   Push your code to GitHub and enable GitHub Pages on the `main` branch (using the provided GitHub Action).

## Static Site Generation (SSG)

ZenBlog is prerendered at build time. The build pipeline has three stages:

```
npm run snapshot    # 1. 抓取 data 分支内容，生成构建期快照
vite build          # 2. 客户端产物 + index.html 模板
vite build --ssr    # 3. 生成可在 Node 中调用的 render()
node ssg.mjs        # 4. 逐路由渲染并注入 HTML
```

`npm run build` 会一次性跑完以上全部步骤。

### 预渲染哪些路由

在 `entry-ssg.tsx` 的 `PRERENDER_PATHS` 中声明：

```ts
export const PRERENDER_PATHS = ['/', '/about', '/login'];
```

每个路由会生成独立的 `<route>/index.html`，直接访问不需要经过客户端路由。

### SEO 元数据

`render()` 返回的 `metadata` 会注入到对应页面的 `<title>`、`<meta name="description">` 和 `<html lang>`，让爬虫抓到正确信息。

### 数据快照

SSG 需要构建时就拿到文章列表，所以 `scripts/fetch-snapshot.mjs` 会读取
`public/config.json` 里的 owner/repo/branch，从 GitHub API 拉取
`data/posts.json` 和 `data/profile.json`，写入 `src/generated/snapshot.json`。

快照文件不入库（已加入 `.gitignore`），每次构建重新生成。

需要读取私有仓库时，通过环境变量传 token：

```bash
GITHUB_TOKEN=ghp_xxx npm run snapshot
```

GitHub Actions 中已自动使用 `secrets.GITHUB_TOKEN`。

### 路由模式

项目使用 `BrowserRouter`（真实路径），因此需要服务器支持深链接回退：

- **GitHub Pages**：构建时自动生成 `404.html` 作为回退
- 其他静态托管：配置 `try_files ... /index.html`

### 水合

`index.tsx` 会检测 `#root` 是否已有内容：有则用 `hydrateRoot` 接管，
开发模式下（无预渲染）回退到 `createRoot`。

## Configuration

ZenBlog uses a configuration file (`config.json`) stored in the `main` branch (as a static file) to determine which repository to fetch data from. This allows visitors to automatically discover your blog configuration.

### Initial Setup

Create `public/config.json`:

```json
{
  "owner": "your-github-username",
  "repo": "your-repo-name",
  "branch": "data"
}
```

## License

MIT
