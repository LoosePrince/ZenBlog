import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import Editor from './pages/Editor';
import Settings from './pages/Settings';
import About from './pages/About';
import Login from './pages/Login';
import { AuthState, Post, Profile, GitHubConfig, PublicConfig, FileChange } from './types';
import { GitHubService } from './services/githubService';
import { UniIdService } from './services/uniidService';
import { translations, Language } from './services/i18n';

const FALLBACK_UNIID_CONFIG = {
  authServer: 'http://localhost:3000',
  appId: 'cmn4fv9zd0003yjt3mp6wmgr9',
};

export type Theme = 'light' | 'dark' | 'auto';

interface LanguageContextType {
  language: Language;
  t: any;
  setLanguage: (lang: Language) => void;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: 'light' | 'dark';
}

interface AuthContextType {
  authState: AuthState;
  githubBindingStatus: 'bound' | 'unbound' | 'unknown';
  loginByUniId: () => Promise<boolean>;
  loginByGithubKey: (key: string) => Promise<void>;
  logout: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// 日期格式化工具函数
export const formatDate = (date: string | Date, format: 'full' | 'short' | 'editor', language: Language = 'zh'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  
  if (format === 'full') {
    return dateObj.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  } else if (format === 'short') {
    return dateObj.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  } else {
    return dateObj.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  }
};

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

const AppContent: React.FC<{
  canManage: boolean;
  authState: AuthState;
  logout: () => Promise<void>;
  posts: Post[];
  profile: Profile;
  config: GitHubConfig | null;
  configLoading: boolean;
  loading: boolean;
  initError: string | null;
  handleSaveConfig: (c: GitHubConfig) => Promise<void>;
  handleSaveProfile: (p: Profile) => Promise<void>;
  handleSaveConfigAndProfile: (c: GitHubConfig, p: Profile) => Promise<void>;
  handleSavePost: (p: Partial<Post>, c: string, options?: { pendingFiles?: Array<{ localId: string; file: File }>; onProgress?: (current: number, total: number) => void; signal?: AbortSignal }) => Promise<void>;
  handleDeletePost: (id: string) => Promise<void>;
}> = ({
  canManage, authState, logout, posts, profile, config, configLoading, loading, initError,
  handleSaveConfig, handleSaveProfile, handleSaveConfigAndProfile, handleSavePost, handleDeletePost
}) => {
  const location = useLocation();
  const { t } = useLanguage();

  const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!authState.isUniIdAuthed && !authState.isWriterUnlocked) {
      return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }
    return <>{children}</>;
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans selection:bg-indigo-100 selection:text-indigo-900 dark:selection:bg-indigo-900 dark:selection:text-indigo-100 transition-colors duration-300">
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar
        canManage={canManage}
        isUniIdAuthed={authState.isUniIdAuthed}
        isWriterUnlocked={authState.isWriterUnlocked}
        onLogout={logout}
        profile={profile}
      />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <AnimatePresence mode="wait">
          {(!config || !config.token) && canManage && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-3xl border border-indigo-200 dark:border-indigo-800 flex flex-col md:flex-row items-center justify-between"
            >
              <div className="mb-4 md:mb-0">
                <h3 className="text-xl font-bold text-indigo-700 dark:text-indigo-300">存算分离模式已就绪</h3>
                <p className="text-gray-600 dark:text-gray-300">请配置 Token，数据将自动存储在专用的 <b>data</b> 分支。</p>
              </div>
              <Link to="/settings" className="px-6 py-2 border-2 border-indigo-300 dark:border-indigo-700 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all active:scale-95">
                {t.nav.settings}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {initError && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm flex items-center">
            <span className="mr-2">⚠️</span>
            <strong>{t.common.error}：</strong>{initError}
          </div>
        )}

