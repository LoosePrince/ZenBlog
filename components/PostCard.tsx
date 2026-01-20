import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, Edit3, ArrowRight } from 'lucide-react';
import { Post } from '../types.ts';
import { motion } from 'framer-motion';
import { useLanguage } from '../App';

interface PostCardProps {
  post: Post;
  isAdmin: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, isAdmin }) => {
  const { t } = useLanguage();
  
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="group bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 transition-all hover:shadow-2xl hover:shadow-indigo-100/50 flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-6">
        <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest">
          {post.category}
        </span>
        {isAdmin && (
          <Link 
            to={`/edit/${post.id}`} 
            className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
          >
            <Edit3 size={18} />
          </Link>
        )}
      </div>
      
      <Link to={`/post/${post.id}`} className="flex-grow">
        <h3 className="text-2xl font-extrabold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors leading-tight">
          {post.title}
        </h3>
        <p className="text-gray-500 text-[15px] leading-relaxed mb-8 line-clamp-3 font-medium">
          {post.excerpt}
        </p>
      </Link>

      <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50">
        <div className="flex items-center text-gray-400 text-xs font-bold uppercase tracking-tighter">
          <Calendar size={14} className="mr-1.5 opacity-50" />
          {new Date(post.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <Link 
          to={`/post/${post.id}`} 
          className="flex items-center space-x-1 text-indigo-600 text-sm font-black group/link"
        >
          <span className="relative">
            {t.home.readPost}
            <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover/link:w-full" />
          </span>
          <ArrowRight size={16} className="transition-transform group-hover/link:translate-x-1" />
        </Link>
      </div>
    </motion.div>
  );
};

export default PostCard;
