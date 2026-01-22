# ZenBlog - Modern Git-Powered Blog

A sleek, modern personal blog system driven by the GitHub API. ZenBlog uses a "Storage-Compute Separation" architecture, where your code lives on the `main` branch and your content is stored in a clean, isolated `data` branch.

## Key Features

- **Isolated Storage**: Data is committed to a dedicated `data` branch, keeping your `main` branch clean.
- **Atomic Commits**: Content and index updates are merged into a single Git commit for integrity.
- **Markdown First**: High-quality post rendering with support for GFM.
- **Modern UI**: Built with React, Tailwind CSS, Framer Motion, and Lucide Icons.
- **Zero Backend**: Fully serverless, powered entirely by the GitHub Git API.

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
   Go to the **Settings** page in the app, provide your GitHub Personal Access Token (PAT), and configure your repository details.

4. **Deploy**:
   Simply push your code to GitHub and enable GitHub Pages on the `main` branch (using the provided GitHub Action).

## Custom Domain Support

If you're using a custom domain (not `github.io`), you need to configure the repository information so visitors can access your blog data. You have two options:

### Option 1: Meta Tag (Recommended)
Edit `index.html` and uncomment the meta tag, then fill in your repository information:

```html
<meta name="zenblog-config" content='{"owner":"your-username","repo":"your-repo","branch":"data"}' />
```

This allows visitors to automatically discover your repository configuration when they first visit your site.

### Option 2: URL Parameters
You can also pass configuration via URL parameters:
```
https://your-domain.com/?owner=your-username&repo=your-repo&branch=data
```

**Note**: The configuration priority is:
1. localStorage (if previously configured)
2. Meta tag in HTML
3. URL parameters
4. Auto-detection from `github.io` domain

## License

MIT