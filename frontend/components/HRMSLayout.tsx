'use client';

import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';

type HRMSLayoutProps = {
  children: ReactNode;
  title?: string;
};

export default function HRMSLayout({
  children,
  title = 'Dashboard',
}: HRMSLayoutProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '▦' },
    { label: 'Employees', path: '/employees', icon: '👥' },
    { label: 'Attendance', path: '/attendance', icon: '◷' },
    { label: 'Leave', path: '/leave', icon: '🏖' },
    { label: 'Payroll', path: '/payroll', icon: '₹' },
    { label: 'Recruitment', path: '/recruitment', icon: '💼' },
    { label: 'Performance', path: '/performance', icon: '🎯' },
    { label: 'Training', path: '/training', icon: '🎓' },
    { label: 'Documents', path: '/documents', icon: '📄' },
    { label: 'Announcements', path: '/announcements', icon: '📢' },
    { label: 'Reports', path: '/reports', icon: '📊' },
    { label: 'Settings', path: '/settings', icon: '⚙' },
  ];

  const logout = () => {
    localStorage.removeItem('hrms_token');
    localStorage.removeItem('hrms_user');
    router.push('/login');
  };

  return (
    <div className="hrms-shell">
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-logo">H</div>

          <div>
            <div className="brand-title">HRMS</div>
            <div className="brand-subtitle">Human Resources</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">MAIN MENU</div>

          {menuItems.map((item) => (
            <button
              key={item.path}
              className="nav-item"
              onClick={() => {
                setMobileOpen(false);
                router.push(item.path);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="logout-button" onClick={logout}>
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu-button"
            onClick={() => setMobileOpen(true)}
          >
            ☰
          </button>

          <div>
            <h1>{title}</h1>
            <p>Manage your HR activities from one place.</p>
          </div>

          <div className="topbar-actions">
            <button className="icon-button" title="Notifications">
              🔔
            </button>

            <div className="user-profile">
              <div className="avatar">U</div>

              <div className="user-info">
                <strong>HRMS User</strong>
                <span>Employee</span>
              </div>
            </div>
          </div>
        </header>

        <section className="page-content">
          {children}
        </section>
      </main>
    </div>
  );
}