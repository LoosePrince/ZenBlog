import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Twitter, Mail, Heart, Code, Coffee, Sparkles, BookOpen, Palette, Brain, MessageCircle, Copy, Check, Play, Pause, User, Music as MusicIcon, Gamepad2, Briefcase, ChevronDown, Edit3, Save, X, Plus, Trash2 } from 'lucide-react';
import { Profile, Interest, SkillCategory, Work, Music, Contact, Game } from '../types';
import { useLanguage } from '../App';
import { toast } from 'react-hot-toast';

interface AboutProps {
  profile: Profile;
  isAdmin?: boolean;
  onSave?: (profile: Profile) => Promise<void>;
}

// 图标映射表
const iconMap: { [key: string]: any } = {
  Palette, Sparkles, Brain, Code, BookOpen, Github, Twitter, Mail, MessageCircle
};

// 模板示例（用于首次使用/未配置时的默认值）
const TEMPLATE_INTRO =
  '这里是一段「关于我」的简介模板示例：你可以写你是谁、做什么、擅长什么，以及你希望访客从这里获得什么。';

const TEMPLATE_INTERESTS: Interest[] = [
  { name: '绘画', icon: 'Palette', color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  { name: 'UI 设计', icon: 'Sparkles', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { name: '编程', icon: 'Code', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
];

const TEMPLATE_SKILLS: SkillCategory = {
  design: [
    { name: 'UI/UX 设计', level: 70, desc: '示例：熟悉 Figma / Sketch，能独立完成界面与交互设计。' },
  ],
  programming: [
    { name: '前端开发', level: 75, desc: '示例：熟悉 React / TypeScript / Tailwind，能完成中小型项目。' },
  ],
  other: [
    { name: '沟通协作', level: 80, desc: '示例：能推进协作与交付，对需求与细节保持敏感。' },
  ],
};

const TEMPLATE_SKILL_CATEGORY_LABELS: { [key: string]: string } = {
  design: '设计',
  programming: '开发',
  other: '其他',
};

const TEMPLATE_WORKS: Work[] = [
  { title: '示例项目名称', desc: '示例：用一句话介绍这个项目做什么、解决什么问题。', tags: ['React', 'TypeScript'] },
];

// 音乐：仅说明改为示例（名称/副标题/链接仍保留原来的演示值）
const TEMPLATE_MUSIC_DESCRIPTION =
  '示例：写下你为什么喜欢这首歌、它对你的意义、或想对访客说的话（支持长文本）。';

const TEMPLATE_CONTACTS: Contact[] = [
  { type: 'wechat', label: '微信', value: '填写你的微信号/ID' },
  { type: 'email', label: '邮箱', value: 'you@example.com' },
  { type: 'github', label: 'GitHub', value: 'yourname' },
];

// 游戏：保留 1 条作为参考
const TEMPLATE_GAMES: Game[] = [
  {
    name: 'Minecraft',
    icon: 'https://www.minecraft.net/content/dam/minecraftnet/franchise/logos/Homepage_Download-Launcher_Creeper-Logo_500x500.png',
    quote: '示例：一句你想写的短描述',
    about: '示例：关于这个游戏的详细介绍...',
  },
];

const About: React.FC<AboutProps> = ({ profile, isAdmin = false, onSave }) => {
  const { t } = useLanguage();
  const [activeSkillTab, setActiveSkillTab] = useState<string>('design');
  const [copiedText, setCopiedText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // 技能分类标签（可自定义）
  const [skillCategoryLabels, setSkillCategoryLabels] = useState<{ [key: string]: string }>(
    profile.about?.skillCategoryLabels ?? TEMPLATE_SKILL_CATEGORY_LABELS
  );
  
  // 音乐播放器状态
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showMusicInfo, setShowMusicInfo] = useState(false);

  // 编辑状态数据
  const [editIntro, setEditIntro] = useState(profile.about?.intro ?? TEMPLATE_INTRO);
  const [editInterests, setEditInterests] = useState<Interest[]>(
    profile.about?.interests ?? TEMPLATE_INTERESTS
  );
  const [editSkills, setEditSkills] = useState<SkillCategory>(
    profile.about?.skills ?? TEMPLATE_SKILLS
  );
  const [editWorks, setEditWorks] = useState<Work[]>(
    profile.about?.works ?? TEMPLATE_WORKS
  );
  const [editMusic, setEditMusic] = useState<Music>(
    profile.about?.music || {
      name: '明天你好',
      subtitle: 'SER - 钢琴独奏版',
      url: 'https://music.163.com/song/media/outer/url?id=2612489941.mp3',
      description: TEMPLATE_MUSIC_DESCRIPTION
    }
  );
  const [editContacts, setEditContacts] = useState<Contact[]>(
    profile.about?.contacts ?? TEMPLATE_CONTACTS
  );
  const [editGames, setEditGames] = useState<Game[]>(
    profile.about?.games ?? TEMPLATE_GAMES
  );
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showGameModal, setShowGameModal] = useState(false);

  // 当profile更新时，同步编辑状态
  useEffect(() => {
    if (profile.about) {
      setEditIntro(profile.about.intro ?? TEMPLATE_INTRO);
      setEditInterests(profile.about.interests ?? TEMPLATE_INTERESTS);
      const skills = profile.about.skills || {};
      setEditSkills(skills);
      setEditWorks(profile.about.works ?? TEMPLATE_WORKS);
      setEditMusic(profile.about.music || {
        name: '明天你好',
        subtitle: 'SER - 钢琴独奏版',
        url: 'https://music.163.com/song/media/outer/url?id=2612489941.mp3',
        description: TEMPLATE_MUSIC_DESCRIPTION
      });
      setEditContacts(profile.about.contacts ?? TEMPLATE_CONTACTS);
      setEditGames(profile.about.games ?? TEMPLATE_GAMES);
      
      // 同步技能分类标签，确保所有分类都有标签
      const defaultLabels: { [key: string]: string } = TEMPLATE_SKILL_CATEGORY_LABELS;
      const savedLabels = profile.about.skillCategoryLabels || {};
      const mergedLabels: { [key: string]: string } = { ...defaultLabels, ...savedLabels };
      // 确保所有现有分类都有标签
      Object.keys(skills).forEach(key => {
        if (!mergedLabels[key]) {
          mergedLabels[key] = key;
        }
      });
      setSkillCategoryLabels(mergedLabels);
      
      // 设置默认激活的标签为第一个分类
      const firstCategory = Object.keys(skills)[0] || 'design';
      setActiveSkillTab(firstCategory);
    }
  }, [profile.about, t.about]);

  // 从编辑状态读取数据用于显示
  const interests = editInterests.map(interest => ({
    icon: iconMap[interest.icon] || Palette,
    label: interest.name,
    color: interest.color,
    bg: interest.bg
  }));

  const skillsData = editSkills;
  const games = editGames;
  const works = { projects: editWorks };
  
  const contacts = editContacts.map(contact => {
    let icon = MessageCircle;
    let color = 'text-gray-500';
    if (contact.type === 'wechat') { icon = MessageCircle; color = 'text-green-500'; }
    else if (contact.type === 'qq') { icon = Mail; color = 'text-blue-500'; }
    else if (contact.type === 'github') { icon = Github; color = 'text-gray-800 dark:text-gray-200'; }
    else if (contact.type === 'email') { icon = Mail; color = 'text-red-500'; }
    else if (contact.type === 'twitter') { icon = Twitter; color = 'text-blue-400'; }
    return { icon, label: contact.label, value: contact.value, color };
  });

  // 保存函数
  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      const updatedProfile: Profile = {
        ...profile,
        about: {
          intro: editIntro,
          interests: editInterests,
          skills: editSkills,
          skillCategoryLabels: skillCategoryLabels,
          works: editWorks,
          music: editMusic,
          contacts: editContacts,
          games: editGames,
        }
      };
      await onSave(updatedProfile);
      setIsEditing(false);
      toast.success(t.about?.saveSuccess || '保存成功！');
    } catch (err: any) {
      toast.error(`${t.about?.saveError || '保存失败'}: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };
  
  // 添加新分类
  const handleAddCategory = () => {
    const newCategoryKey = `category_${Date.now()}`;
    const updatedSkills = { ...editSkills };
    updatedSkills[newCategoryKey] = [];
    setEditSkills(updatedSkills);
    const updatedLabels = { ...skillCategoryLabels };
    updatedLabels[newCategoryKey] = '新分类';
    setSkillCategoryLabels(updatedLabels);
    setActiveSkillTab(newCategoryKey);
  };
  
  // 删除分类
  const handleDeleteCategory = (categoryKey: string) => {
    if (Object.keys(editSkills).length <= 1) {
      toast.error(t.about?.atLeastOneCategory || '至少需要保留一个分类');
      return;
    }
    const updatedSkills = { ...editSkills };
    delete updatedSkills[categoryKey];
    setEditSkills(updatedSkills);
    const updatedLabels = { ...skillCategoryLabels };
    delete updatedLabels[categoryKey];
    setSkillCategoryLabels(updatedLabels);
    // 切换到第一个分类
    const firstCategory = Object.keys(updatedSkills)[0];
    setActiveSkillTab(firstCategory);
  };
  
  // 重命名分类
  const handleRenameCategory = (categoryKey: string, newName: string) => {
    const updatedLabels = { ...skillCategoryLabels };
    updatedLabels[categoryKey] = newName;
    setSkillCategoryLabels(updatedLabels);
  };

  // 更新音频源
  useEffect(() => {
    if (audioRef.current && editMusic.url) {
      audioRef.current.src = editMusic.url;
    }
  }, [editMusic.url]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2000);
  };

  // 音乐播放器功能
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      if (!isDragging) {
        setCurrentTime(audio.currentTime);
      }
    };

    const updateDuration = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [isDragging]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(error => {
        console.error('播放出错:', error);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * duration;
    setCurrentTime(percent * duration);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-10 pb-20">
      {/* 编辑按钮 - 固定在顶部，避免遮挡导航栏 */}
      {isAdmin && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`sticky top-20 z-40 mb-6 ${isEditing ? 'bg-indigo-50/80 dark:bg-indigo-900/40 backdrop-blur-md border-2 border-indigo-200/50 dark:border-indigo-800/50 rounded-2xl p-4 shadow-lg' : ''}`}
        >
          {!isEditing ? (
            <div className="flex justify-end">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <Edit3 size={18} className="mr-2" />
                {t.about?.editAbout || '编辑关于页面'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{t.about?.editMode || '编辑模式'}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center justify-center px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow active:scale-95"
                >
                  <X size={18} className="mr-2" />
                  {t.about?.cancel || t.common.cancel}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {t.about?.saving || '保存中...'}
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      {t.about?.saveChanges || '保存更改'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* 隐藏的音频元素 */}
      <audio 
        ref={audioRef} 
        src={editMusic.url}
        loop
      />
      
      {/* Hero Section - 顶部欢迎区 */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-12 md:py-16 px-6 md:px-10 bg-white dark:bg-gray-800 rounded-3xl md:rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-pink-50 dark:bg-pink-900/20 rounded-full blur-[100px] opacity-60 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-[80px] opacity-40"></div>
        
        <div className="relative flex flex-col md:flex-row items-center space-y-8 md:space-y-0 md:space-x-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative flex-shrink-0"
          >
            <div className="absolute inset-0 bg-indigo-200 dark:bg-indigo-700 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <img 
              src={profile.avatar} 
              alt={profile.name}
              className="relative w-32 h-32 md:w-40 md:h-40 rounded-[2rem] border-4 border-white dark:border-gray-700 shadow-2xl object-cover transform -rotate-3 hover:rotate-0 transition-transform duration-500"
            />
          </motion.div>
          
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 dark:text-gray-100 mb-4 tracking-tight">
              {t.about?.welcome || '客官，里面请'} <span className="inline-block animate-bounce">👋</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 mb-6 font-medium max-w-2xl">
              {t.about?.iam || '我是'} <span className="text-indigo-600 dark:text-indigo-400 font-bold">{profile.name}</span>。
              {profile.bio}
            </p>
            <div className="w-16 h-1 bg-gradient-to-r from-pink-500 to-indigo-500 rounded-full mx-auto md:mx-0"></div>
          </div>
        </div>
      </motion.section>

      {/* 主内容网格 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* 左侧主要内容区域 (2/3) */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          
          {/* 个人简介 + 兴趣 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <User size={24} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">{t.about?.intro || '简介'}</h2>
            </div>

            {isEditing ? (
              <div className="space-y-8">
                {/* 简介编辑 */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t.about?.introLabel || '简介'}</label>
                  <textarea
                    value={editIntro}
                    onChange={(e) => setEditIntro(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                    placeholder={t.about?.introPlaceholder || '输入个人简介...'}
                  />
                </div>

                {/* 兴趣与技能编辑 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t.about?.interestsLabel || '兴趣与技能'}</label>
                    <button
                      onClick={() => setEditInterests([...editInterests, { name: '', icon: 'Palette', color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20' }])}
                      className="flex items-center px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all active:scale-95"
                    >
                      <Plus size={14} className="mr-1" />
                      {t.about?.addInterest || '添加'}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {editInterests.map((interest, index) => (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{t.about?.interestName || '技能名称'}</label>
                            <input
                              type="text"
                              value={interest.name}
                              onChange={(e) => {
                                const updated = [...editInterests];
                                updated[index].name = e.target.value;
                                setEditInterests(updated);
                              }}
                              placeholder="例如：绘画"
                              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{t.about?.interestIcon || '图标名'}</label>
                            <input
                              type="text"
                              value={interest.icon}
                              onChange={(e) => {
                                const updated = [...editInterests];
                                updated[index].icon = e.target.value;
                                setEditInterests(updated);
                              }}
                              placeholder="例如：Palette"
                              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{t.about?.interestColor || '颜色类'}</label>
                            <input
                              type="text"
                              value={interest.color}
                              onChange={(e) => {
                                const updated = [...editInterests];
                                updated[index].color = e.target.value;
                                setEditInterests(updated);
                              }}
                              placeholder="例如：text-pink-600"
                              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{t.about?.interestBg || '背景类'}</label>
                            <input
                              type="text"
                              value={interest.bg}
                              onChange={(e) => {
                                const updated = [...editInterests];
                                updated[index].bg = e.target.value;
                                setEditInterests(updated);
                              }}
                              placeholder="例如：bg-pink-50 dark:bg-pink-900/20"
                              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() => setEditInterests(editInterests.filter((_, i) => i !== index))}
                            className="flex items-center px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all active:scale-95"
                          >
                            <Trash2 size={16} className="mr-1.5" />
                            <span className="text-xs font-semibold">{t.about?.delete || t.common.delete}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                    {editInterests.length === 0 && (
                      <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                        {t.about?.noInterests || '暂无兴趣与技能，点击上方"添加"按钮添加'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="prose dark:prose-invert max-w-none mb-8">
                  <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                    {editIntro}
                  </p>
                </div>
                
                <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">{t.about?.interests || '兴趣'}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {interests.map((interest, index) => {
                    const Icon = interest.icon;
                    return (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl ${interest.bg} transition-colors`}
                      >
                        <Icon size={24} className={`mb-2 ${interest.color}`} />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{interest.label}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </motion.section>

          {/* 专业技能 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                <Brain size={24} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">{t.about?.skills || '技能'}</h2>
            </div>

            {isEditing ? (
              <div className="space-y-8">
                {/* 分类管理 */}
                <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">{t.about?.skillCategoryManagement || '技能分类管理'}</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.about?.skillCategoryDesc || '管理技能分类，可以添加、重命名或删除分类'}</p>
                    </div>
                    <button
                      onClick={handleAddCategory}
                      className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-md hover:shadow-lg whitespace-nowrap"
                    >
                      <Plus size={16} className="mr-1.5" />
                      {t.about?.addCategory || '添加分类'}
                    </button>
                  </div>
                  {Object.keys(editSkills).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.keys(editSkills).map((categoryKey) => (
                        <div key={categoryKey} className="group p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-sm hover:shadow-md">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{t.about?.categoryName || '分类名称'}</label>
                              <input
                                type="text"
                                value={skillCategoryLabels[categoryKey] || categoryKey}
                                onChange={(e) => handleRenameCategory(categoryKey, e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder={t.about?.categoryName || '输入分类名称...'}
                              />
                              <p className="mt-1.5 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                                {t.about?.skillCount || '技能数量'}: {editSkills[categoryKey]?.length || 0}
                              </p>
                            </div>
                            {Object.keys(editSkills).length > 1 && (
                              <button
                                onClick={() => handleDeleteCategory(categoryKey)}
                                className="flex-shrink-0 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all active:scale-95 group-hover:opacity-100 opacity-70"
                                title={t.about?.deleteCategory || '删除此分类'}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                      <p>{t.about?.noCategories || '暂无分类，点击上方"添加分类"按钮添加'}</p>
                    </div>
                  )}
                </div>
                
                {/* 各分类的技能编辑 */}
                {Object.keys(editSkills).map((category) => {
                  return (
                    <div key={category} className="p-4 bg-gray-50 dark:bg-gray-700/30 border-2 border-gray-200 dark:border-gray-600 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{skillCategoryLabels[category] || category}</label>
                        <button
                          onClick={() => {
                            const updated = { ...editSkills };
                            if (!updated[category]) updated[category] = [];
                            updated[category] = [...updated[category], { name: '', level: 50, desc: '' }];
                            setEditSkills(updated);
                          }}
                          className="flex items-center px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all active:scale-95"
                        >
                          <Plus size={14} className="mr-1" />
                          {t.about?.addSkill || '添加技能'}
                        </button>
                      </div>
                      <div className="space-y-3">
                        {(editSkills[category] || []).map((skill, index) => (
                        <div key={index} className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px] gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{t.about?.skillName || '技能名称'}</label>
                              <input
                                type="text"
                                value={skill.name}
                                onChange={(e) => {
                                  const updated = { ...editSkills };
                                  updated[category][index].name = e.target.value;
                                  setEditSkills(updated);
                                }}
                                placeholder="例如：UI/UX设计"
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{t.about?.skillLevel || '进度 (%)'}</label>
                              <input
                                type="number"
                                value={skill.level}
                                onChange={(e) => {
                                  const updated = { ...editSkills };
                                  updated[category][index].level = parseInt(e.target.value) || 0;
                                  setEditSkills(updated);
                                }}
                                min="0"
                                max="100"
                                placeholder="0-100"
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{t.about?.skillDesc || '技能描述'}</label>
                            <textarea
                              value={skill.desc}
                              onChange={(e) => {
                                const updated = { ...editSkills };
                                updated[category][index].desc = e.target.value;
                                setEditSkills(updated);
                              }}
                              placeholder={t.about?.skillDescPlaceholder || '输入技能描述...'}
                              rows={2}
                              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={() => {
                                const updated = { ...editSkills };
                                updated[category] = updated[category].filter((_, i) => i !== index);
                                setEditSkills(updated);
                              }}
                              className="flex items-center px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all active:scale-95"
                            >
                              <Trash2 size={16} className="mr-1.5" />
                              <span className="text-xs font-semibold">{t.about?.delete || t.common.delete}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                      </div>
                      {(!editSkills[category] || editSkills[category].length === 0) && (
                        <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
                          {t.about?.noSkills || '暂无技能，点击上方"添加技能"按钮添加'}
                        </div>
                      )}
                    </div>
                );
                })}
              </div>
            ) : (
              <>
                <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                  {Object.keys(skillsData).map((tab) => {
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveSkillTab(tab)}
                        className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                          activeSkillTab === tab
                            ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {skillCategoryLabels[tab] || tab}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-5">
                  {(skillsData[activeSkillTab as keyof typeof skillsData] || []).length > 0 ? (
                    (skillsData[activeSkillTab as keyof typeof skillsData] || []).map((skill, index) => (
                      <div key={index} className="group">
                        <div className="flex justify-between mb-1.5">
                          <span className="font-bold text-gray-800 dark:text-gray-200">{skill.name}</span>
                          <span className="text-sm font-bold text-gray-400">{skill.level}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${skill.level}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="h-full bg-indigo-500 rounded-full"
                          ></motion.div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{skill.desc}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">暂无技能数据</p>
                  )}
                </div>
              </>
            )}
          </motion.section>

          {/* 作品展示 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl">
                <Briefcase size={24} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">{t.about?.works || '作品'}</h2>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => setEditWorks([...editWorks, { title: '', desc: '', tags: [] }])}
                    className="flex items-center px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all active:scale-95"
                  >
                    <Plus size={14} className="mr-1" />
                    {t.about?.addWork || '添加作品'}
                  </button>
                </div>
                {editWorks.map((work, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl space-y-3">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{t.about?.workTitle || '项目名称'}</label>
                        <input
                          type="text"
                          value={work.title}
                          onChange={(e) => {
                            const updated = [...editWorks];
                            updated[index].title = e.target.value;
                            setEditWorks(updated);
                          }}
                          placeholder="例如：游戏服务器官网"
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{t.about?.workDesc || '项目简介'}</label>
                        <textarea
                          value={work.desc}
                          onChange={(e) => {
                            const updated = [...editWorks];
                            updated[index].desc = e.target.value;
                            setEditWorks(updated);
                          }}
                          placeholder="输入项目简介..."
                          rows={3}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{t.about?.workTags || '标签（用逗号分隔）'}</label>
                        <input
                          type="text"
                          value={work.tags.join(', ')}
                          onChange={(e) => {
                            const updated = [...editWorks];
                            updated[index].tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                            setEditWorks(updated);
                          }}
                          placeholder="例如：前端, HTML/CSS"
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => setEditWorks(editWorks.filter((_, i) => i !== index))}
                        className="flex items-center px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all active:scale-95"
                      >
                        <Trash2 size={16} className="mr-1.5" />
                        <span className="text-xs font-semibold">{t.about?.delete || t.common.delete}</span>
                      </button>
                    </div>
                  </div>
                ))}
                {editWorks.length === 0 && (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                    {t.about?.noWorks || '暂无作品，点击上方"添加作品"按钮添加'}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {works.projects.map((work, index) => {
                  const tagColors = [
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                  ];
                  return (
                    <motion.div
                      key={index}
                      whileHover={{ y: -4 }}
                      className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all"
                    >
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{work.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{work.desc}</p>
                      <div className="flex flex-wrap gap-2">
                        {work.tags.map((tag, i) => (
                          <span key={i} className={`text-[10px] px-2 py-1 rounded-md font-bold ${tagColors[i % tagColors.length] || 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.section>

        </div>

        {/* 右侧侧边栏 (1/3) */}
        <aside className="space-y-6 md:space-y-8">
          
          {/* 音乐播放器 Widget */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl text-white shadow-lg shadow-indigo-500/20"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <MusicIcon size={20} className="text-indigo-200" />
                <span className="font-bold text-sm tracking-widest uppercase text-indigo-100">{t.about?.now_playing || 'Now Playing'}</span>
              </div>
              <div className="flex items-end space-x-1 h-4">
                {[1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    animate={isPlaying ? { 
                      height: [4, 16, 8, 14, 4],
                    } : { height: 4 }}
                    transition={isPlaying ? {
                      repeat: Infinity,
                      duration: 0.6 + i * 0.1,
                      ease: "easeInOut"
                    } : { duration: 0.3 }}
                    className="w-1 bg-white/40 rounded-full"
                  />
                ))}
              </div>
            </div>
            
            {isEditing ? (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-indigo-200 mb-1.5">{t.about?.musicName || '音乐名称'}</label>
                  <input
                    type="text"
                    value={editMusic.name}
                    onChange={(e) => setEditMusic({ ...editMusic, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/40 outline-none transition-all"
                    placeholder="例如：明天你好"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-indigo-200 mb-1.5">{t.about?.musicSubtitle || '副标题'}</label>
                  <input
                    type="text"
                    value={editMusic.subtitle}
                    onChange={(e) => setEditMusic({ ...editMusic, subtitle: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/40 outline-none transition-all"
                    placeholder="例如：SER - 钢琴独奏版"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-indigo-200 mb-1.5">{t.about?.musicUrl || '音乐链接'}</label>
                  <input
                    type="text"
                    value={editMusic.url}
                    onChange={(e) => setEditMusic({ ...editMusic, url: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/40 outline-none text-sm transition-all"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-indigo-200 mb-1.5">{t.about?.musicDesc || '说明'}</label>
                  <textarea
                    value={editMusic.description}
                    onChange={(e) => setEditMusic({ ...editMusic, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 bg-white/10 border-2 border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/50 focus:border-white/40 outline-none text-sm resize-none transition-all"
                    placeholder={t.about?.musicDescPlaceholder || '输入关于这首歌的故事...'}
                  />
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <h3 className="text-xl font-black mb-1">{editMusic.name}</h3>
                <p className="text-indigo-200 text-sm font-medium">{editMusic.subtitle}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <button 
                onClick={togglePlay}
                className="w-12 h-12 bg-white text-indigo-600 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-md"
              >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
              </button>
              
              <div className="flex-1 ml-4 relative h-1 bg-indigo-900/30 rounded-full cursor-pointer" onClick={handleProgressClick}>
                <div 
                  className="absolute h-full bg-white/80 rounded-full" 
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* 音乐背后的故事 */}
            <div className="mt-6 border-t border-white/10 pt-4">
              <button 
                onClick={() => setShowMusicInfo(!showMusicInfo)}
                className="flex items-center text-[10px] font-bold text-indigo-200 hover:text-white transition-colors uppercase tracking-widest"
              >
                <span className="mr-1">{showMusicInfo ? (t.about?.hide_story || '收起') : (t.about?.music_about || '关于这首歌')}</span>
                <ChevronDown size={14} className={`transform transition-transform duration-300 ${showMusicInfo ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {showMusicInfo && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 space-y-2">
                      <p className="text-xs text-indigo-100/90 leading-relaxed font-medium">
                        {editMusic.description}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* 联系方式 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-5 flex items-center">
              <MessageCircle size={20} className="mr-2 text-indigo-500" />
              {t.about?.contact || '联系我'}
            </h3>
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button
                    onClick={() => setEditContacts([...editContacts, { type: 'wechat', label: '', value: '' }])}
                    className="flex items-center px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all active:scale-95"
                  >
                    <Plus size={14} className="mr-1" />
                    {t.about?.addContact || '添加联系方式'}
                  </button>
                </div>
                {editContacts.map((contact, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{t.about?.contactType || '类型'}</label>
                        <select
                          value={contact.type}
                          onChange={(e) => {
                            const updated = [...editContacts];
                            updated[index].type = e.target.value;
                            setEditContacts(updated);
                          }}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        >
                          <option value="wechat">{t.about?.contact_wechat || '微信'}</option>
                          <option value="qq">{t.about?.contact_qq || 'QQ'}</option>
                          <option value="github">GitHub</option>
                          <option value="email">{t.about?.contact_email || '邮箱'}</option>
                          <option value="twitter">Twitter</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{t.about?.contactLabel || '标签'}</label>
                        <input
                          type="text"
                          value={contact.label}
                          onChange={(e) => {
                            const updated = [...editContacts];
                            updated[index].label = e.target.value;
                            setEditContacts(updated);
                          }}
                          placeholder="例如：微信"
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{t.about?.contactValue || '内容'}</label>
                      <input
                        type="text"
                        value={contact.value}
                        onChange={(e) => {
                          const updated = [...editContacts];
                          updated[index].value = e.target.value;
                          setEditContacts(updated);
                        }}
                        placeholder="例如：Qr2051134"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => setEditContacts(editContacts.filter((_, i) => i !== index))}
                        className="flex items-center px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all active:scale-95"
                      >
                        <Trash2 size={16} className="mr-1.5" />
                        <span className="text-xs font-semibold">{t.about?.delete || t.common.delete}</span>
                      </button>
                    </div>
                  </div>
                ))}
                {editContacts.length === 0 && (
                  <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
                    {t.about?.noContacts || '暂无联系方式，点击上方"添加联系方式"按钮添加'}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {contacts.map((contact, index) => {
                  const Icon = contact.icon;
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl group">
                      <div className="flex items-center space-x-3">
                        <Icon size={18} className={contact.color} />
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{contact.label}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(contact.value)}
                        className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title={contact.value}
                      >
                        {copiedText === contact.value ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* 游戏卡片 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-5 flex items-center">
              <Gamepad2 size={20} className="mr-2 text-purple-500" />
              {t.about?.games || '在玩游戏'}
            </h3>
            {isEditing ? (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => setEditGames([...editGames, { name: '', icon: '', quote: '', about: '' }])}
                    className="flex items-center px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all active:scale-95"
                  >
                    <Plus size={14} className="mr-1" />
                    {t.about?.addGame || '添加游戏'}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {editGames.map((game, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl space-y-3">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{t.about?.gameName || '游戏名称'}</label>
                          <input
                            type="text"
                            value={game.name}
                            onChange={(e) => {
                              const updated = [...editGames];
                              updated[index].name = e.target.value;
                              setEditGames(updated);
                            }}
                            placeholder="例如：原神"
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{t.about?.gameIcon || '图标链接'}</label>
                          <input
                            type="text"
                            value={game.icon}
                            onChange={(e) => {
                              const updated = [...editGames];
                              updated[index].icon = e.target.value;
                              setEditGames(updated);
                            }}
                            placeholder="https://..."
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{t.about?.gameQuote || '描述'}</label>
                          <textarea
                            value={game.quote}
                            onChange={(e) => {
                              const updated = [...editGames];
                              updated[index].quote = e.target.value;
                              setEditGames(updated);
                            }}
                            placeholder={t.about?.gameQuotePlaceholder || '输入游戏描述...'}
                            rows={2}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{t.about?.gameAbout || '关于'}</label>
                          <textarea
                            value={game.about || ''}
                            onChange={(e) => {
                              const updated = [...editGames];
                              updated[index].about = e.target.value;
                              setEditGames(updated);
                            }}
                            placeholder={t.about?.gameAboutPlaceholder || '输入关于这个游戏的详细介绍...'}
                            rows={4}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => setEditGames(editGames.filter((_, i) => i !== index))}
                          className="flex items-center px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all active:scale-95"
                        >
                          <Trash2 size={16} className="mr-1.5" />
                          <span className="text-xs font-semibold">{t.about?.delete || t.common.delete}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {editGames.length === 0 && (
                  <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
                    {t.about?.noGames || '暂无游戏，点击上方"添加游戏"按钮添加'}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {games.map((game, index) => (
                    <div 
                      key={index} 
                      onClick={() => {
                        setSelectedGame(game);
                        setShowGameModal(true);
                      }}
                      className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-gray-100 dark:bg-gray-700"
                    >
                      <img src={game.icon} alt={game.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                        <p className="text-sm text-white font-bold text-center">{game.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* 游戏详情模态窗 */}
                <AnimatePresence>
                  {showGameModal && selectedGame && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                      onClick={() => setShowGameModal(false)}
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                      >
                        {/* 模态窗头部 */}
                        <div className="relative p-6 border-b border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => setShowGameModal(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                          >
                            <X size={20} />
                          </button>
                          <div className="flex items-center space-x-4">
                            <img 
                              src={selectedGame.icon} 
                              alt={selectedGame.name}
                              className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200 dark:border-gray-700"
                            />
                            <div>
                              <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100">
                                {selectedGame.name}
                              </h3>
                            </div>
                          </div>
                        </div>
                        
                        {/* 模态窗内容 */}
                        <div className="p-6 overflow-y-auto flex-1">
                          {selectedGame.quote && (
                            <div className="mb-6">
                              <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                                {t.about?.gameQuote || '描述'}
                              </h4>
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {selectedGame.quote}
                              </p>
                            </div>
                          )}
                          {selectedGame.about && (
                            <div>
                              <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                                {t.about?.gameAbout || '关于'}
                              </h4>
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {selectedGame.about}
                              </p>
                            </div>
                          )}
                          {!selectedGame.quote && !selectedGame.about && (
                            <p className="text-gray-400 dark:text-gray-500 text-center py-8">
                              {t.about?.noGameInfo || '暂无详细信息'}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>

          {/* 技术栈 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900 dark:bg-black p-6 rounded-3xl text-white shadow-lg"
          >
            <div className="flex items-center justify-center mb-4 text-indigo-400">
              <Code size={24} />
            </div>
            <h3 className="text-center font-black text-lg mb-4">{t.about?.poweredBy || '本站技术栈'}</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {['React', 'Vite', 'TS', 'Tailwind', 'Github'].map((tech) => (
                <span key={tech} className="px-3 py-1 bg-gray-800 rounded-lg text-xs font-bold text-gray-300 border border-gray-700">
                  {tech}
                </span>
              ))}
            </div>
            <p className="text-center text-xs text-gray-500 mt-6">
              &copy; {new Date().getFullYear()} {profile.name}
            </p>
          </motion.div>

        </aside>
      </div>
    </div>
  );
};

export default About;