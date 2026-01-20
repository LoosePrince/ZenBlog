import { GitHubConfig, FileChange } from '../types';

export class GitHubService {
  private config: Partial<GitHubConfig>;

  constructor(config: Partial<GitHubConfig>) {
    this.config = config;
  }

  private async request(path: string, options: RequestInit = {}) {
    const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/${path}`;
    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/vnd.github.v3+json');
    if (this.config.token) {
      headers.set('Authorization', `token ${this.config.token}`);
    }
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '未知错误' }));
      throw new Error(error.message || 'GitHub API 请求失败');
    }
    return response.json();
  }

  // 获取文件内容（读取 data 分支）
  async getFile(path: string): Promise<{ content: string; sha: string }> {
    const branch = this.config.branch || 'data';
    const data = await this.request(`contents/${path}?ref=${branch}`);
    const content = decodeURIComponent(escape(atob(data.content)));
    return { content, sha: data.sha };
  }

  // 获取文件的最后提交者信息
  async getFileAuthor(path: string): Promise<{ name: string; avatar: string; username: string } | null> {
    try {
      const branch = this.config.branch || 'data';
      const commits = await this.request(`commits?path=${path}&sha=${branch}&per_page=1`);
      
      if (commits && commits.length > 0) {
        const commit = commits[0];
        return {
          name: commit.commit.author.name,
          avatar: commit.author?.avatar_url || `https://t.alcy.cc/tx`,
          username: commit.author?.login || commit.commit.author.name,
        };
      }
      return null;
    } catch (err) {
      console.error('Failed to fetch file author:', err);
      return null;
    }
  }

  // 原子化：一次性提交多个文件变更
  async commitMultipleFiles(message: string, changes: FileChange[]): Promise<void> {
    if (!this.config.token) throw new Error('操作需要 GitHub Token');
    const branchName = this.config.branch || 'data';

    try {
      // 1. 获取最新 Commit 的 SHA
      const refData = await this.request(`git/ref/heads/${branchName}`);
      const latestCommitSha = refData.object.sha;

      // 2. 获取该 Commit 对应的 Tree SHA
      const commitData = await this.request(`git/commits/${latestCommitSha}`);
      const baseTreeSha = commitData.tree.sha;

      // 3. 为每个文件变更创建 Tree 节点
      const treeItems = changes.map(change => ({
        path: change.path,
        mode: '100644', // 普通文本文件
        type: 'blob',
        content: change.content
      }));

      // 4. 创建新的 Tree
      const newTreeData = await this.request(`git/trees`, {
        method: 'POST',
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeItems
        })
      });

      // 5. 创建新的 Commit
      const newCommitData = await this.request(`git/commits`, {
        method: 'POST',
        body: JSON.stringify({
          message,
          tree: newTreeData.sha,
          parents: [latestCommitSha]
        })
      });

      // 6. 更新分支引用
      await this.request(`git/refs/heads/${branchName}`, {
        method: 'PATCH',
        body: JSON.stringify({
          sha: newCommitData.sha,
          force: false
        })
      });
    } catch (err: any) {
      // 如果分支不存在，尝试创建孤儿分支（仅针对初始化）
      if (err.message.includes('Not Found') && branchName === 'data') {
        await this.createDataBranch();
        return this.commitMultipleFiles(message, changes); // 重试
      }
      throw err;
    }
  }

  private async createDataBranch(): Promise<void> {
    // 1. 创建一个包含占位文件的 Tree (创建孤儿分支)
    const treeData = await this.request(`git/trees`, {
      method: 'POST',
      body: JSON.stringify({
        tree: [{
          path: '.gitkeep',
          mode: '100644',
          type: 'blob',
          content: 'ZenBlog Data Branch'
        }]
      })
    });

    // 2. 创建一个没有任何父节点的根 Commit
    const commitData = await this.request(`git/commits`, {
      method: 'POST',
      body: JSON.stringify({
        message: 'Initialize data branch',
        tree: treeData.sha
      })
    });

    // 3. 创建分支引用
    await this.request(`git/refs`, {
      method: 'POST',
      body: JSON.stringify({
        ref: 'refs/heads/data',
        sha: commitData.sha
      })
    });
  }

  // 保持单文件删除（内部也使用 data 分支）
  async deleteFile(path: string, message: string, sha: string): Promise<void> {
    if (!this.config.token) throw new Error('操作需要 GitHub Token');
    const url = `contents/${path}`;
    await this.request(url, {
      method: 'DELETE',
      body: JSON.stringify({
        message,
        sha,
        branch: this.config.branch || 'data',
      }),
    });
  }
}