        {(configLoading || loading) ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-gray-400 font-medium tracking-widest uppercase text-xs">{t.common.loading}</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageWrapper><Home posts={posts} profile={profile} isAdmin={canManage} /></PageWrapper>} />
              <Route path="/post/:id" element={<PageWrapper><PostDetail posts={posts} config={config} profile={profile} isAdmin={canManage} onDelete={handleDeletePost} /></PageWrapper>} />
              <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
              <Route path="/edit/:id" element={<ProtectedRoute><PageWrapper><Editor posts={posts} config={config} onSave={handleSavePost} /></PageWrapper></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><PageWrapper><Settings config={config} profile={profile} onSaveConfig={handleSaveConfig} onSaveProfile={handleSaveProfile} onSaveConfigAndProfile={handleSaveConfigAndProfile} /></PageWrapper></ProtectedRoute>} />
              <Route path="/about" element={<PageWrapper><About profile={profile} isAdmin={canManage} config={config} onSave={handleSaveProfile} /></PageWrapper>} />
            </Routes>
          </AnimatePresence>
        )}
      </main>

      <footer className="py-16 border-t border-gray-100 dark:border-gray-800 mt-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">© {new Date().getFullYear()} {profile.name}.</p>
          <p className="text-gray-300 dark:text-gray-600 text-[10px] mt-2 tracking-widest uppercase">Powered by ZenBlog & GitHub API</p>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isUniIdAuthed: false,
    isWriterUnlocked: false,
    uniIdToken: null,
    uniIdUser: null,
  });
  const [uniIdConfig, setUniIdConfig] = useState(FALLBACK_UNIID_CONFIG);
  const uniIdService = useMemo(() => new UniIdService(uniIdConfig), [uniIdConfig]);
  const [githubBindingStatus, setGithubBindingStatus] = useState<'bound' | 'unbound' | 'unknown'>('unknown');
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('zenblog_lang');
    return (saved as Language) || 'zh';
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('zenblog_theme');
    return (saved as Theme) || 'auto';
  });

  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  const setLanguage = (lang: Language) => {
    localStorage.setItem('zenblog_lang', lang);
    setLanguageState(lang);
  };

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('zenblog_theme', newTheme);
    setThemeState(newTheme);
  };

  // 监听系统主题变化和主题设置
  useEffect(() => {
    const updateTheme = () => {
      let isDark = false;
      
      if (theme === 'dark') {
        isDark = true;
      } else if (theme === 'auto') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      
      setEffectiveTheme(isDark ? 'dark' : 'light');
      
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    updateTheme();

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'auto') {
        updateTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const t = translations[language];

  const [posts, setPosts] = useState<Post[]>([]);
  const [profile, setProfile] = useState<Profile>({
    name: "ZenBlog",
    bio: "已就绪，欢迎使用！",
    avatar: "https://t.alcy.cc/tx",
    socials: {}
  });

  const [config, setConfig] = useState<GitHubConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const canManage = authState.isUniIdAuthed || authState.isWriterUnlocked;

  useEffect(() => {
    const restore = async () => {
      const cachedToken = localStorage.getItem('zenblog_uniid_token');
      const cachedUser = localStorage.getItem('zenblog_uniid_user');
      const cachedWriter = localStorage.getItem('zenblog_writer_unlocked') === '1';
      if (cachedWriter) {
        setAuthState((prev) => ({ ...prev, isWriterUnlocked: true }));
      }
      if (!cachedToken) return;
      const checked = await uniIdService.checkToken(cachedToken);
      if (checked.valid) {
        let boundStatus: 'bound' | 'unbound' | 'unknown' = 'unknown';
        const userId = checked.user?.id ?? (cachedUser ? JSON.parse(cachedUser)?.id : undefined);
        if (userId) {
          try {
            const bindingKey = await uniIdService.getGitHubBinding(userId);
            boundStatus = bindingKey ? 'bound' : 'unbound';
          } catch {
            boundStatus = 'unknown';
          }
        }
        setAuthState({
          isUniIdAuthed: true,
          isWriterUnlocked: cachedWriter,
          uniIdToken: cachedToken,
          uniIdUser: checked.user ?? (cachedUser ? JSON.parse(cachedUser) : null),
        });
        setGithubBindingStatus(boundStatus);
      } else {
        localStorage.removeItem('zenblog_uniid_token');
        localStorage.removeItem('zenblog_uniid_user');
        setGithubBindingStatus('unknown');
      }
    };
    restore();
  }, [uniIdService]);

  // 从 /config.json 读取配置（main 分支中的静态文件）
  useEffect(() => {
    const loadConfig = async () => {
      try {
        // 1. 优先从 localStorage 读取（管理员已配置，包含 token）
        const saved = localStorage.getItem('zenblog_config');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.owner && parsed.repo) {
            setConfig(parsed);
            setConfigLoading(false);
            return;
          }
        }

        // 2. 从 /config.json 读取（main 分支中的静态文件）
        const response = await fetch('/config.json');
        if (response.ok) {
          const publicConfig = await response.json();
          if (publicConfig.owner && publicConfig.repo) {
            if (publicConfig.uniid?.authServer && publicConfig.uniid?.appId) {
              setUniIdConfig({
                authServer: publicConfig.uniid.authServer,
                appId: publicConfig.uniid.appId,
              });
            }
            setConfig({
              token: '', // token 只存在 localStorage
              owner: publicConfig.owner,
              repo: publicConfig.repo,
              branch: publicConfig.branch || 'data'
            });
            setConfigLoading(false);
            return;
          }
        }

        // 没有找到配置
        setConfig(null);
      } catch (err) {
        console.warn('Failed to load config:', err);
        setConfig(null);
      } finally {
        setConfigLoading(false);
      }
    };

    loadConfig();
  }, []);

  // 动态更新页面标题、favicon 和 meta description
  useEffect(() => {
    // 更新页面标题
    const siteName = profile.siteSettings?.siteName || profile.name || 'ZenBlog';
    document.title = siteName;

    // 更新 favicon（优先使用 siteSettings.siteIcon，否则使用 profile.avatar）
    const iconUrl = profile.siteSettings?.siteIcon || profile.avatar;
    if (iconUrl) {
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.type = iconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/x-icon';
      link.href = iconUrl;
    }

    // 更新 meta description
    const siteDescription = profile.siteSettings?.siteDescription || profile.bio || '';
    if (siteDescription) {
      let metaDesc = document.querySelector("meta[name='description']") as HTMLMetaElement;
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = siteDescription;
    }
  }, [profile.siteSettings, profile.name, profile.avatar, profile.bio]);

  useEffect(() => {
    const hideLoader = () => {
      const loader = document.getElementById('initial-loader');
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
      }
    };

    // 等待配置加载完成
    if (configLoading) {
      return;
    }

    const loadData = async () => {
      if (!config || !config.owner || !config.repo) {
        setLoading(false);
        hideLoader();
        return;
      }

      try {
        const service = new GitHubService(config);
        const results = await Promise.allSettled([
          service.getFile('data/posts.json'),
          service.getFile('data/profile.json')
        ]);

        if (results[0].status === 'fulfilled') {
          setPosts(JSON.parse(results[0].value.content));
        }
        if (results[1].status === 'fulfilled') {
          setProfile(JSON.parse(results[1].value.content));
        }
        setInitError(null);
      } catch (err: any) {
        if (!err.message.includes('404')) {
          setInitError(err.message);
        }
      } finally {
        setLoading(false);
        hideLoader();
      }
    };

    loadData();
  }, [config?.owner, config?.repo, configLoading]);

  const handleSaveConfig = async (newConfig: GitHubConfig) => {
    localStorage.setItem('zenblog_config', JSON.stringify(newConfig));
    setConfig(newConfig);
    if (authState.isUniIdAuthed && authState.uniIdUser?.id && newConfig.token) {
      try {
        await uniIdService.upsertGitHubBinding(authState.uniIdUser.id, newConfig.token);
        setGithubBindingStatus('bound');
      } catch (err) {
        console.warn('Failed to sync GitHub key to UniID:', err);
      }
    }
    toast.success(t.settings.syncLocal);
  };

  const handleSaveProfile = async (newProfile: Profile) => {
    if (!config?.token) {
      toast.error(t.settings.enterToken || '请先配置 GitHub Token');
      throw new Error('未配置 Token');
    }
    setProfile(newProfile);
    const loadId = toast.loading(t.common.syncing);
    try {
      const service = new GitHubService(config);
      await service.commitMultipleFiles('Update profile', [
        { path: 'data/profile.json', content: JSON.stringify(newProfile, null, 2) }
      ]);
      toast.success(t.settings.syncSuccess, { id: loadId });
    } catch (err: any) {
      toast.error(`${t.settings.syncError}: ${err.message}`, { id: loadId });
      throw err;
    }
  };

  const handleSaveConfigAndProfile = async (newConfig: GitHubConfig, newProfile: Profile) => {
    // 1. 检查是否有实质性变更（不包含Token）
    const oldPublicConfig: PublicConfig | null = config ? {
      owner: config.owner,
      repo: config.repo,
      branch: config.branch
    } : null;

    const newPublicConfig: PublicConfig = {
      owner: newConfig.owner,
      repo: newConfig.repo,
      branch: newConfig.branch
    };

    const isConfigChanged = JSON.stringify(oldPublicConfig) !== JSON.stringify(newPublicConfig);
    const isProfileChanged = JSON.stringify(profile) !== JSON.stringify(newProfile);

    // 2. 如果保存 profile 但没有 token，则不允许
    if (isProfileChanged && !newConfig.token) {
      toast.error(t.settings.enterToken || '请先配置 GitHub Token');
      throw new Error('未配置 Token');
    }

    // 3. 更新本地状态和存储（仅保存 config，profile 需要 token）
    localStorage.setItem('zenblog_config', JSON.stringify(newConfig));
    setConfig(newConfig);
    if (authState.isUniIdAuthed && authState.uniIdUser?.id && newConfig.token) {
      try {
        await uniIdService.upsertGitHubBinding(authState.uniIdUser.id, newConfig.token);
        setGithubBindingStatus('bound');
      } catch (err) {
        console.warn('Failed to sync GitHub key to UniID:', err);
      }
    }
    
    // 4. 如果有 token 且有 profile 变更，更新 profile 并提交到云端
    if (newConfig.token && isProfileChanged) {
      setProfile(newProfile);
      const loadId = toast.loading(t.settings.saving);
      try {
        const service = new GitHubService(newConfig);
        await service.commitMultipleFiles('Update profile', [
          { path: 'data/profile.json', content: JSON.stringify(newProfile, null, 2) }
        ]);
        
        setInitError(null);
        toast.success(t.settings.syncSuccess, { id: loadId });
      } catch (err: any) {
        setInitError(`${t.settings.syncError}: ${err.message}`);
        toast.error(`${t.settings.syncError}: ${err.message}`, { id: loadId });
        throw err;
      }
    } else if (isProfileChanged) {
      // 如果没有 token 但有 profile 变更，不允许保存
      toast.error(t.settings.enterToken || '请先配置 GitHub Token');
      throw new Error('未配置 Token');
    } else {
      // 仅保存 config（token），不涉及 profile
      toast.success(t.settings.syncLocal);
    }
  };

  const loginByUniId = async (): Promise<boolean> => {
    const result = await uniIdService.login();
    if (result.cancelled || !result.token || !result.user) return false;
    localStorage.setItem('zenblog_uniid_token', result.token);
    localStorage.setItem('zenblog_uniid_user', JSON.stringify(result.user));
    let writerUnlocked = localStorage.getItem('zenblog_writer_unlocked') === '1';
    let configToken = config?.token || '';
    if (!configToken && result.user.id) {
      try {
        const bindingKey = await uniIdService.getGitHubBinding(result.user.id);
        setGithubBindingStatus(bindingKey ? 'bound' : 'unbound');
        if (bindingKey && config) {
          configToken = bindingKey;
          const merged = { ...config, token: bindingKey };
          localStorage.setItem('zenblog_config', JSON.stringify(merged));
          setConfig(merged);
          writerUnlocked = true;
          localStorage.setItem('zenblog_writer_unlocked', '1');
        }
      } catch (err) {
        console.warn('Failed to load GitHub key binding:', err);
        setGithubBindingStatus('unknown');
      }
    } else {
      setGithubBindingStatus('unknown');
    }
    setAuthState({
      isUniIdAuthed: true,
      isWriterUnlocked: writerUnlocked,
      uniIdToken: result.token,
      uniIdUser: result.user,
    });
    return true;
  };

  const loginByGithubKey = async (key: string): Promise<void> => {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `token ${key}`,
      },
    });
    if (!res.ok) {
      throw new Error('GitHub Key 无效或权限不足');
    }
    localStorage.setItem('zenblog_writer_unlocked', '1');
    setAuthState((prev) => ({ ...prev, isWriterUnlocked: true }));
    if (config) {
      const nextConfig = { ...config, token: key };
      localStorage.setItem('zenblog_config', JSON.stringify(nextConfig));
      setConfig(nextConfig);
    }
    if (authState.isUniIdAuthed && authState.uniIdUser?.id) {
      await uniIdService.upsertGitHubBinding(authState.uniIdUser.id, key);
      setGithubBindingStatus('bound');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (authState.isUniIdAuthed) {
        await uniIdService.logout();
      }
    } catch (err) {
      console.warn('UniID logout failed:', err);
    } finally {
      localStorage.removeItem('zenblog_uniid_token');
      localStorage.removeItem('zenblog_uniid_user');
      localStorage.removeItem('zenblog_writer_unlocked');
      setAuthState({
        isUniIdAuthed: false,
        isWriterUnlocked: false,
        uniIdToken: null,
        uniIdUser: null,
      });
      setGithubBindingStatus('unknown');
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1]! : result;
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const handleSavePost = async (
    postData: Partial<Post>,
    content: string,
    options?: { pendingFiles?: Array<{ localId: string; file: File }>; onProgress?: (current: number, total: number) => void; signal?: AbortSignal }
  ) => {
    if (!config?.token) throw new Error('未配置 Token');
    const { pendingFiles = [], onProgress, signal } = options ?? {};
    const service = new GitHubService(config);
    const id = postData.id!;
    const contentPath = `posts/${id}.md`;

    const updatedPosts = [...posts];
    const index = updatedPosts.findIndex((p) => p.id === id);
    const newPost: Post = {
      id,
      title: postData.title!,
      excerpt: postData.excerpt!,
      category: postData.category!,
      date: postData.date || (index > -1 ? posts[index].date : new Date().toISOString()),
      contentPath,
    };
    if (index > -1) updatedPosts[index] = newPost;
    else updatedPosts.unshift(newPost);

    let finalContent = content;
    const binaryChanges: { path: string; contentBase64: string }[] = [];
    const totalSteps = pendingFiles.length + 1;
    let step = 0;

    if (pendingFiles.length > 0) {
      const localIdToUuid: Record<string, string> = {};
      for (const { localId, file } of pendingFiles) {
        if (signal?.aborted) throw new Error('已取消上传');
        const uuid = crypto.randomUUID?.() ?? `f${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
        localIdToUuid[localId] = uuid;
        const contentBase64 = await fileToBase64(file);
        binaryChanges.push({ path: `data/files/${uuid}`, contentBase64 });
        step += 1;
        onProgress?.(step, totalSteps);
      }
      finalContent = content.replace(
        /data-uuid="(local-[^"]+)"/g,
        (_, localId) => `data-uuid="${localIdToUuid[localId] ?? localId}"`
      );
    }

    if (signal?.aborted) throw new Error('已取消上传');
    step += 1;
    onProgress?.(step, totalSteps);

    const textChanges: FileChange[] = [
      { path: contentPath, content: finalContent },
      { path: 'data/posts.json', content: JSON.stringify(updatedPosts, null, 2) },
    ];

    if (binaryChanges.length > 0) {
      await service.commitWithBlobs(`Post: ${postData.title}`, textChanges, binaryChanges);
    } else {
      await service.commitMultipleFiles(`Post: ${postData.title}`, textChanges);
    }
    setPosts(updatedPosts);
  };

  const handleDeletePost = async (id: string) => {
    if (!config?.token) return;

    const loadId = toast.loading(t.common.syncing);
    const service = new GitHubService(config);
    const post = posts.find(p => p.id === id);
    if (!post) return;

    try {
      const updatedPosts = posts.filter(p => p.id !== id);
      await service.commitMultipleFiles(`Remove post: ${id}`, [
        { path: 'data/posts.json', content: JSON.stringify(updatedPosts, null, 2) }
      ]);
      
      try {
        const { sha } = await service.getFile(post.contentPath);
        await service.deleteFile(post.contentPath, `Cleanup ${id}`, sha);
      } catch (e) {}

      setPosts(updatedPosts);
      toast.success(t.settings.syncSuccess, { id: loadId });
    } catch (err: any) {
      toast.error(`${t.settings.syncError}: ${err.message}`, { id: loadId });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
      <LanguageContext.Provider value={{ language, t, setLanguage }}>
        <AuthContext.Provider value={{ authState, githubBindingStatus, loginByUniId, loginByGithubKey, logout }}>
          <Router>
            <AppContent
              canManage={canManage}
              authState={authState}
              logout={logout}
              posts={posts}
              profile={profile}
              config={config}
              configLoading={configLoading}
              loading={loading}
              initError={initError}
              handleSaveConfig={handleSaveConfig}
              handleSaveProfile={handleSaveProfile}
              handleSaveConfigAndProfile={handleSaveConfigAndProfile}
              handleSavePost={handleSavePost}
              handleDeletePost={handleDeletePost}
            />
          </Router>
        </AuthContext.Provider>
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  );
};

export default App;