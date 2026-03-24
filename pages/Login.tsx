import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Github, KeyRound, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage, useAuth } from '../App';

const Login: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { loginByUniId, loginByGithubKey, authState } = useAuth();
  const [githubKey, setGithubKey] = useState('');
  const [loadingUniId, setLoadingUniId] = useState(false);
  const [loadingKey, setLoadingKey] = useState(false);

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';

  React.useEffect(() => {
    if (authState.isUniIdAuthed || authState.isWriterUnlocked) {
      navigate(redirectTo, { replace: true });
    }
  }, [authState.isUniIdAuthed, authState.isWriterUnlocked, navigate, redirectTo]);

  const handleUniIdLogin = async () => {
    setLoadingUniId(true);
    try {
      const ok = await loginByUniId();
      if (ok) {
        toast.success(t.auth.loginSuccess);
        navigate(redirectTo, { replace: true });
      }
    } catch (err: any) {
      toast.error(`${t.auth.loginFailed}: ${err.message}`);
    } finally {
      setLoadingUniId(false);
    }
  };

  const handleGithubKeyLogin = async () => {
    if (!githubKey.trim()) {
      toast.error(t.auth.enterGithubKey);
      return;
    }
    setLoadingKey(true);
    try {
      await loginByGithubKey(githubKey.trim());
      toast.success(t.auth.keyLoginSuccess);
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      toast.error(`${t.auth.keyLoginFailed}: ${err.message}`);
    } finally {
      setLoadingKey(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-8 shadow-sm">
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-3">
          <ShieldCheck className="text-indigo-600 dark:text-indigo-400" />
          {t.auth.loginTitle}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">{t.auth.loginSubtitle}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={handleUniIdLogin}
            disabled={loadingUniId || loadingKey}
            className="w-full border-2 border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-2xl p-5 font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={18} />
              {loadingUniId ? t.auth.logining : t.auth.loginByUniId}
            </span>
          </button>

          <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-5 bg-gray-50 dark:bg-gray-900/30">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              {t.auth.githubKeyLabel}
            </label>
            <input
              type="password"
              value={githubKey}
              onChange={(e) => setGithubKey(e.target.value)}
              placeholder="ghp_xxx"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mb-3"
            />
            <button
              type="button"
              onClick={handleGithubKeyLogin}
              disabled={loadingUniId || loadingKey}
              className="w-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl py-2.5 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-2">
                {loadingKey ? <KeyRound size={16} /> : <Github size={16} />}
                {loadingKey ? t.auth.verifying : t.auth.loginByGithubKey}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
