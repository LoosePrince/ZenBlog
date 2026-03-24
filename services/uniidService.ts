import { UniIdConfig, UniIdUser } from '../types';

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

const UNI_ID_SDK_PATH = '/sdk/uniid.sdk.js';
const BINDING_DATA_TYPE = 'zenblog_account_binding';

export class UniIdService {
  private config: UniIdConfig;
  private sdk: InstanceType<NonNullable<typeof window.AuthSDK>> | null = null;
  private sdkReady: Promise<void> | null = null;

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
      const existing = document.querySelector<HTMLScriptElement>(`script[data-uniid-sdk="1"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('UniID SDK 加载失败')), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = `${this.config.authServer.replace(/\/+$/, '')}${UNI_ID_SDK_PATH}`;
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
}

