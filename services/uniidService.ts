import { CommentStatus, UniIdConfig, UniIdUser, ZenCommentRecord } from '../types';

declare global {
  interface Window {
    AuthSDK?: new (config: {
      authServer: string;
      appId: string;
      mountId: string;
      useDefaultStyle?: boolean;
    }) => {
      login: () => Promise<{ token?: string; user?: UniIdUser; cancelled?: boolean }>;
      logout?: () => Promise<void>;
      revoke?: () => Promise<void>;
      query?: (params: any) => Promise<any>;
      create?: (type: string, data: any, permissions?: any) => Promise<any>;
      update?: (recordId: string, data: any, permissions?: any) => Promise<any>;
      _fetch?: (method: string, path: string, body?: any, requireAuth?: boolean) => Promise<any>;
    };
  }
}

const UNI_ID_SDK_PATH = 'sdk/uniid.sdk.js';
const getUniIdSdkUrl = (authServer: string): string => {
  const normalized = authServer.trim().replace(/\/+$/, '');
  if (!normalized) {
    throw new Error('UniID authServer 未配置');
  }
  return `${normalized}/${UNI_ID_SDK_PATH}`;
};
const BINDING_DATA_TYPE = 'zenblog_account_binding';
const COMMENT_DATA_TYPE = 'zenblog_comment';

export class UniIdService {
  private config: UniIdConfig;
  private sdk: InstanceType<NonNullable<typeof window.AuthSDK>> | null = null;
  private sdkReady: Promise<void> | null = null;
  private commentSchemaEnsurePromise: Promise<void> | null = null;

  constructor(config: UniIdConfig) {
    this.config = config;
  }

  private ensureMountNode(): void {
    if (document.getElementById('uniid-auth-mount')) return;
    const mount = document.createElement('div');
    mount.id = 'uniid-auth-mount';
    mount.style.display = 'none';
    document.body.appendChild(mount);
  }

