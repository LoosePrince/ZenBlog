import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, Edit3, ArrowRight } from 'lucide-react';
import { Post } from '../types';
import { motion } from 'framer-motion';
import { useLanguage, formatDate } from '../App';

interface PostCardProps {
  post: Post;
  isAdmin: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, isAdmin }) => {
  const { t, language } = useLanguage();
  
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="group bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-2xl hover:shadow-indigo-100/50 dark:hover:shadow-indigo-900/30 flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-6">
        <span className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-full uppercase tracking-widest">
          {post.category}
        </span>
        {isAdmin && (
          <Link 
            to={`/edit/${post.id}`} 
            className="p-2 text-gray-300 dark:text-gray-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all"
          >
            <Edit3 size={18} />
          </Link>
        )}
      </div>
      
      <Link to={`/post/${post.id}`} className="flex-grow">
        <h3 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mb-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
          {post.title}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-[15px] leading-relaxed mb-8 line-clamp-3 font-medium">
          {post.excerpt}
        </p>
      </Link>

      <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50 dark:border-gray-700">
        <div className="flex items-center text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-tighter">
          <Calendar size={14} className="mr-1.5 opacity-50" />
          {formatDate(post.date, 'full', language)}
        </div>
        <Link 
          to={`/post/${post.id}`} 
          className="flex items-center space-x-1 text-indigo-600 dark:text-indigo-400 text-sm font-black group/link"
        >
          <span className="relative">
            {t.home.readPost}
            <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 transition-all group-hover/link:w-full" />
          </span>
          <ArrowRight size={16} className="transition-transform group-hover/link:translate-x-1" />
        </Link>
      </div>
    </motion.div>
  );
};

export default PostCard;
