import React, { useState } from 'react';
import { Shield, Database, ExternalLink, CheckCircle, AlertTriangle, User, Globe, ChevronRight } from 'lucide-react';
import { GitHubConfig, Profile } from '../types';
import { useAuth, useLanguage } from '../App';
import toast from 'react-hot-toast';

interface SettingsProps {
  config: GitHubConfig | null;
  profile: Profile;
  onSaveConfig: (config: GitHubConfig) => Promise<void>;
  onSaveProfile: (profile: Profile) => Promise<void>;
  onSaveConfigAndProfile: (config: GitHubConfig, profile: Profile) => Promise<void>;
}

type MobileSection = 'storage' | 'profile' | 'site';

const inputBase =
  'w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400/25 dark:focus:ring-slate-500/30 focus:border-slate-400 dark:focus:border-slate-500';

const textareaBase = `${inputBase} resize-none leading-relaxed`;

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 shadow-sm hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 disabled:pointer-events-none transition-colors';

function SaveSpinner() {
  return (
    <div
      className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white dark:border-slate-900 border-t-transparent dark:border-t-transparent"
      aria-hidden
    />
  );
}

const Settings: React.FC<SettingsProps> = ({
  config,
  profile,
  onSaveConfig,
  onSaveProfile,
  onSaveConfigAndProfile: _onSaveConfigAndProfile,
}) => {
  const { t } = useLanguage();
  const { authState, githubBindingStatus } = useAuth();
  const [token, setToken] = useState(config?.token || '');
  const [activeMobileSection, setActiveMobileSection] = useState<MobileSection>('storage');

  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [githubUrl, setGithubUrl] = useState(profile.socials.github || '');

  const [siteName, setSiteName] = useState(profile.siteSettings?.siteName || '');
  const [siteIcon, setSiteIcon] = useState(profile.siteSettings?.siteIcon || '');
  const [siteDescription, setSiteDescription] = useState(profile.siteSettings?.siteDescription || '');

  const [savingConfig, setSavingConfig] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSiteSettings, setSavingSiteSettings] = useState(false);

  const anySaving = savingConfig || savingProfile || savingSiteSettings;

  const handleSaveConfig = async () => {
    if (!token) {
      alert(t.settings.enterToken);
      return;
    }
    if (!config || !config.owner || !config.repo) {
      alert(t.settings.configRequired);
      return;
    }
    setSavingConfig(true);
    try {
      await onSaveConfig({ token, owner: config.owner, repo: config.repo, branch: config.branch || 'data' });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!config?.token) {
      toast.error(t.settings.enterToken);
      return;
    }
    setSavingProfile(true);
    try {
      await onSaveProfile({
        ...profile,
        name,
        bio,
        avatar,
        socials: { ...profile.socials, github: githubUrl },
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveSiteSettings = async () => {
    if (!config?.token) {
      toast.error(t.settings.enterToken);
      return;
    }
    setSavingSiteSettings(true);
    try {
      await onSaveProfile({
        ...profile,
        siteSettings: {
          siteName,
          siteIcon,
          siteDescription,
        },
      });
    } finally {
      setSavingSiteSettings(false);
    }
  };

  const sectionVisibility = (section: MobileSection) =>
    `${activeMobileSection === section ? 'block' : 'hidden'} lg:block`;

  const mobileSaveHandler =
    activeMobileSection === 'storage'
      ? handleSaveConfig
      : activeMobileSection === 'profile'
        ? handleSaveProfile
        : handleSaveSiteSettings;

  const mobileSaving =
    activeMobileSection === 'storage'
      ? savingConfig
      : activeMobileSection === 'profile'
        ? savingProfile
        : savingSiteSettings;

  const mobileSaveLabel =
    activeMobileSection === 'storage'
      ? t.settings.saveToken
      : activeMobileSection === 'profile'
        ? t.settings.saveProfile
        : t.settings.saveSiteSettings;

  return (
    <div className="pb-24 lg:pb-2">
      <div className="mb-6 rounded-lg border border-slate-200/80 bg-slate-50 px-4 py-5 dark:border-slate-700 dark:bg-slate-900/40 sm:px-5">
        <nav className="mb-3 flex flex-wrap items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
          <span>{t.settings.breadcrumbAdmin}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          <span className="font-medium text-slate-700 dark:text-slate-300">{t.settings.breadcrumbSettings}</span>
        </nav>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
          {t.settings.title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">{t.settings.subtitle}</p>
      </div>

      <div
        className="mb-4 flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900 lg:hidden"
        role="tablist"
        aria-label={t.settings.title}
      >
        {(
          [
            { id: 'storage' as const, label: t.settings.tabStorage },
            { id: 'profile' as const, label: t.settings.tabProfile },
            { id: 'site' as const, label: t.settings.tabSite },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeMobileSection === id}
            onClick={() => setActiveMobileSection(id)}
            className={`flex-1 rounded-md px-2 py-2 text-center text-xs font-medium transition-colors sm:text-sm ${
              activeMobileSection === id
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2">
          <div className={sectionVisibility('storage')}>
            <section className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 shadow-sm">
              <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-4 sm:px-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <Database className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {t.settings.dataPersistence}
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{t.settings.gitDatabase}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t.settings.token}
                  </label>
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx"
                    autoComplete="off"
                    className={`${inputBase} font-mono`}
                  />
                  <div className="mt-2 flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                    <span className="flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                      {t.settings.tokenHint}
                    </span>
                    <a
                      href="https://github.com/settings/tokens"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-slate-700 hover:underline dark:text-slate-300"
                    >
                      {t.settings.generateKey}
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  </div>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-600 dark:bg-slate-800/60">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{t.settings.githubBinding}</p>
                    <span
                      className={`text-xs font-medium ${
                        githubBindingStatus === 'bound'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : githubBindingStatus === 'unbound'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {!authState.isUniIdAuthed
                        ? t.settings.githubBindingNeedUniId
                        : githubBindingStatus === 'bound'
                          ? t.settings.githubBindingBound
                          : githubBindingStatus === 'unbound'
                            ? t.settings.githubBindingUnbound
                            : t.settings.githubBindingUnknown}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t.settings.githubBindingHint}</p>
                </div>
              </div>
              <div className="hidden justify-end border-t border-slate-200 bg-slate-50/90 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50 sm:px-5 lg:flex">
                <button type="button" onClick={handleSaveConfig} disabled={anySaving} className={btnPrimary}>
                  {savingConfig ? (
                    <>
                      <SaveSpinner />
                      {t.settings.saving}
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4" aria-hidden />
                      {t.settings.saveToken}
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>

          <div className={sectionVisibility('profile')}>
            <section className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 shadow-sm">
              <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-4 sm:px-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <User className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {t.settings.authorIdentity}
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{t.settings.publicProfile}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t.settings.displayName}
                  </label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputBase} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t.settings.bio}
                  </label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className={textareaBase} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t.settings.avatarUrl}
                  </label>
                  <input type="text" value={avatar} onChange={(e) => setAvatar(e.target.value)} className={inputBase} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">GitHub</label>
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className={inputBase}
                  />
                </div>
              </div>
              <div className="hidden justify-end border-t border-slate-200 bg-slate-50/90 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50 sm:px-5 lg:flex">
                <button type="button" onClick={handleSaveProfile} disabled={anySaving} className={btnPrimary}>
                  {savingProfile ? (
                    <>
                      <SaveSpinner />
                      {t.settings.saving}
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4" aria-hidden />
                      {t.settings.saveProfile}
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>

          <div className={sectionVisibility('site')}>
            <section className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 shadow-sm">
              <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-4 sm:px-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <Globe className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      {t.settings.siteSettings}
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{t.settings.siteSettingsDesc}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t.settings.siteName}
                  </label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="例如：我的个人博客"
                    className={inputBase}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t.settings.siteIcon}
                  </label>
                  <input
                    type="text"
                    value={siteIcon}
                    onChange={(e) => setSiteIcon(e.target.value)}
                    placeholder="https://example.com/favicon.ico"
                    className={inputBase}
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{t.settings.siteIconHint}</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t.settings.siteDescription}
                  </label>
                  <textarea
                    value={siteDescription}
                    onChange={(e) => setSiteDescription(e.target.value)}
                    rows={3}
                    placeholder="例如：分享技术、生活与思考的个人博客"
                    className={textareaBase}
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{t.settings.siteDescriptionHint}</p>
                </div>
              </div>
              <div className="hidden justify-end border-t border-slate-200 bg-slate-50/90 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50 sm:px-5 lg:flex">
                <button type="button" onClick={handleSaveSiteSettings} disabled={anySaving} className={btnPrimary}>
                  {savingSiteSettings ? (
                    <>
                      <SaveSpinner />
                      {t.settings.saving}
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4" aria-hidden />
                      {t.settings.saveSiteSettings}
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800/40 sm:px-5">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
              {t.settings.storageMode}
            </h3>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{t.settings.storageDesc}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/50 sm:px-5">
            <h3 className="mb-3 border-b border-slate-100 pb-2 text-sm font-semibold text-slate-900 dark:border-slate-700 dark:text-slate-100">
              {t.settings.integrity}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">{t.settings.cloudSync}</span>
                <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="h-4 w-4" aria-hidden />
                  {t.settings.active}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 dark:text-slate-400">{t.settings.apiQuota}</span>
                <span className="font-medium tabular-nums text-slate-900 dark:text-slate-100">5000/hr</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95 lg:hidden">
        <button type="button" onClick={mobileSaveHandler} disabled={anySaving} className={`${btnPrimary} w-full`}>
          {mobileSaving ? (
            <>
              <SaveSpinner />
              {t.settings.saving}
            </>
          ) : (
            mobileSaveLabel
          )}
        </button>
      </div>
    </div>
  );
};

export default Settings;
