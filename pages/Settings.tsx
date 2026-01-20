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
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 space-y-6 md:space-y-0">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2 flex items-center">
            <SettingsIcon className="mr-3 text-indigo-600" size={32} />
            {t.settings.title}
          </h1>
          <p className="text-gray-400 font-medium italic">{t.settings.subtitle}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center px-8 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          ) : (
            <Save size={18} className="mr-2" />
          )}
          {saving ? t.settings.saving : t.settings.save}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* GitHub 存储层 */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100"
          >
            <div className="flex items-center space-x-4 mb-10">
              <div className="p-3 bg-gray-900 text-white rounded-2xl shadow-lg">
                <Database size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t.settings.dataPersistence}</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{t.settings.gitDatabase}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <label className="block text-sm font-black text-gray-900 uppercase tracking-widest mb-3 ml-1">{t.settings.token}</label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-mono text-sm"
                />
                <div className="mt-3 flex items-center justify-between text-[10px]">
                  <span className="text-gray-400 font-bold uppercase tracking-tighter flex items-center">
                    <Shield size={12} className="mr-1 text-green-500" /> {t.settings.tokenHint}
                  </span>
                  <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-indigo-600 font-black hover:underline flex items-center">
                    {t.settings.generateKey} <ExternalLink size={10} className="ml-1" />
                  </a>
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-900 uppercase tracking-widest mb-3 ml-1">{t.settings.owner}</label>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-900 uppercase tracking-widest mb-3 ml-1">{t.settings.repoName}</label>
                <input
                  type="text"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-black text-gray-900 uppercase tracking-widest mb-3 ml-1">{t.settings.dataBranch}</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="data"
                  className="w-full px-5 py-4 bg-indigo-50 border border-indigo-100 text-indigo-700 font-black rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none"
                />
                <p className="mt-3 text-[10px] text-indigo-400 font-bold uppercase tracking-widest ml-1 italic">
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
            className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100"
          >
            <div className="flex items-center space-x-4 mb-10">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl shadow-lg shadow-indigo-50">
                <User size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t.settings.authorIdentity}</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{t.settings.publicProfile}</p>
              </div>
            </div>
            
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-black text-gray-900 uppercase tracking-widest mb-3 ml-1">{t.settings.displayName}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-900 uppercase tracking-widest mb-3 ml-1">{t.settings.bio}</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none resize-none transition-all font-medium leading-relaxed text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-900 uppercase tracking-widest mb-3 ml-1">{t.settings.avatarUrl}</label>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                />
              </div>
            </div>
          </motion.section>
        </div>

        <aside className="space-y-8">
          <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200">
            <h3 className="text-lg font-black mb-4 flex items-center italic">
              <AlertTriangle size={20} className="mr-2" /> {t.settings.storageMode}
            </h3>
            <div className="space-y-4 text-xs font-bold leading-relaxed opacity-90">
              <p>{t.settings.storageDesc}</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-50 pb-4">{t.settings.integrity}</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-tight">{t.settings.cloudSync}</span>
                <span className="text-green-500 font-black uppercase tracking-tight flex items-center">
                  <CheckCircle size={12} className="mr-1" /> {t.settings.active}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-tight">{t.settings.apiQuota}</span>
                <span className="text-gray-900 font-black uppercase tracking-tight">5000/hr</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Settings;