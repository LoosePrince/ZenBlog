import { UniID } from '@uniid/sdk';
import type { UniIDUser } from '@uniid/sdk';
import { CommentStatus, UniIdConfig, UniIdUser, ZenCommentRecord } from '../types';

const BINDING_DATA_TYPE = 'zenblog_account_binding';
const COMMENT_DATA_TYPE = 'zenblog_comment';

function toUniIdUser(user: UniIDUser): UniIdUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
  };
}

export class UniIdService {
  private config: UniIdConfig;
  private client: UniID | null = null;

  constructor(config: UniIdConfig) {
    this.config = config;
  }

  private getClient(): UniID {
    if (!this.client) {
      this.client = new UniID({
        url: this.config.url,
        appId: this.config.appId,
        theme: 'auto',
        autoRefresh: true,
        storageKey: `zenblog:uniid:${this.config.appId}`,
      });
    }
    return this.client;
  }

  async init(): Promise<void> {
    this.getClient();
  }

  async login(): Promise<{ token: string | null; user: UniIdUser | null; cancelled: boolean }> {
    const client = this.getClient();
    try {
      const user = await client.auth.login();
      const session = client.auth.getSession();
      return {
        token: session?.accessToken ?? null,
        user: toUniIdUser(user),
        cancelled: false,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('cancel') || message.includes('取消')) {
        return { token: null, user: null, cancelled: true };
      }
      throw err;
    }
  }

  async logout(): Promise<void> {
    await this.getClient().auth.logout();
  }

  async checkToken(token: string): Promise<{ valid: boolean; user?: UniIdUser }> {
    const client = this.getClient();
    const session = client.auth.getSession();
    if (!session?.accessToken || session.accessToken !== token) {
      return { valid: false };
    }
    try {
      const user = await client.auth.check();
      if (!user) return { valid: false };
      return { valid: true, user: toUniIdUser(user) };
    } catch {
      return { valid: false };
    }
  }

  async restoreSession(): Promise<{ valid: boolean; token: string | null; user: UniIdUser | null }> {
    const client = this.getClient();
    const session = client.auth.getSession();
    if (!session?.accessToken) {
      return { valid: false, token: null, user: null };
    }
    try {
      const user = await client.auth.check();
      if (!user) {
        return { valid: false, token: null, user: null };
      }
      return {
        valid: true,
        token: session.accessToken,
        user: toUniIdUser(user),
      };
    } catch {
      return { valid: false, token: null, user: null };
    }
  }

  async upsertGitHubBinding(userId: string, githubKey: string): Promise<void> {
    await this.init();
    const client = this.getClient();
    const payload = { userId, githubKey, updatedAt: Date.now() };
    const existing = await client
      .from<{ userId: string; githubKey: string; updatedAt: number }>(BINDING_DATA_TYPE)
      .where({ userId })
      .select(['id', 'data.githubKey'])
      .limit(1)
      .first();

    if (existing?.id) {
      await client.from(BINDING_DATA_TYPE).update(existing.id, payload);
    } else {
      await client.from(BINDING_DATA_TYPE).insert(payload);
    }
  }

  async getGitHubBinding(userId: string): Promise<string | null> {
    await this.init();
    const client = this.getClient();
    const existing = await client
      .from<{ userId: string; githubKey: string }>(BINDING_DATA_TYPE)
      .where({ userId })
      .select(['id', 'data.githubKey'])
      .limit(1)
      .first();
    return existing?.data?.githubKey ?? null;
  }

  async ensureCommentSchema(): Promise<void> {
    // Schema 需在 UniID 控制台创建，客户端无管理权限。
  }

  async listComments(postId: string, opts?: { includePending?: boolean }): Promise<ZenCommentRecord[]> {
    await this.init();
    const client = this.getClient();
    const includePending = Boolean(opts?.includePending);
    // UniID DataService.matchesWhere 对记录 data 做扁平匹配，键为 postId 而非 data.postId
    const filter = includePending
      ? { postId }
      : { postId, status: 'approved' };
    const result = await client
      .from(COMMENT_DATA_TYPE)
      .where(filter)
      .orderBy({ createdAt: 'asc' })
      .limit(200)
      .run();
    return result.records
      .filter((item) => item?.data && (item.data as { postId?: string }).postId === postId)
      .map((item) => ({ id: item.id, data: item.data as ZenCommentRecord['data'] }));
  }

  async createComment(payload: {
    postId: string;
    content: string;
    userId: string;
    username: string;
    parentCommentId: string | null;
    rootCommentId: string | null;
    depth: 0 | 1;
  }): Promise<void> {
    await this.init();
    const now = Date.now();
    await this.getClient().from(COMMENT_DATA_TYPE).insert({
      postId: payload.postId,
      content: payload.content,
      status: 'pending',
      author: {
        userId: payload.userId,
        username: payload.username || 'user',
      },
      parentCommentId: payload.parentCommentId,
      rootCommentId: payload.rootCommentId,
      depth: payload.depth,
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateCommentStatus(commentId: string, status: CommentStatus): Promise<void> {
    await this.init();
    await this.getClient().from(COMMENT_DATA_TYPE).update(commentId, {
      status,
      updatedAt: Date.now(),
    });
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.init();
    await this.getClient().from(COMMENT_DATA_TYPE).delete(commentId);
  }

  async listPendingComments(limit = 100): Promise<ZenCommentRecord[]> {
    await this.init();
    const result = await this.getClient()
      .from(COMMENT_DATA_TYPE)
      .where({ status: 'pending' })
      .orderBy({ createdAt: 'desc' })
      .limit(limit)
      .run();
    return result.records.map((item) => ({
      id: item.id,
      data: item.data as ZenCommentRecord['data'],
    }));
  }
}
