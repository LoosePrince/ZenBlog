import React, { useState } from 'react';
import { Shield, Github, Save, CheckCircle, Database, ExternalLink, AlertTriangle, Layers, User, Settings as SettingsIcon } from 'lucide-react';
import { GitHubConfig, Profile } from '../types';
import { motion } from 'framer-motion';
import { useLanguage } from '../App';

interface SettingsProps {
  config: GitHubConfig | null;
  profile: Profile;
  onSaveConfig: (config: GitHubConfig) => Promise<void>;
  onSaveProfile: (profile: Profile) => Promise<void>;
  onSaveConfigAndProfile: (config: GitHubConfig, profile: Profile) => Promise<void>;
}

const Settings: React.FC<SettingsProps> = ({ config, profile, onSaveConfig, onSaveProfile, onSaveConfigAndProfile }) => {
  const { t } = useLanguage();
  const [token, setToken] = useState(config?.token || '');
  const [owner, setOwner] = useState(config?.owner || '');
  const [repo, setRepo] = useState(config?.repo || '');
  const [branch, setBranch] = useState(config?.branch || 'data');

  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [githubUrl, setGithubUrl] = useState(profile.socials.github || '');

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!token || !owner || !repo) {
      alert(t.settings.fillConfig);
      return;
    }
    setSaving(true);
    try {
      // 使用合并提交函数，一次性提交配置和个人资料
      await onSaveConfigAndProfile(
        { token, owner, repo, branch },
        {
          ...profile,
          name,
          bio,
          avatar,
          socials: { ...profile.socials, github: githubUrl }
        }
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-0">
      {/* 桌面端顶部 */}
      <div className="hidden md:flex md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-2 flex items-center">
            <SettingsIcon className="mr-3 text-indigo-600 dark:text-indigo-400" size={32} />
            {t.settings.title}
          </h1>
          <p className="text-gray-400 dark:text-gray-500 font-medium italic">{t.settings.subtitle}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center px-8 py-4 border-2 border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-[1.5rem] font-black hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin mr-2"></div>
          ) : (
            <Save size={18} className="mr-2" />
          )}
          {saving ? t.settings.saving : t.settings.save}
        </button>
      </div>

      {/* 移动端顶部简化标题 */}
      <div className="md:hidden mb-4">
        <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-1 flex items-center">
          <SettingsIcon className="mr-2 text-indigo-600 dark:text-indigo-400" size={22} />
          {t.settings.title}
        </h1>
        <p className="text-gray-400 dark:text-gray-500 font-medium text-sm">{t.settings.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-10">
        <div className="lg:col-span-2 space-y-4 md:space-y-10">
          {/* GitHub 存储层 */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-4 md:p-10 rounded-xl md:rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center space-x-3 mb-5 md:mb-10">
              <div className="p-2 md:p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl md:rounded-2xl border border-indigo-100 dark:border-indigo-900">
                <Database size={20} className="md:w-6 md:h-6" />
              </div>
              <div>
                <h2 className="text-lg md:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">{t.settings.dataPersistence}</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-0.5">{t.settings.gitDatabase}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-2 md:mb-3">{t.settings.token}</label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full px-3 md:px-5 py-2.5 md:py-4 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg md:rounded-2xl focus:ring-2 md:focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/30 outline-none transition-all font-mono text-sm"
                />
                <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px]">
                  <span className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tighter flex items-center">
                    <Shield size={12} className="mr-1 text-green-500 dark:text-green-400" /> {t.settings.tokenHint}
                  </span>
                  <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 font-black hover:underline flex items-center">
                    {t.settings.generateKey} <ExternalLink size={10} className="ml-1" />
                  </a>
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-2 md:mb-3">{t.settings.owner}</label>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full px-3 md:px-5 py-2.5 md:py-4 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg md:rounded-2xl focus:ring-2 md:focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/30 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-2 md:mb-3">{t.settings.repoName}</label>
                <input
                  type="text"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  className="w-full px-3 md:px-5 py-2.5 md:py-4 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg md:rounded-2xl focus:ring-2 md:focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/30 outline-none transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs md:text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-2 md:mb-3">{t.settings.dataBranch}</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="data"
                  className="w-full px-3 md:px-5 py-2.5 md:py-4 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 font-black rounded-lg md:rounded-2xl focus:ring-2 md:focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/30 outline-none"
                />
                <p className="mt-2 text-[10px] text-indigo-400 dark:text-indigo-500 font-bold uppercase tracking-widest italic">
                  {t.settings.branchHint}
                </p>
              </div>
            </div>
          </motion.section>

          {/* 博主资料设置 */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 p-4 md:p-10 rounded-xl md:rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center space-x-3 mb-5 md:mb-10">
              <div className="p-2 md:p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl md:rounded-2xl">
                <User size={20} className="md:w-6 md:h-6" />
              </div>
              <div>
                <h2 className="text-lg md:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">{t.settings.authorIdentity}</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-0.5">{t.settings.publicProfile}</p>
              </div>
            </div>
            
            <div className="space-y-4 md:space-y-8">
              <div>
                <label className="block text-xs md:text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-2 md:mb-3">{t.settings.displayName}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 md:px-5 py-2.5 md:py-4 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg md:rounded-2xl focus:ring-2 md:focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/30 outline-none transition-all font-bold"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-2 md:mb-3">{t.settings.bio}</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-3 md:px-5 py-2.5 md:py-4 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg md:rounded-2xl focus:ring-2 md:focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/30 outline-none resize-none transition-all font-medium leading-relaxed"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-2 md:mb-3">{t.settings.avatarUrl}</label>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full px-3 md:px-5 py-2.5 md:py-4 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg md:rounded-2xl focus:ring-2 md:focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/30 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-2 md:mb-3">GitHub</label>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full px-3 md:px-5 py-2.5 md:py-4 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg md:rounded-2xl focus:ring-2 md:focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/30 outline-none transition-all"
                />
              </div>
            </div>
          </motion.section>
        </div>

        <aside className="space-y-4 md:space-y-8">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-4 md:p-8 rounded-xl md:rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900">
            <h3 className="text-sm md:text-lg font-black mb-3 md:mb-4 flex items-center text-indigo-700 dark:text-indigo-400">
              <AlertTriangle size={18} className="mr-2 md:w-5 md:h-5" /> {t.settings.storageMode}
            </h3>
            <div className="space-y-3 md:space-y-4 text-xs font-bold leading-relaxed text-gray-600 dark:text-gray-400">
              <p>{t.settings.storageDesc}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 md:p-8 rounded-xl md:rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-xs md:text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-4 md:mb-6 border-b border-gray-50 dark:border-gray-700 pb-3 md:pb-4">{t.settings.integrity}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tight">{t.settings.cloudSync}</span>
                <span className="text-green-500 dark:text-green-400 font-black uppercase tracking-tight flex items-center">
                  <CheckCircle size={12} className="mr-1" /> {t.settings.active}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tight">{t.settings.apiQuota}</span>
                <span className="text-gray-900 dark:text-gray-100 font-black uppercase tracking-tight">5000/hr</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* 移动端底部固定保存按钮 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50 p-3"
      >
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center px-5 py-3 border-2 border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-black hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-sm"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin mr-2"></div>
              {t.settings.saving}
            </>
          ) : (
            <>
              <Save size={18} className="mr-2" />
              {t.settings.save}
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
};

export default Settings;