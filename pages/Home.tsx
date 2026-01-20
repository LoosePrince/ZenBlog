
import React from 'react';
import PostCard from '../components/PostCard.tsx';
import { Post, Profile } from '../types.ts';
import { Github, Twitter, Mail } from 'lucide-react';

interface HomeProps {
  posts: Post[];
  profile: Profile;
  isAdmin: boolean;
}

const Home: React.FC<HomeProps> = ({ posts, profile, isAdmin }) => {
  return (
    <div className="space-y-12">
      <section className="relative py-12 px-6 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
        <div className="relative flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
          <img 
            src={profile.avatar} 
            alt={profile.name}
            className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
          />
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{profile.name}</h1>
            <p className="text-lg text-gray-500 mb-6 max-w-2xl">{profile.bio}</p>
            <div className="flex justify-center md:justify-start space-x-4">
              {profile.socials.github && (
                <a href={profile.socials.github} target="_blank" rel="noreferrer" className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                  <Github size={20} />
                </a>
              )}
              {profile.socials.twitter && (
                <a href={profile.socials.twitter} target="_blank" rel="noreferrer" className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                  <Twitter size={20} />
                </a>
              )}
              {profile.socials.email && (
                <a href={`mailto:${profile.socials.email}`} className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                  <Mail size={20} />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">最新发布</h2>
          <div className="h-px flex-1 bg-gray-100 mx-6 hidden sm:block"></div>
        </div>
        
        {posts.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400">暂无文章，开始创作吧！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} isAdmin={isAdmin} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
