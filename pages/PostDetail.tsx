
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, Loader2, Edit, Trash2 } from 'lucide-react';
import { Post, GitHubConfig } from '../types.ts';
import { GitHubService } from '../services/githubService.ts';

interface PostDetailProps {
  posts: Post[];
  config: GitHubConfig | null;
  isAdmin: boolean;
  onDelete: (id: string) => Promise<void>;
}

const PostDetail: React.FC<PostDetailProps> = ({ posts, config, isAdmin, onDelete }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const post = posts.find((p) => p.id === id);

  useEffect(() => {
    if (!post || !config) {
      if (!post && !loading) setError('文章未找到');
      setLoading(false);
      return;
    }

    const fetchContent = async () => {
      try {
        const service = new GitHubService(config);
        const { content } = await service.getFile(post.contentPath);
        setContent(content);
      } catch (err: any) {
        setError(err.message || '获取内容失败');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id, post, config]);

  const handleDelete = async () => {
    if (id && window.confirm('确定要删除这篇文章吗？')) {
      try {
        await onDelete(id);
        navigate('/');
      } catch (err: any) {
        alert('删除失败: ' + err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500">正在获取内容...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{error}</h2>
        <Link to="/" className="text-blue-600 flex items-center justify-center">
          <ArrowLeft size={16} className="mr-2" /> 返回首页
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto py-8">
      <Link to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 mb-8 transition-colors">
        <ArrowLeft size={16} className="mr-2" /> 返回首页
      </Link>

      <header className="mb-10 text-center">
        <div className="flex justify-center items-center space-x-2 mb-4">
          <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full uppercase tracking-wider">
            {post.category}
          </span>
          <span className="text-gray-300">•</span>
          <div className="flex items-center text-gray-400 text-sm">
            <Calendar size={14} className="mr-1" />
            {new Date(post.date).toLocaleDateString('zh-CN')}
          </div>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
          {post.title}
        </h1>
        
        {isAdmin && (
          <div className="flex justify-center space-x-4">
            <Link 
              to={`/edit/${post.id}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Edit size={16} className="mr-2" /> 编辑文章
            </Link>
            <button 
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} className="mr-2" /> 删除
            </button>
          </div>
        )}
      </header>

      <div className="prose prose-blue max-w-none markdown-content">
        {content ? (
          content.split('\n').map((line, i) => {
            if (line.startsWith('# ')) return <h1 key={i}>{line.substring(2)}</h1>;
            if (line.startsWith('## ')) return <h2 key={i}>{line.substring(3)}</h2>;
            if (line.startsWith('> ')) return <blockquote key={i}>{line.substring(2)}</blockquote>;
            if (line.trim() === '') return <br key={i} />;
            return <p key={i}>{line}</p>;
          })
        ) : (
          <p className="text-gray-400 italic">内容加载中...</p>
        )}
      </div>
    </article>
  );
};

export default PostDetail;
