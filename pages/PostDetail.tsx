import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, Loader2, Edit3, Trash2, Clock, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Post, GitHubConfig } from '../types.ts';
import { GitHubService } from '../services/githubService.ts';
import { motion } from 'framer-motion';
import { useLanguage } from '../App';

interface PostDetailProps {
  posts: Post[];
  config: GitHubConfig | null;
  isAdmin: boolean;
  onDelete: (id: string) => Promise<void>;
}

const PostDetail: React.FC<PostDetailProps> = ({ posts, config, isAdmin, onDelete }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const post = posts.find((p) => p.id === id);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!post || !config) {
      if (!post && !loading) setError(t.post.notFound);
      setLoading(false);
      return;
    }

    const fetchContent = async () => {
      try {
        const service = new GitHubService(config);
        const { content } = await service.getFile(post.contentPath);
        setContent(content);
      } catch (err: any) {
        setError(err.message || t.post.loadError);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id, post, config, t]);

  const handleDelete = async () => {
    if (id) {
      await onDelete(id);
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-48">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">{t.post.fetchingStory}</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-32 bg-white rounded-[3rem] shadow-sm border border-gray-100 max-w-2xl mx-auto">
        <h2 className="text-3xl font-black text-gray-900 mb-6">{error || t.post.error404}</h2>
        <Link to="/" className="inline-flex items-center text-indigo-600 font-black uppercase tracking-widest text-sm hover:opacity-70 transition-opacity">
          <ArrowLeft size={16} className="mr-2" /> {t.post.backHome}
        </Link>
      </div>
    );
  }

  const readingTime = Math.ceil(content.length / 500) || 1;

  return (
    <article className="max-w-4xl mx-auto">
      <div className="mb-12">
        <Link to="/" className="group inline-flex items-center text-sm font-black text-gray-400 hover:text-indigo-600 uppercase tracking-widest transition-colors">
          <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" /> {t.post.back}
        </Link>
      </div>

      <header className="mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest">
              {post.category}
            </span>
            <div className="h-1 w-1 rounded-full bg-gray-200"></div>
            <div className="flex items-center text-gray-400 text-xs font-bold uppercase tracking-tight">
              <Calendar size={14} className="mr-1.5" />
              {new Date(post.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="h-1 w-1 rounded-full bg-gray-200"></div>
            <div className="flex items-center text-gray-400 text-xs font-bold uppercase tracking-tight">
              <Clock size={14} className="mr-1.5" />
              {readingTime} {t.post.minRead}
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-10 leading-[1.1] tracking-tight">
            {post.title}
          </h1>

          <div className="flex items-center justify-between pb-10 border-b border-gray-100">
            <div className="flex items-center space-x-4">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" className="w-10 h-10 rounded-full bg-gray-100" />
              <div>
                <p className="text-sm font-black text-gray-900">{t.post.author}</p>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-tight">{t.post.adminMember}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {isAdmin && (
                <>
                  <Link 
                    to={`/edit/${post.id}`}
                    className="p-2.5 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all transform hover:scale-105"
                  >
                    <Edit3 size={20} />
                  </Link>
                  <button 
                    onClick={handleDelete}
                    className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all transform hover:scale-105"
                  >
                    <Trash2 size={20} />
                  </button>
                </>
              )}
              <button className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all transform hover:scale-105">
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      </header>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="prose prose-indigo prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:text-gray-600 prose-p:leading-relaxed prose-img:rounded-[2rem] prose-img:shadow-2xl"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </motion.div>

      <footer className="mt-20 pt-10 border-t border-gray-100">
        <div className="bg-gray-50 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between">
          <div>
            <h4 className="text-xl font-black text-gray-900 mb-2 italic">{t.post.enjoyed}</h4>
            <p className="text-gray-400 font-medium">{t.post.follow}</p>
          </div>
          <Link to="/" className="mt-6 md:mt-0 px-8 py-4 bg-white text-indigo-600 rounded-[1.5rem] font-black shadow-sm hover:shadow-md transition-all active:scale-95 tracking-widest uppercase text-xs">
            {t.post.allPosts}
          </Link>
        </div>
      </footer>
    </article>
  );
};

export default PostDetail;
