export interface Post {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  contentPath: string;
  image?: string;
  author?: {
    name: string;
    avatar: string;
    username: string;
  };
}

export interface Profile {
  name: string;
  bio: string;
  avatar: string;
  socials: {
    github?: string;
    twitter?: string;
    email?: string;
  };
}

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export interface PublicConfig {
  owner: string;
  repo: string;
  branch: string;
}

export interface FileChange {
  path: string;
  content: string;
}

export interface AppState {
  posts: Post[];
  profile: Profile;
  config: GitHubConfig | null;
}