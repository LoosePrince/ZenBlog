import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import Editor from './pages/Editor';
import Settings from './pages/Settings';
import { Post, Profile, GitHubConfig, PublicConfig, FileChange } from './types';
import { GitHubService } from './services/githubService';
import { translations, Language } from './services/i18n';

interface LanguageContextType {
  language: Language;
  t: any;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
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
  loading: boolean;
  initError: string | null;
  handleSaveConfig: (c: GitHubConfig) => Promise<void>;
  handleSaveProfile: (p: Profile) => Promise<void>;
  handleSaveConfigAndProfile: (c: GitHubConfig, p: Profile) => Promise<void>;
  handleSavePost: (p: Partial<Post>, c: string) => Promise<void>;
  handleDeletePost: (id: string) => Promise<void>;
}> = ({
  isAdmin, onToggleAdmin, posts, profile, config, loading, initError,
  handleSaveConfig, handleSaveProfile, handleSaveConfigAndProfile, handleSavePost, handleDeletePost
}) => {
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#f9fafb] text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar isAdmin={isAdmin} onToggleAdmin={onToggleAdmin} />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <AnimatePresence mode="wait">
          {(!config || !config.token) && isAdmin && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-6 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row items-center justify-between"
            >
              <div className="mb-4 md:mb-0">
                <h3 className="text-xl font-bold italic">存算分离模式已就绪</h3>
                <p className="opacity-90">请配置 Token，数据将自动存储在专用的 <b>data</b> 分支。</p>
              </div>
              <Link to="/settings" className="px-6 py-2 bg-white text-indigo-600 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95">
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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
            <p className="text-gray-400 font-medium tracking-widest uppercase text-xs">{t.common.loading}</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageWrapper><Home posts={posts} profile={profile} isAdmin={isAdmin} /></PageWrapper>} />
              <Route path="/post/:id" element={<PageWrapper><PostDetail posts={posts} config={config} isAdmin={isAdmin} onDelete={handleDeletePost} /></PageWrapper>} />
              <Route path="/edit/:id" element={<PageWrapper><Editor posts={posts} config={config} onSave={handleSavePost} /></PageWrapper>} />
              <Route path="/settings" element={<PageWrapper><Settings config={config} profile={profile} onSaveConfig={handleSaveConfig} onSaveProfile={handleSaveProfile} onSaveConfigAndProfile={handleSaveConfigAndProfile} /></PageWrapper>} />
              <Route path="/about" element={<PageWrapper><div className="prose prose-indigo max-w-none text-center py-20"><h1>{t.nav.about}</h1><p className="text-xl text-gray-500 leading-relaxed">{profile.bio}</p></div></PageWrapper>} />
            </Routes>
          </AnimatePresence>
        )}
      </main>

      <footer className="py-16 border-t border-gray-100 mt-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} {profile.name}.</p>
          <p className="text-gray-300 text-[10px] mt-2 tracking-widest uppercase">Powered by ZenBlog & GitHub API</p>
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

  const setLanguage = (lang: Language) => {
    localStorage.setItem('zenblog_lang', lang);
    setLanguageState(lang);
  };

  const t = translations[language];

  const [posts, setPosts] = useState<Post[]>([]);
  const [profile, setProfile] = useState<Profile>({
    name: "新博主",
    bio: "极简云端博客已就绪。请前往设置页面配置 Token，数据将自动存储在专用的 data 分支。",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    socials: {}
  });

  const [config, setConfig] = useState<GitHubConfig | null>(() => {
    const saved = localStorage.getItem('zenblog_config');
    if (saved) return JSON.parse(saved);
    
    const hostname = window.location.hostname;
    if (hostname.includes('github.io')) {
      const owner = hostname.split('.')[0];
      const pathParts = window.location.pathname.split('/').filter(p => p !== '');
      const repo = pathParts[0] || owner;
      return { token: '', owner, repo, branch: 'data' };
    }
    return null;
  });

  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const hideLoader = () => {
      const loader = document.getElementById('initial-loader');
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
      }
    };

    const loadData = async () => {
      if (!config || !config.owner || !config.repo) {
        setLoading(false);
        hideLoader();
        return;
      }

      try {
        const service = new GitHubService(config);
        const results = await Promise.allSettled([
          service.getFile('data/config.json'),
          service.getFile('data/posts.json'),
          service.getFile('data/profile.json')
        ]);

        if (results[1].status === 'fulfilled') {
          setPosts(JSON.parse(results[1].value.content));
        }
        if (results[2].status === 'fulfilled') {
          setProfile(JSON.parse(results[2].value.content));
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
  }, [config?.owner, config?.repo]);

  const handleSaveConfig = async (newConfig: GitHubConfig) => {
    localStorage.setItem('zenblog_config', JSON.stringify(newConfig));
    setConfig(newConfig);

    if (newConfig.token) {
      const loadId = toast.loading(t.settings.saving);
      try {
        const service = new GitHubService(newConfig);
        const publicConfig: PublicConfig = {
          owner: newConfig.owner,
          repo: newConfig.repo,
          branch: newConfig.branch
        };
        await service.commitMultipleFiles('Sync config', [
          { path: 'data/config.json', content: JSON.stringify(publicConfig, null, 2) }
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
    localStorage.setItem('zenblog_config', JSON.stringify(newConfig));
    setConfig(newConfig);
    setProfile(newProfile);

    if (newConfig.token) {
      const loadId = toast.loading(t.settings.saving);
      try {
        const service = new GitHubService(newConfig);
        const publicConfig: PublicConfig = {
          owner: newConfig.owner,
          repo: newConfig.repo,
          branch: newConfig.branch
        };
        
        // 一次性提交配置和个人资料
        await service.commitMultipleFiles('Update settings', [
          { path: 'data/config.json', content: JSON.stringify(publicConfig, null, 2) },
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
    if (!confirm(t.post.deleteConfirm)) return;

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
    <LanguageContext.Provider value={{ language, t, setLanguage }}>
      <Router>
        <AppContent 
          isAdmin={isAdmin}
          onToggleAdmin={() => setIsAdmin(!isAdmin)}
          posts={posts}
          profile={profile}
          config={config}
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
  );
};

export default App;