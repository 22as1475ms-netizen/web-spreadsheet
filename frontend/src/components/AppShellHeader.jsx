import { useEffect, useRef, useState } from 'react';

import BrandMark from './BrandMark';

function getInitials(name = '') {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return 'WS';
  }

  return parts.map((part) => part[0]?.toUpperCase() || '').join('');
}

export default function AppShellHeader({
  session,
  navItems = [],
  contextLabel,
  contextValue,
  contextMeta,
  actions = [],
  onBrandClick,
  className = ''
}) {
  const userName = session?.user?.name || 'Workspace User';
  const userEmail = session?.user?.email || 'Signed in account';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [isMenuOpen]);

  return (
    <header className={`shell-header ${className}`.trim()}>
      <div className="shell-header__brand">
        {onBrandClick ? (
          <button className="shell-header__brand-button" type="button" onClick={onBrandClick}>
            <BrandMark compact />
          </button>
        ) : (
          <BrandMark compact />
        )}
      </div>

      {navItems.length > 0 ? (
        <nav className="shell-header__nav" aria-label="Product navigation">
          {navItems.map((item) => (
            <span
              key={item.label}
              className={`shell-header__nav-item ${item.active ? 'shell-header__nav-item--active' : ''}`.trim()}
            >
              {item.label}
            </span>
          ))}
        </nav>
      ) : null}

      <div className="shell-header__context">
        {contextLabel ? <span className="shell-header__context-label">{contextLabel}</span> : null}
        <strong>{contextValue}</strong>
        {contextMeta ? <small>{contextMeta}</small> : null}
      </div>

      <div className="shell-header__right">
        <div className="shell-header__account-menu" ref={menuRef}>
          <button
            className="shell-header__account shell-header__account-toggle"
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
          >
            <div className="shell-header__avatar" aria-hidden="true">
              {getInitials(userName)}
            </div>
            <div className="shell-header__identity">
              <strong>{userName}</strong>
              <small>{userEmail}</small>
            </div>
            {actions.length > 0 ? <span className="shell-header__caret">▾</span> : null}
          </button>

          {actions.length > 0 && isMenuOpen ? (
            <div className="shell-header__menu" role="menu" aria-label="Account actions">
              {actions.map((action) => (
                <button
                  key={action.label}
                  className={`shell-header__menu-item ${action.variant ? `shell-header__menu-item--${action.variant}` : ''}`.trim()}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    action.onClick?.();
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="shell-header__actions shell-header__actions--hidden" aria-hidden="true">
          {actions.map((action) => (
            <button
              key={action.label}
              className={`shell-header__action ${action.variant ? `shell-header__action--${action.variant}` : ''}`.trim()}
              type="button"
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
