
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Loader2, Image as ImageIcon } from 'lucide-react';
import { Post, GitHubConfig } from '../types.ts';
import { GitHubService } from '../services/githubService.ts';
import { useLanguage } from '../App';

interface EditorProps {
  posts: Post[];
  config: GitHubConfig | null;
  onSave: (postData: Partial<Post>, content: string) => Promise<void>;
}

const Editor: React.FC<EditorProps> = ({ posts, config, onSave }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isNew = id === 'new';
  
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState(t.editor.categories.life);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) return;
    
    const post = posts.find(p => p.id === id);
    if (!post || !config) {
      if (!isNew) navigate('/');
      return;
    }

    setTitle(post.title);
    setExcerpt(post.excerpt);
    setCategory(post.category);

    const fetchContent = async () => {
      try {
        const service = new GitHubService(config);
        const { content } = await service.getFile(post.contentPath);
        setContent(content);
      } catch (err: any) {
        alert(t.editor.loadError + ': ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id, posts, config, isNew, navigate]);

  const handleSave = async () => {
    if (!title || !content) {
      alert(t.editor.emptyFields);
      return;
    }

    setSaving(true);
    try {
      const postData: Partial<Post> = {
        id: isNew ? Math.random().toString(36).substr(2, 9) : id,
        title,
        excerpt: excerpt || content.substring(0, 150) + '...',
        category,
        date: isNew ? new Date().toISOString() : undefined,
      };
      await onSave(postData, content);
      navigate('/');
    } catch (err: any) {
      alert(t.editor.saveFailed + ': ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500">{t.editor.preparing}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={18} className="mr-2" /> {t.editor.cancel}
        </button>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:opacity-50 transition-all active:scale-95"
          >
            {saving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
            {isNew ? t.editor.publish : t.editor.save}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.editor.titlePlaceholder}
            className="w-full text-4xl font-extrabold text-gray-900 border-none focus:ring-0 bg-transparent placeholder-gray-300"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t.editor.contentPlaceholder}
            className="w-full h-[600px] p-0 text-lg leading-relaxed text-gray-700 border-none focus:ring-0 bg-transparent resize-none placeholder-gray-300"
          />
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-900 border-b border-gray-50 pb-2">{t.editor.properties}</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t.editor.category}</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                <option>{t.editor.categories.life}</option>
                <option>{t.editor.categories.tech}</option>
                <option>{t.editor.categories.essay}</option>
                <option>{t.editor.categories.tutorial}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">{t.editor.excerpt}</label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={6}
                placeholder={t.editor.excerptHint}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
