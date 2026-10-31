/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BASE_URL: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  glob: (
    pattern: string | string[],
    options?: { eager?: boolean; import?: string; query?: string }
  ) => Record<string, unknown>;
}
