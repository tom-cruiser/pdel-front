import { useEffect, useState } from 'react';
import { apiPost } from '../lib/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const ConfirmEmail = () => {
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const token = searchParams.get('token');
      if (!token) {
        setMessage('Missing token');
        setStatus('error');
        return;
      }
      setStatus('loading');
      try {
        const res = await apiPost('/auth/confirm-email', { token });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setMessage(body?.message || 'Confirmation failed');
          setStatus('error');
          return;
        }
        setMessage('Email confirmed successfully. You can now sign in.');
        setStatus('success');
        setTimeout(() => navigate('/'), 2800);
      } catch (e: any) {
        setMessage(e?.message || 'Confirmation failed');
        setStatus('error');
      }
    })();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-md p-6 text-center">
        <h2 className="text-xl font-bold mb-4">Confirm Email</h2>
        {status === 'loading' && <p className="text-gray-600">Confirming your email...</p>}
        {status === 'success' && <p className="text-green-600">{message}</p>}
        {status === 'error' && <p className="text-red-600">{message}</p>}
        {status !== 'loading' && (
          <div className="mt-6">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg"
            >
              Back to home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfirmEmail;
