
import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, Edit } from 'lucide-react';
import { Post } from '../types.ts';

interface PostCardProps {
  post: Post;
  isAdmin: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, isAdmin }) => {
  return (
    <div className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all hover:shadow-xl hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full uppercase tracking-wider">
          {post.category}
        </span>
        {isAdmin && (
          <Link to={`/edit/${post.id}`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
            <Edit size={16} />
          </Link>
        )}
      </div>
      
      <Link to={`/post/${post.id}`}>
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
          {post.title}
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3">
          {post.excerpt}
        </p>
      </Link>

      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div className="flex items-center text-gray-400 text-xs">
          <Calendar size={14} className="mr-1" />
          {new Date(post.date).toLocaleDateString('zh-CN')}
        </div>
        <Link to={`/post/${post.id}`} className="flex items-center text-blue-600 text-sm font-semibold group-hover:translate-x-1 transition-transform">
          阅读更多 <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
};

export default PostCard;
