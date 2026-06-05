import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usersData from '../data/users.json';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t } = useLanguage();

  const rememberedEmail = localStorage.getItem('jhoraji_remembered_email') || '';
  const [email, setEmail] = useState(rememberedEmail);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(Boolean(rememberedEmail));
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    const user = usersData.find(u => u.email === email && u.password === password);
    if (user) {
      if (rememberMe) {
        localStorage.setItem('jhoraji_remembered_email', email);
      } else {
        localStorage.removeItem('jhoraji_remembered_email');
      }
      localStorage.setItem('jhoraji_user', JSON.stringify({ name: user.name || 'Administrador', email: user.email, role: user.role || 'Admin' }));
      addToast(t('loginSuccess'), 'success');
      navigate('/dashboard', { replace: true });
    } else {
      setError(t('loginError'));
    }
  };

  const whatsappMessage = encodeURIComponent('Hola Jhonny, necesito soporte técnico porque olvidé mis credenciales del panel de Jhoraji Tours.');
  const whatsappUrl = `https://wa.me/18295808964?text=${whatsappMessage}`;

  return (
    <>
      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          position: relative;
          overflow: hidden;
          background: linear-gradient(-45deg, #f8fafc, #f1f5f9, #e2e8f0, #f8fafc);
          background-size: 400% 400%;
          animation: gradientBG 15s ease infinite;
        }

        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .login-card {
          width: 100%;
          max-width: 380px;
          background: #ffffff;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          position: relative;
          z-index: 1;
          border: 1px solid rgba(0,0,0,0.05);
        }

        .login-logo-area {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .login-logo-img {
          width: 110px;
          height: auto;
          object-fit: contain;
          margin: 0 auto 5px auto;
          display: block;
        }

        .login-subtitle {
          color: #64748b;
          font-size: 0.85rem;
          margin-top: 0;
        }

        .login-error {
          background: #fef2f2;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.9rem;
          margin-bottom: 20px;
          text-align: center;
          border: 1px solid #fecaca;
          animation: shakeError 0.4s ease;
        }

        @keyframes shakeError {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }

        .login-field {
          margin-bottom: 1.2rem;
        }

        .login-label {
          display: block;
          margin-bottom: 6px;
          font-size: 0.9rem;
          font-weight: 600;
          color: #1e293b;
        }

        .login-input {
          width: 100%;
          padding: 12px 14px;
          border: 2px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.95rem;
          font-family: 'Poppins', sans-serif;
          color: #0f172a;
          background: #fff;
          outline: none;
          transition: all 0.3s ease;
          box-sizing: border-box;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02) inset;
        }

        .login-input:focus {
          border-color: #0ea5e9;
          box-shadow: 0 0 0 4px rgba(14,165,233,0.15);
        }

        .login-input::placeholder {
          color: #94a3b8;
        }

        .login-remember {
          display: flex;
          align-items: center;
          margin-bottom: 1.2rem;
        }

        .login-remember label {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          color: #334155;
          font-weight: 500;
        }

        .login-remember input[type="checkbox"] {
          accent-color: #0ea5e9;
          width: 16px;
          height: 16px;
        }

        .login-btn {
          width: 100%;
          padding: 12px;
          background: #0ea5e9;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .login-btn:hover {
          background: #0284c7;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(14,165,233,0.3);
        }

        .login-btn:active {
          transform: translateY(0);
        }

        .login-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 1.5rem 0 1rem;
          color: #64748b;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .login-divider::before,
        .login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e2e8f0;
        }

        .login-support-link {
          display: block;
          text-align: center;
          color: #0369a1;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.2s ease;
        }

        .login-support-link:hover {
          color: #0284c7;
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 1.5rem;
          }
        }
      `}</style>

      <div className="login-page">
        <div className="login-card">
          {/* Logo */}
          <div className="login-logo-area">
            <img
              src="/logo.png"
              alt="Jhoraji Tours"
              className="login-logo-img"
            />
            <p className="login-subtitle">{t('loginSubtitle')}</p>
          </div>

          {/* Error */}
          {error && <div className="login-error">{error}</div>}

          {/* Form */}
          <form onSubmit={handleLogin}>
            <div className="login-field">
              <label className="login-label">{t('email')}</label>
              <input
                type="email"
                className="login-input"
                placeholder="admin@jhorajitours.com"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
              />
            </div>

            <div className="login-field">
              <label className="login-label">{t('password')}</label>
              <input
                type="password"
                className="login-input"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
              />
            </div>

            <div className="login-remember">
              <label>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                {t('rememberMe')}
              </label>
            </div>

            <button type="submit" className="login-btn">
              {t('login')}
            </button>
          </form>

          {/* Support */}
          <div className="login-divider">{t('forgotCredentials')}</div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="login-support-link"
          >
            {t('contactSupport')}
          </a>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
