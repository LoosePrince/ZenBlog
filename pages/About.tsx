import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Twitter, Mail, Heart, Code, Coffee, Sparkles, BookOpen, Palette, Brain, MessageCircle, Copy, Check, Play, Pause, User, Music as MusicIcon, Gamepad2, Briefcase, ChevronDown } from 'lucide-react';
import { Profile } from '../types';
import { useLanguage } from '../App';

interface AboutProps {
  profile: Profile;
}

const About: React.FC<AboutProps> = ({ profile }) => {
  const { t } = useLanguage();
  const [activeSkillTab, setActiveSkillTab] = useState('design');
  const [copiedText, setCopiedText] = useState('');
  
  // 音乐播放器状态
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showMusicInfo, setShowMusicInfo] = useState(false);

  // 兴趣爱好
  const interests = [
    { icon: Palette, label: t.about?.interests_drawing || '绘画', color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20' },
    { icon: Sparkles, label: t.about?.interests_ui || 'UI设计', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { icon: Brain, label: t.about?.interests_ai || 'AI', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { icon: Code, label: t.about?.interests_coding || '编程', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { icon: BookOpen, label: t.about?.interests_reading || '看书', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ];

  // 技能数据
  const skillsData = {
    design: [
      { name: 'UI/UX设计', level: 75, desc: '中专UI设计专业，作品曾参展，熟练使用设计工具' },
      { name: '平面设计', level: 75, desc: '熟悉Photoshop、Illustrator，擅长品牌设计与视觉创意表达' },
      { name: '新媒体运营', level: 60, desc: '有运营支持和新媒体运营工作经验' },
    ],
    programming: [
      { name: '前端开发', level: 90, desc: '熟练掌握HTML、CSS、JavaScript，熟悉Vue、React等前端框架' },
      { name: 'Python', level: 80, desc: '掌握Python数据分析与处理' },
      { name: '后端开发', level: 70, desc: '掌握Node.js、PHP，有全栈开发项目经验' },
      { name: '数据库', level: 70, desc: '掌握MySQL、PostgreSQL等数据库' },
    ],
    other: [
      { name: '项目管理', level: 85, desc: '具备团队组建、扩充经验，项目管理与协调经验，能独挡一面' },
      { name: '写作能力', level: 85, desc: '善于内容创作与技术文档编写，有一定的文字功底' },
      { name: '沟通协作', level: 90, desc: '优秀的团队协作能力，擅长沟通' },
    ],
  };

  // 游戏数据
  const games = [
    { 
      name: '原神', 
      icon: 'https://fastcdn.mihoyo.com/static-resource-v2/2025/03/14/516186272072a512a460c81222aecf1d_2940332403691814685.jpg',
      quote: '原神，启动！'
    },
    { 
      name: '星穹铁道', 
      icon: 'https://fastcdn.mihoyo.com/static-resource-v2/2025/04/08/a765a9750f8b8eac1887de538609a65d_8400545345141782211.png',
      quote: '规则就是用来打破的！'
    },
    { 
      name: '绝区零', 
      icon: 'https://fastcdn.mihoyo.com/static-resource-v2/2025/03/14/09b53fb755412221fedda26863abdfd0_6284584230170612025.png',
      quote: '法厄同降临在空洞。'
    },
    { 
      name: '崩坏三', 
      icon: 'https://fastcdn.mihoyo.com/static-resource-v2/2025/03/14/8a502e85049ca5f539ce3f5e7f03e58e_3747759498074886051.jpg',
      quote: '为世界上所有的美好而战！'
    },
    { 
      name: '月圆之夜', 
      icon: 'https://www.yueyuanzhiye.com/images/v5/logo.png',
      quote: '我的回合！'
    },
    { 
      name: 'Minecraft', 
      icon: 'https://www.minecraft.net/content/dam/minecraftnet/franchise/logos/Homepage_Download-Launcher_Creeper-Logo_500x500.png',
      quote: 'Creeper? Aw man.'
    },
  ];

  // 作品数据
  const works = {
    projects: [
      { 
        title: '游戏服务器官网', 
        desc: '前端开发项目，展示服务器信息和玩家社区。',
        tags: ['前端', 'HTML/CSS'],
        tagColors: ['bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300']
      },
      { 
        title: '博客网站', 
        desc: 'PHP全栈自主开发，支持文章发布和管理功能。',
        tags: ['全栈', 'PHP'],
        tagColors: ['bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300']
      },
      { 
        title: '聊天网站', 
        desc: 'Vue + Node.js 全栈开发，实时聊天功能。',
        tags: ['Vue', 'Node.js'],
        tagColors: ['bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300']
      },
      { 
        title: 'AI文件整理', 
        desc: 'Python开发，使用AI技术进行文件智能分类。',
        tags: ['Python', 'AI'],
        tagColors: ['bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300']
      },
    ],
  };

  // 联系方式
  const contacts = [
    { icon: MessageCircle, label: t.about?.contact_wechat || '微信', value: 'Qr2051134', color: 'text-green-500' },
    { icon: Mail, label: t.about?.contact_qq || 'QQ', value: '1377820366', color: 'text-blue-500' },
    { icon: Github, label: 'GitHub', value: 'LoosePrince', color: 'text-gray-800 dark:text-gray-200' },
    { icon: Mail, label: t.about?.contact_email || '邮箱', value: '1377820366@qq.com', color: 'text-red-500' },
  ];

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
      {/* 隐藏的音频元素 */}
      <audio 
        ref={audioRef} 
        src="https://music.163.com/song/media/outer/url?id=2612489941.mp3"
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

            <div className="prose dark:prose-invert max-w-none mb-8">
              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                {t.about?.intro_text1 || '我热爱任何有趣的事物。'}
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

            <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
              {['design', 'programming', 'other'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveSkillTab(tab)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                    activeSkillTab === tab
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {tab === 'design' && (t.about?.tab_design || '设计')}
                  {tab === 'programming' && (t.about?.tab_programming || '编程')}
                  {tab === 'other' && (t.about?.tab_other || '其他')}
                </button>
              ))}
            </div>

            <div className="space-y-5">
              {skillsData[activeSkillTab as keyof typeof skillsData].map((skill, index) => (
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
              ))}
            </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {works.projects.map((work, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -4 }}
                  className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all"
                >
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{work.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{work.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {work.tags.map((tag, i) => (
                      <span key={i} className={`text-[10px] px-2 py-1 rounded-md font-bold ${work.tagColors[i] || 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
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
            
            <div className="mb-6">
              <h3 className="text-xl font-black mb-1">明天你好</h3>
              <p className="text-indigo-200 text-sm font-medium">SER - 钢琴独奏版</p>
            </div>

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
                        {t.about?.music_story1 || '这首歌是我在5年级的时候听的，当时我还在上小学，这首歌的旋律和歌词在那时让我产生了一种很奇妙的感觉。'}
                      </p>
                      <p className="text-xs text-indigo-100/90 leading-relaxed font-medium">
                        {t.about?.music_story2 || '那种感觉我到现在也无法忘却，因为网易云没有我喜欢的版本，所以在此推荐的是钢琴的纯音乐版。'}
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
            <div className="grid grid-cols-3 gap-3">
              {games.map((game, index) => (
                <div key={index} className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-gray-100 dark:bg-gray-700">
                  <img src={game.icon} alt={game.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                    <p className="text-[10px] text-white font-bold text-center line-clamp-3">{game.quote}</p>
                  </div>
                </div>
              ))}
            </div>
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