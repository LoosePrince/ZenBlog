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

export interface Interest {
  name: string;
  icon: string; // 图标名称（lucide-react图标名）
  color: string; // 颜色类名，如 'text-pink-600'
  bg: string; // 背景色类名，如 'bg-pink-50 dark:bg-pink-900/20'
}

export interface Skill {
  name: string;
  level: number; // 0-100
  desc: string;
}

export interface SkillCategory {
  [key: string]: Skill[];
}

export interface Work {
  title: string;
  desc: string;
  tags: string[];
}

export interface Music {
  name: string;
  subtitle: string;
  url: string;
  description: string;
}

export interface Contact {
  type: string; // 'wechat' | 'qq' | 'github' | 'email' | 'twitter'
  label: string;
  value: string;
}

export interface Game {
  name: string;
  icon: string; // 图标链接
  quote: string; // 描述
  about?: string; // 关于
}

export interface AboutData {
  intro?: string; // 简介文本
  interests?: Interest[]; // 兴趣与技能
  skills?: SkillCategory; // 专业能力（按分类）
  skillCategoryLabels?: { [key: string]: string }; // 技能分类标签（可自定义）
  works?: Work[]; // 我的作品
  music?: Music; // 音乐
  contacts?: Contact[]; // 联系方式
  games?: Game[]; // 喜欢玩的游戏
}

export interface SiteSettings {
  siteName?: string; // 网站名
  siteIcon?: string; // 网站图标链接
  siteDescription?: string; // 网站描述
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
  about?: AboutData; // 关于页面数据
  siteSettings?: SiteSettings; // 站点设置
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

export interface BinaryFileChange {
  path: string;
  contentBase64: string;
}

/** 文章内嵌入的文件块（与 data-zenfile div 属性对应） */
export interface ZenFileBlock {
  uuid: string;
  name: string;
  caption?: string;
  mime: string;
}

/** 编辑器内部未上传文件状态 */
export interface EditorFileState {
  localId: string;
  file: File;
  previewUrl: string;
}

export interface AppState {
  posts: Post[];
  profile: Profile;
  config: GitHubConfig | null;
}