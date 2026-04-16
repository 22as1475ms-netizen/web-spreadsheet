import { useEffect, useMemo, useState } from 'react';

import API from '../api';
import BrandMark from '../components/BrandMark';

const initialLoginForm = {
  email: '',
  password: ''
};

const initialRegisterForm = {
  name: '',
  email: '',
  password: ''
};

const authModeContent = {
  login: {
    badge: 'Sign In',
    title: 'Pick up where your workbook left off',
    description:
      'Open your spreadsheet workspace, recent files, and saved sheet layouts from one focused dashboard.',
    submitLabel: 'Log In',
    switchPrompt: 'Need an account?',
    switchLabel: 'Create one'
  },
  register: {
    badge: 'Create Account',
    title: 'Set up your workbook space in a minute',
    description:
      'Create an account so your spreadsheet tools, exports, and future API-backed features are ready to go.',
    submitLabel: 'Register',
    switchPrompt: 'Already have an account?',
    switchLabel: 'Sign in'
  }
};

export default function Login({ onSuccess }) {
  const [mode, setMode] = useState('login');
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');

  const content = authModeContent[mode];
  const activeForm = mode === 'login' ? loginForm : registerForm;
  const summaryChips = useMemo(
    () => ['Workbook imports', 'Sheet tools', 'Recent files'],
    []
  );

  function updateField(field, value) {
    if (mode === 'login') {
      setLoginForm((current) => ({ ...current, [field]: value }));
      return;
    }

    setRegisterForm((current) => ({ ...current, [field]: value }));
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setMessage('');
    setMessageType('error');
  }

  useEffect(() => {
    let isMounted = true;

    async function checkServer() {
      try {
        await API.healthcheck();
        if (isMounted) {
          setServerStatus('online');
        }
      } catch {
        if (isMounted) {
          setServerStatus('offline');
        }
      }
    }

    checkServer();
    const timer = window.setInterval(checkServer, 15000);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setMessageType('error');

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = await API.post(endpoint, activeForm);
      setServerStatus('online');

      if (mode === 'register') {
        setMode('login');
        setLoginForm({
          email: registerForm.email,
          password: ''
        });
        setRegisterForm(initialRegisterForm);
        setMessage('Account created. Sign in to open your own workspace.');
        setMessageType('success');
        return;
      }

      localStorage.setItem('token', payload.token);
      onSuccess?.(payload);
    } catch (error) {
      setMessage(error.message || 'Unable to complete the request.');
      setMessageType('error');
      if (/Unable to reach the backend/i.test(error.message || '')) {
        setServerStatus('offline');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-scene">
      <div className="auth-scene__visual">
        <div className="auth-scene__brand">
          <BrandMark />
        </div>

        <div className="auth-scene__copy">
          <div className="login-card__badge">Workbook System</div>
          <h1>Shape spreadsheets like a workspace, not just a grid.</h1>
          <p>
            Build sheets, headings, formulas, formatting, and exports from one browser-based canvas
            that feels closer to a lightweight desktop workbook.
          </p>
          <div className="login-card__summary">
            {summaryChips.map((chip) => (
              <span key={chip}>{chip}</span>
            ))}
          </div>
        </div>

        <div className="auth-scene__preview" aria-hidden="true">
          <div className="auth-scene__preview-bar">
            <span />
            <span />
            <span />
          </div>
          <div className="auth-scene__preview-grid">
            <div className="auth-scene__preview-heading">Quarterly Operations</div>
            <div className="auth-scene__preview-subheading">Regional Summary</div>
            <div className="auth-scene__preview-table">
              <div>Region</div>
              <div>Status</div>
              <div>Rows</div>
              <div>North Cluster</div>
              <div>Active</div>
              <div>124</div>
              <div>Central Cluster</div>
              <div>Review</div>
              <div>88</div>
            </div>
          </div>
        </div>
      </div>

      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-card__header">
          <div className="login-card__badge">{content.badge}</div>
          <h2>{content.title}</h2>
          <p>{content.description}</p>
        </div>

        <div className="login-card__hint">
          Use the backend account service for authentication, then continue into the local workbook
          launcher with your session attached.
        </div>

        {serverStatus === 'offline' ? (
          <p className="message error">
            Backend offline. Start the backend server on port `4000`, then try again.
          </p>
        ) : null}

        {serverStatus === 'checking' ? (
          <p className="message info">Checking backend connection...</p>
        ) : null}

        {message ? <p className={`message ${messageType}`}>{message}</p> : null}

        {mode === 'register' ? (
          <label className="field">
            <span>Full Name</span>
            <input
              autoComplete="name"
              value={registerForm.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="Enter your name"
              required
            />
          </label>
        ) : null}

        <label className="field">
          <span>Email</span>
          <input
            autoComplete="email"
            type="email"
            value={activeForm.email}
            onChange={(event) => updateField('email', event.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            type="password"
            value={activeForm.password}
            onChange={(event) => updateField('password', event.target.value)}
            placeholder="Enter your password"
            required
          />
        </label>

        <div className="actions">
          <button className="btn primary login-card__submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Working...' : content.submitLabel}
          </button>
          <button
            className="btn secondary"
            type="button"
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            disabled={isSubmitting}
          >
            {content.switchLabel}
          </button>
        </div>

        <p>
          {content.switchPrompt}{' '}
          <button
            className="login-card__switch"
            type="button"
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            disabled={isSubmitting}
          >
            {content.switchLabel}
          </button>
        </p>
      </form>
    </section>
  );
}
