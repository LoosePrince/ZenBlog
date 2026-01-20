import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PostDetail from './pages/PostDetail';
import Editor from './pages/Editor';
import Settings from './pages/Settings';
import { Post, Profile, GitHubConfig, PublicConfig, FileChange } from './types';
import { GitHubService } from './services/githubService';

const App: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
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
        // 忽略 404，因为新安装的博客还没有 data 分支或文件
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
      } catch (err: any) {
        setInitError(`保存设置失败: ${err.message}`);
      }
    }
  };

  const handleSaveProfile = async (newProfile: Profile) => {
    setProfile(newProfile);
    if (config?.token) {
      try {
        const service = new GitHubService(config);
        await service.commitMultipleFiles('Update profile', [
          { path: 'data/profile.json', content: JSON.stringify(newProfile, null, 2) }
        ]);
      } catch (err: any) {
        alert('个人资料保存失败: ' + err.message);
      }
    }
  };

  const handleSavePost = async (postData: Partial<Post>, content: string) => {
    if (!config?.token) throw new Error('未配置 Token');
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

    // 原子提交：内容和列表索引合并为一个 Commit
    const changes: FileChange[] = [
      { path: contentPath, content },
      { path: 'data/posts.json', content: JSON.stringify(updatedPosts, null, 2) }
    ];

    await service.commitMultipleFiles(`Post: ${postData.title}`, changes);
    setPosts(updatedPosts);
  };

  const handleDeletePost = async (id: string) => {
    if (!config?.token) return;
    const service = new GitHubService(config);
    const post = posts.find(p => p.id === id);
    if (!post) return;

    try {
      // 原子提交：只更新索引，实际 MD 文件可稍后清理或保持现状（Git Data API 限制一次性删除操作较复杂）
      const updatedPosts = posts.filter(p => p.id !== id);
      await service.commitMultipleFiles(`Remove post: ${id}`, [
        { path: 'data/posts.json', content: JSON.stringify(updatedPosts, null, 2) }
      ]);
      
      // 尝试顺便删除实际文件（独立操作）
      try {
        const { sha } = await service.getFile(post.contentPath);
        await service.deleteFile(post.contentPath, `Cleanup ${id}`, sha);
      } catch (e) {}

      setPosts(updatedPosts);
    } catch (err: any) {
      alert('删除失败: ' + err.message);
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#f9fafb] text-gray-900">
        <Navbar isAdmin={isAdmin} onToggleAdmin={() => setIsAdmin(!isAdmin)} />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {(!config || !config.token) && isAdmin && (
            <div className="mb-8 p-6 bg-amber-500 rounded-3xl text-white shadow-xl shadow-amber-100 flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="text-xl font-bold">存算分离模式已就绪</h3>
                <p className="opacity-90">请配置 Token，数据将自动存储在专用的 <b>data</b> 分支。</p>
              </div>
              <Link to="/settings" className="px-6 py-2 bg-white text-amber-600 rounded-xl font-bold hover:scale-105 transition-transform">
                配置存储
              </Link>
            </div>
          )}
          {initError && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm">
              <strong>连接异常：</strong>{initError}。请检查 Token 权限。
            </div>
          )}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium">正在同步内容...</p>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<Home posts={posts} profile={profile} isAdmin={isAdmin} />} />
              <Route path="/post/:id" element={<PostDetail posts={posts} config={config} isAdmin={isAdmin} onDelete={handleDeletePost} />} />
              <Route path="/edit/:id" element={<Editor posts={posts} config={config} onSave={handleSavePost} />} />
              <Route path="/settings" element={<Settings config={config} profile={profile} onSaveConfig={handleSaveConfig} onSaveProfile={handleSaveProfile} />} />
              <Route path="/about" element={<div className="prose prose-indigo max-w-none text-center py-20"><h1>关于我</h1><p className="text-xl text-gray-500">{profile.bio}</p></div>} />
            </Routes>
          )}
        </main>
        <footer className="py-12 border-t border-gray-100 mt-20">
          <div className="max-w-5xl mx-auto px-4 text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} {profile.name}. 数据存储于 <b>data</b> 分支.
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;