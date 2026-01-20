import React from 'react';
import { Link } from 'react-router-dom';
import PostCard from '../components/PostCard.tsx';
import { Post, Profile } from '../types.ts';
import { Github, Twitter, Mail, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../App';

interface HomeProps {
  posts: Post[];
  profile: Profile;
  isAdmin: boolean;
}

const Home: React.FC<HomeProps> = ({ posts, profile, isAdmin }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-20">
      <section className="relative py-20 px-10 bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-50 rounded-full blur-[100px] opacity-60 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-blue-50 rounded-full blur-[80px] opacity-40"></div>
        
        <div className="relative flex flex-col md:flex-row items-center space-y-10 md:space-y-0 md:space-x-12">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-indigo-200 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <img 
              src={profile.avatar} 
              alt={profile.name}
              className="relative w-40 h-40 rounded-[2.5rem] border-4 border-white shadow-2xl object-cover transform rotate-3"
            />
          </motion.div>
          
          <div className="text-center md:text-left flex-1">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-center md:justify-start space-x-2 mb-4">
                <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-tighter flex items-center">
                  <Sparkles size={10} className="mr-1" /> {t.home.available}
                </span>
              </div>
              <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
                {t.home.greeting} <span className="text-indigo-600 italic">{profile.name}</span>.
              </h1>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl font-medium leading-relaxed">
                {profile.bio || t.home.bioPlaceholder}
              </p>
              <div className="flex justify-center md:justify-start space-x-6">
                {profile.socials.github && (
                  <a href={profile.socials.github} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-indigo-600 transition-all transform hover:scale-110">
                    <Github size={24} />
                  </a>
                )}
                {profile.socials.twitter && (
                  <a href={profile.socials.twitter} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-indigo-600 transition-all transform hover:scale-110">
                    <Twitter size={24} />
                  </a>
                )}
                {profile.socials.email && (
                  <a href={`mailto:${profile.socials.email}`} className="text-gray-400 hover:text-indigo-600 transition-all transform hover:scale-110">
                    <Mail size={24} />
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t.home.recentPosts}</h2>
          <div className="h-[2px] flex-1 bg-gray-100 mx-10 hidden sm:block opacity-50"></div>
          {isAdmin && (
            <Link to="/edit/new" className="text-sm font-black text-indigo-600 uppercase tracking-widest hover:opacity-70 transition-opacity">
              {t.home.createNew}
            </Link>
          )}
        </div>
        
        {posts.length === 0 ? (
          <div className="text-center py-32 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">{t.home.noPosts}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <PostCard post={post} isAdmin={isAdmin} />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;