import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, Calendar, Image, MessageSquare, BarChart3 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import logo from '../../assets/logo.png';

export const Header = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n, t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const path = location.pathname;

  const isActive = (p: string) => (p === '/' ? path === '/' : path === p);
  const [unauthMsg, setUnauthMsg] = useState<string | null>(null);

  useEffect(() => {
    const h = (e: any) => {
      setUnauthMsg("Not signed in — set a dev token or sign in to continue.");
      // clear banner after a while
      setTimeout(() => setUnauthMsg(null), 6000);
    };
    window.addEventListener('api:unauthorized', h as EventListener);
    return () => window.removeEventListener('api:unauthorized', h as EventListener);
  }, []);

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        {unauthMsg && (
          <div className="mb-3 rounded border border-red-100 bg-red-50 text-red-700 px-4 py-2 text-sm">
            {unauthMsg}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-white p-1 rounded-lg">
              <img src={logo} alt="Padel Court Logo" className="w-12 h-12 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Padel Court
              </h1>
              <p className="text-xs text-gray-500">Booking System</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => navigate('/')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                isActive('/') ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>{t('header.book')}</span>
            </button>

            <button
              onClick={() => navigate('/gallery')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                isActive('/gallery') ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Image className="w-5 h-5" />
              <span>{t('header.gallery')}</span>
            </button>

            <button
              onClick={() => navigate('/contact')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                isActive('/contact') ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>{t('header.contact')}</span>
            </button>

            {profile?.is_admin && (
              <button
                onClick={() => navigate('/admin')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                  isActive('/admin') ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span>{t('header.admin')}</span>
              </button>
            )}
          </nav>

          {/* hamburger for mobile */}
          <div className="md:hidden mr-2">
            <button
              aria-label="Open menu"
              onClick={() => setMobileOpen((s) => !s)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <svg className="w-6 h-6 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {/* Dev helper: set dev token for local testing (visible in dev only) */}
            {import.meta.env.DEV && (
              <div className="flex items-center space-x-2">
                <DevTokenSetter />
              </div>
            )}
            {user && (
              <>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => i18n.changeLanguage('en')}
                    className={`px-2 py-1 rounded ${i18n.language === 'en' ? 'bg-gray-100' : ''}`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => i18n.changeLanguage('fr')}
                    className={`px-2 py-1 rounded ${i18n.language === 'fr' ? 'bg-gray-100' : ''}`}
                  >
                    FR
                  </button>
                </div>
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden lg:inline">{profile?.full_name || t('header.profile')}</span>
                </button>

                <button
                  onClick={signOut}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden lg:inline">{t('header.signout')}</span>
                </button>
              </>
            )}
          </div>
        </div>
        {/* Mobile menu panel */}
        <div className={`${mobileOpen ? 'block' : 'hidden'} md:hidden mt-3 border-t pt-3`}> 
          <nav className="flex flex-col space-y-2">
            <button
              onClick={() => { setMobileOpen(false); navigate('/'); }}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition text-left ${isActive('/') ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <Calendar className="w-5 h-5" />
              <span>{t('header.book')}</span>
            </button>

            <button
              onClick={() => { setMobileOpen(false); navigate('/gallery'); }}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition text-left ${isActive('/gallery') ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <Image className="w-5 h-5" />
              <span>{t('header.gallery')}</span>
            </button>

            <button
              onClick={() => { setMobileOpen(false); navigate('/contact'); }}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition text-left ${isActive('/contact') ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>{t('header.contact')}</span>
            </button>

            {profile?.is_admin && (
              <button
                onClick={() => { setMobileOpen(false); navigate('/admin'); }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition text-left ${isActive('/admin') ? 'bg-blue-100 text-blue-600 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <BarChart3 className="w-5 h-5" />
                <span>{t('header.admin')}</span>
              </button>
            )}

            {/* Mobile user area */}
            <div className="pt-2 border-t mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button onClick={() => { setMobileOpen(false); i18n.changeLanguage('en'); }} className={`px-2 py-1 rounded ${i18n.language === 'en' ? 'bg-gray-100' : ''}`}>EN</button>
                  <button onClick={() => { setMobileOpen(false); i18n.changeLanguage('fr'); }} className={`px-2 py-1 rounded ${i18n.language === 'fr' ? 'bg-gray-100' : ''}`}>FR</button>
                </div>
                {user ? (
                  <div className="flex items-center space-x-2">
                    <button onClick={() => { setMobileOpen(false); navigate('/profile'); }} className="px-3 py-1 rounded text-sm text-gray-700">{profile?.full_name || t('header.profile')}</button>
                    <button onClick={() => { setMobileOpen(false); signOut(); }} className="px-3 py-1 rounded text-sm bg-red-50 text-red-600">{t('header.signout')}</button>
                  </div>
                ) : null}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

const DevTokenSetter = () => {
  const [token, setToken] = useState(localStorage.getItem('dev_token') || '');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [forceAuth, setForceAuth] = useState(localStorage.getItem('force_dev_auth') === 'true');

  const save = () => {
    if (token) {
      localStorage.setItem('dev_token', token);
    } else {
      localStorage.removeItem('dev_token');
    }
    // reload to ensure any existing UI/auth state picks up new token
    window.location.reload();
  };

  const toggleForce = () => {
    const next = !forceAuth;
    setForceAuth(next);
    if (next) {
      localStorage.setItem('force_dev_auth', 'true');
    } else {
      localStorage.removeItem('force_dev_auth');
    }
  };

  useEffect(() => {
    const onUnauth = () => {
      // refresh local token state and focus the input so developer can quickly paste one
      setToken(localStorage.getItem('dev_token') || '');
      setTimeout(() => inputRef.current?.focus(), 50);
    };
    window.addEventListener('api:unauthorized', onUnauth as EventListener);
    return () => window.removeEventListener('api:unauthorized', onUnauth as EventListener);
  }, []);

  return (
    <div className="flex items-center space-x-2">
      <input
        ref={inputRef}
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="dev:dev-user-1"
        className="px-2 py-1 border rounded text-sm"
      />
      <button onClick={save} className="px-3 py-1 bg-gray-100 rounded text-sm">Set</button>
      <button
        onClick={toggleForce}
        className={`px-3 py-1 rounded text-sm ${forceAuth ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}
        title="Force dev token into Authorization header for all API requests"
      >
        {forceAuth ? 'Force: ON' : 'Force: OFF'}
      </button>
    </div>
  );
};
