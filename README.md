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

## License

MIT