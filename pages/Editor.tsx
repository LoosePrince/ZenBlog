
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Wand2, Loader2, Image as ImageIcon } from 'lucide-react';
import { Post, GitHubConfig } from '../types.ts';
import { GitHubService } from '../services/githubService.ts';
import { generateBlogHelper } from '../services/geminiService.ts';

interface EditorProps {
  posts: Post[];
  config: GitHubConfig | null;
  onSave: (postData: Partial<Post>, content: string) => Promise<void>;
}

const Editor: React.FC<EditorProps> = ({ posts, config, onSave }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';
  
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('生活');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [aiWorking, setAiWorking] = useState(false);

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
        alert('加载失败: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id, posts, config, isNew, navigate]);

  const handleSave = async () => {
    if (!title || !content) {
      alert('标题和内容不能为空');
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
      alert('保存失败: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAiAssist = async (task: 'summary' | 'title' | 'proofread') => {
    if (!content && task !== 'title') {
      alert('请先输入内容');
      return;
    }
    setAiWorking(true);
    const result = await generateBlogHelper(content || title, task);
    setAiWorking(false);
    
    if (task === 'summary') setExcerpt(result);
    else {
      alert('AI 建议:\n\n' + result);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500">正在准备编辑器...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="inline-flex items-center text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={18} className="mr-2" /> 取消
        </button>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleAiAssist('summary')}
            disabled={aiWorking}
            className="flex items-center px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 disabled:opacity-50"
          >
            {aiWorking ? <Loader2 size={16} className="animate-spin mr-2" /> : <Wand2 size={16} className="mr-2" />}
            AI 摘要
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
            {isNew ? '发布文章' : '保存修改'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入文章标题..."
            className="w-full text-4xl font-extrabold text-gray-900 border-none focus:ring-0 bg-transparent placeholder-gray-300"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="从这里开始创作 (支持 Markdown)..."
            className="w-full h-[600px] p-0 text-lg leading-relaxed text-gray-700 border-none focus:ring-0 bg-transparent resize-none placeholder-gray-300"
          />
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-900 border-b pb-2">文章属性</h3>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">文章分类</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option>生活</option>
                <option>技术</option>
                <option>随笔</option>
                <option>教程</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">文章摘要</label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;
