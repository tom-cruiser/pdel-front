import { useState, useEffect } from 'react';
import { apiPost } from '../lib/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setToken(searchParams.get('token'));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return setMessage('Missing token');
    if (!password || password.length < 8) return setMessage('Password must be at least 8 characters');
    if (password !== confirm) return setMessage('Passwords do not match');
    setSubmitting(true);
    try {
      const res = await apiPost('/auth/reset-password', { token, password });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setMessage(body?.message || 'Reset failed');
        setSubmitting(false);
        return;
      }
      setMessage('Password updated successfully. Redirecting to sign in...');
      setTimeout(() => navigate('/'), 2000);
    } catch (e: any) {
      setMessage(e?.message || 'Reset failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold mb-4">Reset Password</h2>
        {!token ? (
          <p className="text-gray-600">Missing token. Please use the link from your email.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            {message && <p className="text-sm text-red-600">{message}</p>}
            <div className="flex items-center space-x-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg"
              >
                {submitting ? 'Updating...' : 'Update password'}
              </button>
              <button type="button" onClick={() => navigate('/')} className="px-4 py-2 bg-gray-200 rounded-lg">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
