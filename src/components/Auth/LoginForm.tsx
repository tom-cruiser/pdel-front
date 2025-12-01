import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const LoginForm = ({ onToggle }: { onToggle: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err) {
        const msg = (err as any)?.message || t('login.invalid');
        setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMessage(null);
    try {
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail || email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setForgotMessage(body?.message || 'Failed to request password reset');
        return;
      }
      setForgotMessage('If that email exists we sent a reset link');
    } catch (e: any) {
      setForgotMessage(e?.message || 'Failed to request password reset');
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-green-500 p-3 rounded-xl">
            <LogIn className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">{t('login.welcome')}</h2>
        <p className="text-center text-gray-600 mb-8">{t('login.subtitle')}</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              {t('login.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              {t('login.password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : t('login.signin')}
          </button>
        </form>

        <div className="mt-4 text-center">
          {!showForgot ? (
            <button
              onClick={() => { setShowForgot(true); setForgotMessage(null); }}
              className="text-sm text-blue-500 hover:underline"
            >
              {t('login.forgot_password') || 'Forgot password?'}
            </button>
          ) : (
            <form onSubmit={handleRequestReset} className="space-y-3">
              <p className="text-sm text-gray-600">Enter your email to receive a reset link</p>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border rounded-lg"
              />
              <div className="flex items-center justify-center space-x-3">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Send</button>
                <button type="button" onClick={() => setShowForgot(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
              </div>
              {forgotMessage && <p className="text-sm text-gray-600 mt-2">{forgotMessage}</p>}
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {t('login.signup_prompt')}{' '}
            <button
              onClick={onToggle}
              className="text-blue-500 hover:text-blue-600 font-semibold transition"
            >
              {t('login.signup')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
