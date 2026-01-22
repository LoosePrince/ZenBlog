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

## Configuration

ZenBlog uses a configuration file (`config.json`) stored in the `main` branch (as a static file) to determine which repository to fetch data from. This allows visitors to automatically discover your blog configuration.

### Initial Setup

1. **Configure in Settings**: Go to the Settings page and fill in:
   - GitHub Personal Access Token (for write operations)
   - Repository Owner
   - Repository Name
   - Data Branch (default: `data`)

2. **Download config.json**: After saving, click the "下载 config.json" button to download the configuration file.

3. **Deploy config.json**: Place the downloaded `config.json` file in the `public/` directory of your project.

4. **Rebuild and Deploy**: Rebuild your project and deploy. The `config.json` will be included as a static file in the `main` branch, and visitors can automatically access your blog data from `/config.json`.

**Note**: The `config.json` file only contains public information (owner, repo, branch). The GitHub token is stored only in localStorage and never committed to the repository.

## License

MIT