import React, { useState } from 'react';
import { Shield, Github, Save, CheckCircle, Database, ExternalLink, AlertTriangle, Layers } from 'lucide-react';
import { GitHubConfig, Profile } from '../types';

interface SettingsProps {
  config: GitHubConfig | null;
  profile: Profile;
  onSaveConfig: (config: GitHubConfig) => void;
  onSaveProfile: (profile: Profile) => void;
}

const Settings: React.FC<SettingsProps> = ({ config, profile, onSaveConfig, onSaveProfile }) => {
  const [token, setToken] = useState(config?.token || '');
  const [owner, setOwner] = useState(config?.owner || '');
  const [repo, setRepo] = useState(config?.repo || '');
  const [branch, setBranch] = useState(config?.branch || 'data');

  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [githubUrl, setGithubUrl] = useState(profile.socials.github || '');

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!token || !owner || !repo) {
      alert('请完整填写 GitHub 配置信息');
      return;
    }
    onSaveConfig({ token, owner, repo, branch });
    onSaveProfile({
      ...profile,
      name,
      bio,
      avatar,
      socials: { ...profile.socials, github: githubUrl }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">
            <Layers size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">存算分离配置</h1>
            <p className="text-gray-500 mt-1">代码存放于 main，数据存放于独立分支</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
        >
          {saved ? <CheckCircle size={20} className="mr-2" /> : <Save size={20} className="mr-2" />}
          {saved ? '同步成功' : '应用并保存'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* GitHub 存储层 */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gray-900 text-white rounded-lg">
              <Database size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">数据存储层</h2>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start space-x-3">
            <AlertTriangle size={24} className="text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-700 leading-relaxed">
              <p className="font-bold mb-1">原子提交说明：</p>
              <p>系统现已支持<b>多文件原子提交</b>。保存文章时，内容和列表索引将合并为一个 Commit 提交至存储分支，保持 Git 树洁净。</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Personal Access Token</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxx"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              <div className="mt-2 flex items-center justify-between text-[10px]">
                <span className="text-gray-400 flex items-center"><Shield size={10} className="mr-1" /> Token 仅本地加密保存</span>
                <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center">生成 Token <ExternalLink size={10} className="ml-0.5" /></a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">所有者</label>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">仓库名</label>
                <input
                  type="text"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">存储分支 (建议设为 data)</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="data"
                className="w-full px-4 py-2.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-medium rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </section>

        {/* 博主资料设置 */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Github size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">博主展示信息</h2>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">显示名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">个人签名</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">头像 URL (支持 DiceBear)</label>
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;