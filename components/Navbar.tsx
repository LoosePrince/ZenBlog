
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, PlusSquare, Home, User, Edit3 } from 'lucide-react';

interface NavbarProps {
  isAdmin: boolean;
  onToggleAdmin: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isAdmin, onToggleAdmin }) => {
  const location = useLocation();

  const navItems = [
    { label: '首页', path: '/', icon: Home },
    { label: '关于', path: '/about', icon: User },
  ];

  const adminItems = [
    { label: '新文章', path: '/edit/new', icon: PlusSquare },
    { label: '设置', path: '/settings', icon: Settings },
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ZenBlog
            </Link>
            <div className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                    location.pathname === item.path ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isAdmin && (
              <div className="hidden md:flex items-center space-x-4 mr-4 border-r pr-4 border-gray-200">
                {adminItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                      location.pathname === item.path ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
                    }`}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
            <button
              onClick={onToggleAdmin}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isAdmin 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isAdmin ? '退出管理' : '后台管理'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
