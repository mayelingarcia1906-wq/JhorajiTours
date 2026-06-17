import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, MessageCircle, Shield, Sparkles, Waves } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { default: users } = await import('../data/users.json');
      const matched = users.find(
        (u) => u.email === email.trim() && u.password === password
      );

      if (!matched) {
        setError(t('loginError'));
        triggerShake();
        addToast(t('loginError'), 'error');
        setLoading(false);
        return;
      }

      const userSession = {
        name: matched.name,
        email: matched.email,
        role: matched.role,
        avatar: matched.avatar,
        loggedAt: new Date().toISOString(),
      };
      localStorage.setItem('jhoraji_user', JSON.stringify(userSession));

      if (remember) {
        localStorage.setItem('jhoraji_remembered_email', email.trim());
      } else {
        localStorage.removeItem('jhoraji_remembered_email');
      }

      addToast(`Bienvenido, ${matched.name}`, 'success');
      navigate('/dashboard', { replace: true });
    } catch (e) {
      setError('Error al iniciar sesión');
      addToast('Error al iniciar sesión', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <aside className="login-art">
        <div className="login-art-content">
          <div className="login-art-top">
            <div className="login-art-logo">J</div>
            <div>
              <div className="login-art-brand">Jhoraji Tours</div>
              <div className="login-art-tagline">Operaciones · Punta Cana, RD</div>
            </div>
          </div>

          <div>
            <h1 className="login-art-headline">
              Tu operación,<br />
              <span>bajo control.</span>
            </h1>
            <p className="login-art-sub">
              Gestiona reservas, liquidaciones, choferes y proveedores desde un solo lugar.
              Diseñado para el ritmo del Caribe.
            </p>

            <div className="login-art-features">
              <div className="login-art-feature">
                <div className="login-art-feature-icon"><Waves size={16} /></div>
                <span>Reservas y traslados en tiempo real</span>
              </div>
              <div className="login-art-feature">
                <div className="login-art-feature-icon"><Sparkles size={16} /></div>
                <span>Liquidación semanal automatizada</span>
              </div>
              <div className="login-art-feature">
                <div className="login-art-feature-icon"><Shield size={16} /></div>
                <span>Roles, auditoría y permisos granulares</span>
              </div>
            </div>
          </div>

          <div className="login-art-bottom">
            © {new Date().getFullYear()} Jhoraji Tours · WhatsApp +1 (829) 580-8964
          </div>
        </div>
      </aside>

      <main className="login-form-wrap">
        <form className={`login-form ${shake ? 'shake' : ''}`} onSubmit={handleSubmit} noValidate>
          <div className="login-form-header">
            <h1>Bienvenido de vuelta</h1>
            <p>Ingresa tus credenciales para acceder al panel.</p>
          </div>

          {error && (
            <div className="login-credentials" style={{ background: 'var(--danger-soft)', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <div className="form-group" style={{ marginTop: error ? '1.25rem' : 0 }}>
            <label htmlFor="email">Correo electrónico</label>
            <div className="input-with-icon">
              <Mail size={16} />
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="operador@jhorajitours.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-with-icon">
              <Lock size={16} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                className="toggle-eye"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: '1.5rem' }}>
            <label className="d-flex align-items-center gap-2" style={{ fontSize: '0.85rem', color: 'var(--text-medium)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Recordar mi correo
            </label>
            <a
              href="https://wa.me/18295808964?text=Hola%20Jhonny%2C%20necesito%20ayuda%20con%20mi%20cuenta"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <MessageCircle size={14} /> Soporte
            </a>
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar al panel'}
          </button>

        </form>
      </main>
    </div>
  );
};

export default LoginPage;