  private ensureScriptLoaded(): Promise<void> {
    if ((window as any).AuthSDK) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      let sdkUrl: string;
      try {
        sdkUrl = getUniIdSdkUrl(this.config.authServer);
      } catch (err) {
        reject(err instanceof Error ? err : new Error('UniID SDK 地址无效'));
        return;
      }
      const existing = document.querySelector<HTMLScriptElement>(`script[data-uniid-sdk="1"]`);
      if (existing) {
        if (existing.src !== sdkUrl) {
          existing.remove();
        } else {
          existing.addEventListener('load', () => resolve(), { once: true });
          existing.addEventListener('error', () => reject(new Error('UniID SDK 加载失败')), { once: true });
          return;
        }
      }
      const script = document.createElement('script');
      script.src = sdkUrl;
      script.async = true;
      script.dataset.uniidSdk = '1';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('UniID SDK 加载失败'));
      document.head.appendChild(script);
    });
  }

  async init(): Promise<void> {
    if (!this.sdkReady) {
      this.sdkReady = (async () => {
        this.ensureMountNode();
        await this.ensureScriptLoaded();
        if (!window.AuthSDK) {
          throw new Error('UniID SDK 未注入');
        }
        this.sdk = new window.AuthSDK({
          authServer: this.config.authServer,
          appId: this.config.appId,
          mountId: 'uniid-auth-mount',
          useDefaultStyle: true,
        }) as InstanceType<NonNullable<typeof window.AuthSDK>>;
      })();
    }
    return this.sdkReady;
  }

  async login(): Promise<{ token: string | null; user: UniIdUser | null; cancelled: boolean }> {
    await this.init();
    if (!this.sdk) throw new Error('UniID SDK 未初始化');
    const result = await this.sdk.login();
    if (!result || result.cancelled) {
      return { token: null, user: null, cancelled: true };
    }
    return {
      token: result.token ?? null,
      user: result.user ?? null,
      cancelled: false,
    };
  }

  async logout(): Promise<void> {
    await this.init();
    if (!this.sdk) return;
    if (this.sdk.logout) {
      await this.sdk.logout();
      return;
    }
    if (this.sdk.revoke) {
      await this.sdk.revoke();
    }
  }

  async checkToken(token: string): Promise<{ valid: boolean; user?: UniIdUser }> {
    if (!token) return { valid: false };
    try {
      const res = await fetch(
        `${this.config.authServer.replace(/\/+$/, '')}/api/auth/check?app_id=${encodeURIComponent(this.config.appId)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        }
      );
      if (!res.ok) return { valid: false };
      const data = await res.json();
      return { valid: Boolean(data?.valid), user: data?.user };
    } catch {
      return { valid: false };
    }
  }

  async upsertGitHubBinding(userId: string, githubKey: string): Promise<void> {
    await this.init();
    if (!this.sdk?.query || !this.sdk?.create || !this.sdk?.update) {
      throw new Error('UniID SDK 数据接口不可用');
    }
    const payload = { userId, githubKey, updatedAt: Date.now() };
    const permissions = {
      default: {
        read: ['$owner', '$app_admin'],
        create: ['$owner', '$app_admin'],
        update: ['$owner', '$app_admin'],
        delete: ['$owner', '$app_admin'],
      },
      fields: {
        'data.githubKey': {
          read: ['$owner', '$app_admin'],
          update: ['$owner', '$app_admin'],
        },
      },
    };

    const queryResult = await this.sdk.query({
      app_id: this.config.appId,
      data_type: BINDING_DATA_TYPE,
      filter: { 'data.userId': userId },
      limit: 1,
      offset: 0,
    });

    const existing = queryResult?.items?.[0];
    if (existing?.id) {
      await this.sdk.update(existing.id, payload, permissions);
    } else {
      await this.sdk.create(BINDING_DATA_TYPE, payload, permissions);
    }
  }

  async getGitHubBinding(userId: string): Promise<string | null> {
    await this.init();
    if (!this.sdk?.query) return null;
    const result = await this.sdk.query({
      app_id: this.config.appId,
      data_type: BINDING_DATA_TYPE,
      filter: { 'data.userId': userId },
      fields: ['id', 'data.githubKey'],
      limit: 1,
      offset: 0,
    });
    return result?.items?.[0]?.data?.githubKey ?? null;
  }

  async ensureCommentSchema(): Promise<void> {
    if (!this.commentSchemaEnsurePromise) {
      this.commentSchemaEnsurePromise = this.ensureCommentSchemaInternal().finally(() => {
        this.commentSchemaEnsurePromise = null;
      });
    }
    return this.commentSchemaEnsurePromise;
  }

  private normalizeSchema(input: unknown): string {
    const sortDeep = (value: any): any => {
      if (Array.isArray(value)) {
        return value.map(sortDeep);
      }
      if (value && typeof value === 'object') {
        const sortedKeys = Object.keys(value).sort();
        const out: Record<string, any> = {};
        for (const key of sortedKeys) {
          out[key] = sortDeep(value[key]);
        }
        return out;
      }
      return value;
    };
    return JSON.stringify(sortDeep(input));
  }

  private async ensureCommentSchemaInternal(): Promise<void> {
    await this.init();
    if (!this.sdk?._fetch) return;
    const targetSchema = {
      type: 'object',
      additionalProperties: false,
      required: ['postId', 'content', 'status', 'author', 'parentCommentId', 'rootCommentId', 'depth', 'createdAt', 'updatedAt'],
      properties: {
        postId: { type: 'string', minLength: 1, maxLength: 120 },
        content: { type: 'string', minLength: 1, maxLength: 1000 },
        status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
        author: {
          type: 'object',
          additionalProperties: false,
          required: ['userId', 'username'],
          properties: {
            userId: { type: 'string', minLength: 1, maxLength: 128 },
            username: { type: 'string', minLength: 1, maxLength: 120 },
          },
        },
        parentCommentId: { anyOf: [{ type: 'string', minLength: 1, maxLength: 128 }, { type: 'null' }] },
        rootCommentId: { anyOf: [{ type: 'string', minLength: 1, maxLength: 128 }, { type: 'null' }] },
        depth: { type: 'integer', enum: [0, 1] },
        createdAt: { type: 'integer', minimum: 0 },
        updatedAt: { type: 'integer', minimum: 0 },
      },
    };

    try {
      const current = await this.sdk._fetch(
        'GET',
        `/api/schema/${encodeURIComponent(this.config.appId)}/${encodeURIComponent(COMMENT_DATA_TYPE)}`
      );
      const currentSchema = current?.schema;
      const isSame = this.normalizeSchema(currentSchema) === this.normalizeSchema(targetSchema);
      if (isSame) return;
    } catch {
      // Schema 不存在或无读取权限时，继续尝试创建/更新版本
    }

    try {
      await this.sdk._fetch(
        'POST',
        `/api/schema/${encodeURIComponent(this.config.appId)}/${encodeURIComponent(COMMENT_DATA_TYPE)}`,
        {
          schema: targetSchema,
          description: 'ZenBlog comments schema',
          isActive: true,
        }
      );
    } catch {
      // 无权限或其他错误时，保持静默避免影响页面主流程
    }
  }

  async listComments(postId: string, opts?: { includePending?: boolean }): Promise<ZenCommentRecord[]> {
    await this.init();
    if (!this.sdk?.query) return [];
    const includePending = Boolean(opts?.includePending);
    const filter = includePending
      ? { 'data.postId': postId }
      : { 'data.postId': postId, 'data.status': 'approved' };
    const res = await this.sdk.query({
      app_id: this.config.appId,
      data_type: COMMENT_DATA_TYPE,
      filter,
      sort: { 'data.createdAt': 'asc' },
      limit: 200,
      offset: 0,
    });
    const items = Array.isArray(res?.items) ? res.items : [];
    return items.map((item: any) => ({ id: item.id, data: item.data }));
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
    if (!this.sdk?.create) {
      throw new Error('UniID SDK 数据接口不可用');
    }
    const now = Date.now();
    const permissions = {
      default: {
        read: ['$public', '$app_admin'],
        create: ['$all', '$app_admin'],
        update: ['$owner', '$app_admin'],
        delete: ['$owner', '$app_admin'],
      },
      fields: {
        'data.status': {
          read: ['$public', '$app_admin'],
          update: ['$app_admin'],
        },
      },
    };
    await this.sdk.create(
      COMMENT_DATA_TYPE,
      {
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
      },
      permissions
    );
  }

  async updateCommentStatus(commentId: string, status: CommentStatus): Promise<void> {
    await this.init();
    if (!this.sdk?.update) {
      throw new Error('UniID SDK 数据接口不可用');
    }
    await this.sdk.update(commentId, { status, updatedAt: Date.now() });
  }
}

