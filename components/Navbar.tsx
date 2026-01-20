import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, PlusSquare, Home, User, ShieldCheck, Languages, Menu, X, Sun, Moon, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage, useTheme, Theme } from '../App';
import { Profile } from '../types';

interface NavbarProps {
  isAdmin: boolean;
  onToggleAdmin: () => void;
  profile: Profile;
}

const Navbar: React.FC<NavbarProps> = ({ isAdmin, onToggleAdmin, profile }) => {
  const location = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭主题菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };

    if (showThemeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showThemeMenu]);

  const themeOptions: { value: Theme; icon: any; label: string }[] = [
    { value: 'light', icon: Sun, label: t.theme?.light || '浅色' },
    { value: 'auto', icon: Monitor, label: t.theme?.auto || '自动' },
    { value: 'dark', icon: Moon, label: t.theme?.dark || '深色' },
  ];

  const currentThemeOption = themeOptions.find(opt => opt.value === theme) || themeOptions[1];

  const navItems = [
    { label: t.nav.home, path: '/', icon: Home },
    { label: t.nav.about, path: '/about', icon: User },
  ];

  const adminItems = [
    { label: t.nav.newPost, path: '/edit/new', icon: PlusSquare },
    { label: t.nav.settings, path: '/settings', icon: Settings },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-10">
            <Link to="/" className="flex items-center space-x-2 group">
              <img 
                src={profile.avatar} 
                alt={profile.name}
                className="w-8 h-8 rounded-lg object-cover border-2 border-indigo-100 dark:border-indigo-900 group-hover:border-indigo-300 dark:group-hover:border-indigo-700 transition-all shadow-sm"
              />
              <span className="text-xl font-black tracking-tight text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">ZenBlog</span>
            </Link>
            
            <div className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center space-x-1.5 text-sm font-semibold transition-colors py-1 ${
                    location.pathname === item.path ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-900'
                  }`}
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                  {location.pathname === item.path && (
                    <motion.div 
                      layoutId="nav-underline"
                      className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-indigo-600"
                    />
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* 移动端菜单按钮 */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all active:scale-95"
            >
              {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* 主题切换 */}
            <div className="relative" ref={themeMenuRef}>
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all active:scale-95"
              >
                <currentThemeOption.icon size={16} />
              </button>

              {/* 主题下拉菜单 */}
              <AnimatePresence>
                {showThemeMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                  >
                    {themeOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            setTheme(option.value);
                            setShowThemeMenu(false);
                          }}
                          className={`w-full flex items-center space-x-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                            theme === option.value
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Icon size={16} />
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 语言切换 */}
            <button
              onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all active:scale-95 flex items-center space-x-1 text-xs font-bold"
            >
              <Languages size={16} />
              <span className="uppercase hidden sm:inline">{language}</span>
            </button>

            {/* 桌面端管理员菜单 */}
            {isAdmin && (
              <div className="hidden md:flex items-center space-x-6 mr-2 border-r pr-6 border-gray-100 dark:border-gray-800">
                {adminItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-1.5 text-sm font-semibold transition-colors ${
                      location.pathname === item.path 
                        ? 'text-indigo-600 dark:text-indigo-400' 
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
            
            {/* 管理员切换按钮 */}
            <button
              onClick={onToggleAdmin}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                isAdmin 
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <ShieldCheck size={14} />
              <span className="hidden sm:inline">{isAdmin ? t.nav.adminUser : t.nav.adminLogin}</span>
            </button>
          </div>
        </div>

        {/* 移动端下拉菜单 */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-gray-100 dark:border-gray-800 overflow-hidden"
            >
              <div className="py-4 space-y-1">
                {/* 主导航项 */}
                <div className="px-2 mb-3">
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-2">
                    {t.nav.navigation || '导航'}
                  </p>
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${
                        location.pathname === item.path
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <item.icon size={18} />
                      <span className="font-semibold text-sm">{item.label}</span>
                    </Link>
                  ))}
                </div>

                {/* 管理员菜单项（仅在管理员模式下显示） */}
                {isAdmin && (
                  <div className="px-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-2">
                      {t.nav.admin || '管理'}
                    </p>
                    {adminItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setShowMobileMenu(false)}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${
                          location.pathname === item.path
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <item.icon size={18} />
                        <span className="font-semibold text-sm">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
