import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Github, Twitter, Mail, Heart, Code, Coffee, Sparkles, BookOpen, Zap, Palette, Brain, Briefcase, Users, MessageCircle, Award, Calendar, ExternalLink, Copy, Check, Play, Pause, Music } from 'lucide-react';
import { Profile } from '../types';
import { useLanguage } from '../App';

interface AboutProps {
  profile: Profile;
}

const About: React.FC<AboutProps> = ({ profile }) => {
  const { t } = useLanguage();
  const [activeSkillTab, setActiveSkillTab] = useState('design');
  const [activeWorkTab, setActiveWorkTab] = useState('projects');
  const [copiedText, setCopiedText] = useState('');
  
  // 音乐播放器状态
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // 兴趣爱好
  const interests = [
    { icon: Palette, label: t.about?.interests_drawing || '绘画', color: 'text-pink-600', bg: 'bg-pink-50' },
    { icon: Sparkles, label: t.about?.interests_ui || 'UI设计', color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: Brain, label: t.about?.interests_ai || 'AI', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Code, label: t.about?.interests_coding || '编程', color: 'text-green-600', bg: 'bg-green-50' },
    { icon: BookOpen, label: t.about?.interests_reading || '看书', color: 'text-amber-600', bg: 'bg-amber-50' },
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
      desc: '众所周知，原神是一款有米哈游研发的大世界开放游戏...',
      quote: '原神，启动！'
    },
    { 
      name: '崩坏：星穹铁道', 
      icon: 'https://fastcdn.mihoyo.com/static-resource-v2/2025/04/08/a765a9750f8b8eac1887de538609a65d_8400545345141782211.png',
      desc: '在玩它之前我还真没觉得回合制那么好玩',
      quote: '你有权保持沉默，但你所说的每一句话都有可能被改编进 崩坏：星穹铁道 ！'
    },
    { 
      name: '绝区零', 
      icon: 'https://fastcdn.mihoyo.com/static-resource-v2/2025/03/14/09b53fb755412221fedda26863abdfd0_6284584230170612025.png',
      desc: '我菜啊，打不过啊',
      quote: '法厄同啊，法厄同~ 降临在空洞。'
    },
    { 
      name: '崩坏三', 
      icon: 'https://fastcdn.mihoyo.com/static-resource-v2/2025/03/14/8a502e85049ca5f539ce3f5e7f03e58e_3747759498074886051.jpg',
      desc: '来试试刀吧',
      quote: '画笔，臣服于我！'
    },
    { 
      name: '月圆之夜', 
      icon: 'https://www.yueyuanzhiye.com/images/v5/logo.png',
      desc: '越玩越上头',
      quote: '我的回合，欸，还是我的回合~'
    },
    { 
      name: 'MC', 
      icon: 'https://www.minecraft.net/content/dam/minecraftnet/franchise/logos/Homepage_Download-Launcher_Creeper-Logo_500x500.png',
      desc: '神中神',
      quote: '生电玩多了，会丧失人性的。'
    },
  ];

  // 作品数据
  const works = {
    projects: [
      { 
        title: '游戏服务器官网', 
        desc: '前端开发项目，展示服务器信息和玩家社区。',
        tags: ['前端', 'HTML/CSS/JS'],
        tagColors: ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800']
      },
      { 
        title: '博客网站', 
        desc: 'PHP全栈自主开发，支持文章发布和管理功能。',
        tags: ['全栈', 'PHP', 'MySQL'],
        tagColors: ['bg-purple-100 text-purple-800', 'bg-yellow-100 text-yellow-800', 'bg-green-100 text-green-800']
      },
      { 
        title: '聊天网站', 
        desc: 'Vue + Node.js + PostgreSQL全栈开发，实时聊天功能。',
        tags: ['Vue', 'Node.js', 'PostgreSQL'],
        tagColors: ['bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800']
      },
      { 
        title: 'AI文件整理项目', 
        desc: 'Python开发，使用AI技术进行文件智能分类和整理。',
        tags: ['Python', 'AI'],
        tagColors: ['bg-yellow-100 text-yellow-800', 'bg-red-100 text-red-800']
      },
    ],
  };

  // 联系方式
  const contacts = [
    { icon: MessageCircle, label: t.about?.contact_wechat || '微信', value: 'Qr2051134', color: 'text-green-500' },
    { icon: Mail, label: t.about?.contact_qq || 'QQ', value: '1377820366', color: 'text-blue-500' },
    { icon: Github, label: 'GitHub', value: 'LoosePrince', color: 'text-gray-800' },
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
    <div className="max-w-5xl mx-auto space-y-12">
      {/* 隐藏的音频元素 */}
      <audio 
        ref={audioRef} 
        src="https://music.163.com/song/media/outer/url?id=2612489941.mp3"
        loop
      />
      {/* Hero Section - 欢迎区 */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-12 md:py-16 px-6 md:px-10 bg-gradient-to-br from-pink-50 to-blue-50 dark:from-pink-900/10 dark:to-blue-900/10 rounded-[3rem] shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
      >
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-300 dark:bg-yellow-600 rounded-full opacity-20 dark:opacity-10"></div>
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-blue-300 dark:bg-blue-600 rounded-full opacity-20 dark:opacity-10"></div>
        
        <div className="relative flex flex-col md:flex-row items-center md:items-start space-y-8 md:space-y-0 md:space-x-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative flex-shrink-0"
          >
            <div className="absolute inset-0 bg-indigo-200 dark:bg-indigo-700 rounded-full blur-2xl opacity-20 dark:opacity-10 animate-pulse"></div>
            <img 
              src={profile.avatar} 
              alt={profile.name}
              className="relative w-32 h-32 md:w-40 md:h-40 rounded-[2rem] border-4 border-white dark:border-gray-700 shadow-2xl object-cover transform rotate-3"
            />
          </motion.div>
          
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-800 dark:text-gray-100 mb-3 tracking-tight">
              {t.about?.welcome || '客官，里面请'} <span className="inline-block animate-bounce">~</span>
            </h1>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-medium text-gray-500 dark:text-gray-400 mb-6">
              {t.about?.iam || '我是'}<span className="text-pink-600 dark:text-pink-400">{profile.name}</span>
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full mb-6 mx-auto md:mx-0"></div>
          </div>
        </div>
      </motion.section>

      {/* 个人简介 + 兴趣爱好 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-lg p-6 md:p-10 transform hover:scale-[1.01] transition-all duration-300"
      >
        <h2 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-gray-100 mb-6 flex items-center">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500">
            {t.about?.intro || '简介'}
          </span>
          <div className="flex-grow h-px bg-gray-200 dark:bg-gray-700 ml-4"></div>
        </h2>

        <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
          {profile.bio || t.home.bioPlaceholder}
        </p>
        
        <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
          {t.about?.intro_text1 || '我热爱任何有趣的事物，包括但不限于：'}
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {interests.map((interest, index) => {
            const Icon = interest.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:shadow-md dark:hover:shadow-none dark:hover:bg-gray-600 transition-all group"
              >
                <div className={`p-3 ${interest.bg} dark:opacity-80 ${interest.color} rounded-xl mb-2 group-hover:scale-110 transition-transform`}>
                  <Icon size={24} />
                </div>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{interest.label}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* 专业能力 - 带标签页 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-lg p-6 md:p-10 transform hover:scale-[1.01] transition-all duration-300"
      >
        <h2 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-gray-100 mb-6 flex items-center">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-500">
            {t.about?.skills || '专业能力'}
          </span>
          <div className="flex-grow h-px bg-gray-200 dark:bg-gray-700 ml-4"></div>
        </h2>

        {/* 标签页头部 */}
        <div className="flex space-x-2 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveSkillTab('design')}
            className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
              activeSkillTab === 'design'
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t.about?.tab_design || '设计能力'}
          </button>
          <button
            onClick={() => setActiveSkillTab('programming')}
            className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
              activeSkillTab === 'programming'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t.about?.tab_programming || '编程能力'}
          </button>
          <button
            onClick={() => setActiveSkillTab('other')}
            className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
              activeSkillTab === 'other'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t.about?.tab_other || '其他能力'}
          </button>
        </div>

        {/* 标签页内容 */}
        <div className="space-y-6">
          {skillsData[activeSkillTab as keyof typeof skillsData].map((skill, index) => (
            <motion.div
              key={skill.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex justify-between mb-2">
                <span className="text-base font-bold text-gray-700 dark:text-gray-300">{skill.name}</span>
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{skill.level}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.level}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"
                ></motion.div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{skill.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-500 dark:text-gray-400 italic">{t.about?.skills_quote || '技能是一个一个学的，经验是一点一点积累的'}</p>
        </div>
      </motion.section>


      {/* 作品展示 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-lg p-6 md:p-10 transform hover:scale-[1.01] transition-all duration-300"
      >
        <h2 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-gray-100 mb-4 flex items-center">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-500">
            {t.about?.works || '我的作品'}
          </span>
          <div className="flex-grow h-px bg-gray-200 dark:bg-gray-700 ml-4"></div>
        </h2>
        
        <div className="text-center mb-8">
          <p className="text-gray-500 dark:text-gray-400 italic">{t.about?.works_quote || '作品是技能的体现，也是经验的积累'}</p>
        </div>

        <div className="space-y-6">
          {works.projects.map((work, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 hover:shadow-md dark:hover:shadow-none dark:hover:bg-gray-600 transition-all"
            >
              <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 mb-3">
                {work.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{work.desc}</p>
              <div className="flex flex-wrap gap-2">
                {work.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className={`px-3 py-1 rounded-full text-sm font-bold ${work.tagColors[tagIndex]}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* 游戏偏好 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-lg p-6 md:p-10 transform hover:scale-[1.01] transition-all duration-300"
      >
        <h2 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-gray-100 mb-6 flex items-center">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">
            {t.about?.games || '喜欢玩的游戏'}
          </span>
          <div className="flex-grow h-px bg-gray-200 dark:bg-gray-700 ml-4"></div>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.05 }}
              className="group bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 hover:shadow-xl dark:hover:shadow-none dark:hover:bg-gray-600 transition-all duration-300 cursor-pointer"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 mb-4 rounded-2xl overflow-hidden shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <img src={game.icon} alt={game.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2">{game.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">{game.desc}</p>
                <span className="text-xs text-gray-400 dark:text-gray-500 italic">"{game.quote}"</span>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-gray-500 dark:text-gray-400 italic">{t.about?.games_quote || '如果你也对这些游戏感兴趣的话，欢迎来找我玩！'}</p>
        </div>
      </motion.section>

      {/* 音乐播放器 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-lg p-6 md:p-10 transform hover:scale-[1.01] transition-all duration-300 overflow-hidden"
      >
        <h2 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-gray-100 mb-6 flex items-center">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500">
            {t.about?.music || '我的音乐'}
          </span>
          <div className="flex-grow h-px bg-gray-200 dark:bg-gray-700 ml-4"></div>
        </h2>
        
        <div className="flex justify-center mb-6">
          <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 w-full max-w-md shadow-lg border border-gray-100 dark:border-gray-600">
            {/* 歌曲信息 */}
            <div className="flex items-center space-x-4 mb-6">
              <button
                onClick={togglePlay}
                className="w-14 h-14 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg"
              >
                {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" className="ml-1" />}
              </button>
              <div className="flex-grow">
                <div className="text-xl font-black text-gray-900 dark:text-gray-100">明天你好</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">SER - 钢琴独奏版</div>
              </div>
            </div>
            
            {/* 进度条 */}
            <div>
              <div 
                className="relative h-2 bg-gray-200 dark:bg-gray-600 rounded-full cursor-pointer group"
                onClick={handleProgressClick}
              >
                <div 
                  className="absolute h-full bg-gradient-to-r from-red-500 to-yellow-500 rounded-full transition-all"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                ></div>
                <div 
                  className="absolute w-4 h-4 bg-white dark:bg-gray-300 rounded-full shadow-md top-1/2 transform -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto text-center space-y-3">
          <p className="text-gray-600 dark:text-gray-300 font-medium">
            {t.about?.music_about || '有关《明天你好》这首歌'}
          </p>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
            {t.about?.music_story1 || '这首歌是我在5年级的时候听的，当时我还在上小学，这首歌的旋律和歌词在那时让我产生了一种很奇妙的感觉'}
          </p>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
            {t.about?.music_story2 || '那种感觉我到现在也无法忘却，因为网易云没有我喜欢的版本，所以在此推荐的是钢琴的纯音乐版。'}
          </p>
        </div>
      </motion.section>

      {/* 联系方式 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-lg p-6 md:p-10"
      >
        <h2 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-gray-100 mb-6 flex items-center">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-blue-500">
            {t.about?.contact || '联系方式'}
          </span>
          <div className="flex-grow h-px bg-gray-200 dark:bg-gray-700 ml-4"></div>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {contacts.map((contact, index) => {
            const Icon = contact.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 hover:shadow-md dark:hover:shadow-none dark:hover:bg-gray-600 transition-all group"
              >
                <div className="flex items-center space-x-4">
                  <Icon size={28} className={contact.color} />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{contact.label}</h3>
                    <p className="text-gray-600 dark:text-gray-300">{contact.value}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(contact.value)}
                  className="p-2 bg-white dark:bg-gray-600 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all"
                >
                  {copiedText === contact.value ? (
                    <Check size={20} className="text-green-500 dark:text-green-400" />
                  ) : (
                    <Copy size={20} className="text-gray-400 dark:text-gray-500" />
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 italic">{t.about?.contact_note || '如果没有什么事的话，请勿打扰哦~'}</p>
        </div>
      </motion.section>

      {/* Tech Stack Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-br from-indigo-600 to-blue-600 p-12 rounded-[3rem] text-white shadow-2xl shadow-indigo-200"
      >
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <Coffee className="mr-3" size={40} />
            <Heart className="animate-pulse" size={40} />
            <Code className="ml-3" size={40} />
          </div>
          
          <h2 className="text-3xl font-black mb-6 italic">
            {t.about?.poweredBy || '本站技术栈'}
          </h2>
          
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto leading-relaxed">
            {t.about?.techStack || '使用 React + TypeScript + Vite 构建，数据存储在 GitHub，完全开源且易于部署。'}
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            {['React', 'TypeScript', 'Vite', 'TailwindCSS', 'GitHub API', 'Framer Motion'].map((tech, index) => (
              <motion.span
                key={tech}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.05 }}
                className="px-5 py-2.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold uppercase tracking-widest"
              >
                {tech}
              </motion.span>
            ))}
          </div>
        </div>
      </motion.section>

      {/* 结语 */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-[3rem] shadow-lg p-12"
      >
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xl mb-4 font-medium">{t.about?.outro1 || '在某种意义上来说热爱生活？'}</p>
          <p className="text-lg font-light italic opacity-90">
            {t.about?.outro2 || '最后的最后，感谢你的喜欢，感谢你点进这个无人问津的小角落'}
          </p>
          
          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} {profile.name}. {t.about?.rights || '保留所有权利'}.</p>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default About;
