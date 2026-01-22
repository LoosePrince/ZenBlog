import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import Editor from './pages/Editor';
import Settings from './pages/Settings';
import About from './pages/About';
import { Post, Profile, GitHubConfig, PublicConfig, FileChange } from './types';
import { GitHubService } from './services/githubService';
import { translations, Language } from './services/i18n';

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

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

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
  isAdmin: boolean;
  onToggleAdmin: () => void;
  posts: Post[];
  profile: Profile;
  config: GitHubConfig | null;
  configLoading: boolean;
  loading: boolean;
  initError: string | null;
  handleSaveConfig: (c: GitHubConfig) => Promise<void>;
  handleSaveProfile: (p: Profile) => Promise<void>;
  handleSaveConfigAndProfile: (c: GitHubConfig, p: Profile) => Promise<void>;
  handleSavePost: (p: Partial<Post>, c: string) => Promise<void>;
  handleDeletePost: (id: string) => Promise<void>;
}> = ({
  isAdmin, onToggleAdmin, posts, profile, config, configLoading, loading, initError,
  handleSaveConfig, handleSaveProfile, handleSaveConfigAndProfile, handleSavePost, handleDeletePost
}) => {
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#f9fafb] dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans selection:bg-indigo-100 selection:text-indigo-900 dark:selection:bg-indigo-900 dark:selection:text-indigo-100 transition-colors duration-300">
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar isAdmin={isAdmin} onToggleAdmin={onToggleAdmin} profile={profile} />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <AnimatePresence mode="wait">
          {(!config || !config.token) && isAdmin && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-3xl border border-indigo-200 flex flex-col md:flex-row items-center justify-between"
            >
              <div className="mb-4 md:mb-0">
                <h3 className="text-xl font-bold text-indigo-700">存算分离模式已就绪</h3>
                <p className="text-gray-600">请配置 Token，数据将自动存储在专用的 <b>data</b> 分支。</p>
              </div>
              <Link to="/settings" className="px-6 py-2 border-2 border-indigo-300 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all active:scale-95">
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
              <Route path="/" element={<PageWrapper><Home posts={posts} profile={profile} isAdmin={isAdmin} /></PageWrapper>} />
              <Route path="/post/:id" element={<PageWrapper><PostDetail posts={posts} config={config} profile={profile} isAdmin={isAdmin} onDelete={handleDeletePost} /></PageWrapper>} />
              <Route path="/edit/:id" element={<PageWrapper><Editor posts={posts} config={config} onSave={handleSavePost} /></PageWrapper>} />
              <Route path="/settings" element={<PageWrapper><Settings config={config} profile={profile} onSaveConfig={handleSaveConfig} onSaveProfile={handleSaveProfile} onSaveConfigAndProfile={handleSaveConfigAndProfile} /></PageWrapper>} />
              <Route path="/about" element={<PageWrapper><About profile={profile} isAdmin={isAdmin} onSave={handleSaveProfile} /></PageWrapper>} />
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
  const [isAdmin, setIsAdmin] = useState(false);
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

  // 动态更新favicon
  useEffect(() => {
    if (profile.avatar) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'icon';
      link.href = profile.avatar;
      if (!document.querySelector("link[rel*='icon']")) {
        document.head.appendChild(link);
      }
    }
  }, [profile.avatar]);

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
    toast.success(t.settings.syncLocal);
  };

  const handleSaveProfile = async (newProfile: Profile) => {
    setProfile(newProfile);
    if (config?.token) {
      const loadId = toast.loading(t.common.syncing);
      try {
        const service = new GitHubService(config);
        await service.commitMultipleFiles('Update profile', [
          { path: 'data/profile.json', content: JSON.stringify(newProfile, null, 2) }
        ]);
        toast.success(t.settings.syncSuccess, { id: loadId });
      } catch (err: any) {
        toast.error(`${t.settings.syncError}: ${err.message}`, { id: loadId });
      }
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
    const hasChanges = isProfileChanged; // 配置变更需要重新下载 config.json

    // 2. 更新本地状态和存储
    localStorage.setItem('zenblog_config', JSON.stringify(newConfig));
    setConfig(newConfig);
    setProfile(newProfile);

    // 3. 仅当有实质性变更且有Token时提交到 data 分支
    if (newConfig.token && isProfileChanged) {
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
      }
    } else {
      toast.success(t.settings.syncLocal);
    }

    // 4. 如果配置变更，提示下载 config.json
    if (isConfigChanged) {
      toast.success('配置已保存，请下载 config.json 并重新部署', { duration: 5000 });
    }
  };

  const handleSavePost = async (postData: Partial<Post>, content: string) => {
    if (!config?.token) throw new Error('未配置 Token');
    const loadId = toast.loading(t.editor.saving);
    try {
      const service = new GitHubService(config);
      const id = postData.id!;
      const contentPath = `posts/${id}.md`;
      
      const updatedPosts = [...posts];
      const index = updatedPosts.findIndex(p => p.id === id);
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

      const changes: FileChange[] = [
        { path: contentPath, content },
        { path: 'data/posts.json', content: JSON.stringify(updatedPosts, null, 2) }
      ];

      await service.commitMultipleFiles(`Post: ${postData.title}`, changes);
      setPosts(updatedPosts);
      toast.success(t.editor.saveSuccess, { id: loadId });
    } catch (err: any) {
      toast.error(`${t.editor.saveError}: ${err.message}`, { id: loadId });
      throw err;
    }
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
        <Router>
          <AppContent 
            isAdmin={isAdmin}
            onToggleAdmin={() => setIsAdmin(!isAdmin)}
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
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  );
};

export default App;