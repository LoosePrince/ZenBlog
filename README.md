# ZenBlog - Modern Git-Powered Blog

A sleek, modern personal blog system driven by the GitHub API. ZenBlog uses a "Storage-Compute Separation" architecture, where your code lives on the `main` branch and your content is stored in a clean, isolated `data` branch.

## Key Features

- **Isolated Storage**: Data is committed to a dedicated `data` branch, keeping your `main` branch clean.
- **Atomic Commits**: Content and index updates are merged into a single Git commit for integrity.
- **Markdown First**: High-quality post rendering with support for GFM.
- **Modern UI**: Built with React, Tailwind CSS, Framer Motion, and Lucide Icons.
- **Zero Backend**: Fully serverless, powered entirely by the GitHub Git API.
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
   Simply push your code to GitHub and enable GitHub Pages on the `main` branch (using the provided GitHub Action).

## Configuration

ZenBlog uses a configuration file (`config.json`) stored in the `main` branch (as a static file) to determine which repository to fetch data from. This allows visitors to automatically discover your blog configuration.

### Initial Setup

1. **Create config.json**: Create a `config.json` file in the `public/` directory with the following structure:
   ```json
   {
     "owner": "your-github-username",
     "repo": "your-repo-name",
     "branch": "data"
   }
   ```

2. **Deploy config.json**: The `config.json` file will be included as a static file when you build and deploy your project. Visitors can automatically access your blog data from `/config.json`.

3. **Configure Token**: Go to the **Settings** page in the app and provide your GitHub Personal Access Token (PAT) for write operations. The token is stored only in localStorage and never committed to the repository.

**Note**: 
- The `config.json` file only contains public information (owner, repo, branch).
- Repository Owner, Repository Name, and Data Branch fields in Settings are read-only and display the values from `config.json`.
- The GitHub token is stored only in localStorage and never committed to the repository.

### Settings Overview

The Settings page includes three main sections:

1. **GitHub Storage Configuration**:
   - Personal Access Token (editable, stored locally)
   - Repository Owner (read-only, from config.json)
   - Repository Name (read-only, from config.json)
   - Data Branch (read-only, from config.json)

2. **Author Profile**:
   - Display Name
   - Bio
   - Avatar URL
   - GitHub URL

3. **Site Settings**:
   - Site Name (used in page title and navbar)
   - Site Icon (used as favicon)
   - Site Description (used for SEO meta description)

All profile and site settings are saved to `data/profile.json` in the data branch.

## License

MIT