import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, PlusSquare, Home, User, ShieldCheck, Languages } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../App';
import { Profile } from '../types';

interface NavbarProps {
  isAdmin: boolean;
  onToggleAdmin: () => void;
  profile: Profile;
}

const Navbar: React.FC<NavbarProps> = ({ isAdmin, onToggleAdmin, profile }) => {
  const location = useLocation();
  const { t, language, setLanguage } = useLanguage();

  const navItems = [
    { label: t.nav.home, path: '/', icon: Home },
    { label: t.nav.about, path: '/about', icon: User },
  ];

  const adminItems = [
    { label: t.nav.newPost, path: '/edit/new', icon: PlusSquare },
    { label: t.nav.settings, path: '/settings', icon: Settings },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-10">
            <Link to="/" className="flex items-center space-x-2 group">
              <img 
                src={profile.avatar} 
                alt={profile.name}
                className="w-8 h-8 rounded-lg object-cover border-2 border-indigo-100 group-hover:border-indigo-300 transition-all shadow-sm"
              />
              <span className="text-xl font-black tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors">ZenBlog</span>
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

          <div className="flex items-center space-x-5">
            <button
              onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-95 flex items-center space-x-1 text-xs font-bold"
            >
              <Languages size={16} />
              <span className="uppercase">{language}</span>
            </button>

            {isAdmin && (
              <div className="hidden md:flex items-center space-x-6 mr-2 border-r pr-6 border-gray-100">
                {adminItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-1.5 text-sm font-semibold transition-colors ${
                      location.pathname === item.path ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-900'
                    }`}
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
            
            <button
              onClick={onToggleAdmin}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                isAdmin 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              <ShieldCheck size={14} />
              <span>{isAdmin ? t.nav.adminUser : t.nav.adminLogin}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
