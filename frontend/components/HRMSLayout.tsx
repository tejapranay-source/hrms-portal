
'use client';

import {
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

type HRMSLayoutProps = {
  children: ReactNode;
  title?: string;
};

type IconName =
  | 'dashboard'
  | 'employees'
  | 'attendance'
  | 'leave'
  | 'payroll'
  | 'recruitment'
  | 'performance'
  | 'training'
  | 'documents'
  | 'announcements'
  | 'reports'
  | 'settings'
  | 'logout'
  | 'menu'
  | 'bell'
  | 'close'
  | 'check'
  | 'sun'
  | 'moon';

const iconPaths: Record<IconName, string> = {
  dashboard: `
    <rect x="3" y="3" width="7" height="7" rx="1"></rect>
    <rect x="14" y="3" width="7" height="7" rx="1"></rect>
    <rect x="3" y="14" width="7" height="7" rx="1"></rect>
    <rect x="14" y="14" width="7" height="7" rx="1"></rect>
  `,

  employees: `
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  `,

  attendance: `
    <circle cx="12" cy="12" r="9"></circle>
    <path d="M12 7v5l3 2"></path>
  `,

  leave: `
    <rect x="3" y="4" width="18" height="17" rx="2"></rect>
    <path d="M16 2v4"></path>
    <path d="M8 2v4"></path>
    <path d="M3 10h18"></path>
    <path d="M8 14h2"></path>
    <path d="M14 14h2"></path>
    <path d="M8 17h2"></path>
  `,

  payroll: `
    <rect x="3" y="5" width="18" height="14" rx="2"></rect>
    <path d="M3 10h18"></path>
    <path d="M7 15h3"></path>
    <circle cx="16.5" cy="15" r="1.5"></circle>
  `,

  recruitment: `
    <rect x="3" y="7" width="18" height="13" rx="2"></rect>
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <path d="M3 12h18"></path>
    <path d="M10 12v2h4v-2"></path>
  `,

  performance: `
    <circle cx="12" cy="12" r="9"></circle>
    <circle cx="12" cy="12" r="5"></circle>
    <circle cx="12" cy="12" r="1"></circle>
  `,

  training: `
    <path d="M2 10l10-5 10 5-10 5L2 10Z"></path>
    <path d="M6 12.5V17c3 2 9 2 12 0v-4.5"></path>
    <path d="M22 10v6"></path>
  `,

  documents: `
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path>
    <path d="M14 2v6h6"></path>
    <path d="M8 13h8"></path>
    <path d="M8 17h6"></path>
  `,

  announcements: `
    <path d="M3 11v2a2 2 0 0 0 2 2h2l3 5h2l-2-5 10-4V7L7 11H5a2 2 0 0 0-2 2Z"></path>
    <path d="M20 7v10"></path>
  `,

  reports: `
    <path d="M4 19V5"></path>
    <path d="M4 19h17"></path>
    <rect x="7" y="12" width="3" height="4" rx="0.5"></rect>
    <rect x="12" y="9" width="3" height="7" rx="0.5"></rect>
    <rect x="17" y="6" width="3" height="10" rx="0.5"></rect>
  `,

  settings: `
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19 13.5a7.5 7.5 0 0 0 0-3"></path>
    <path d="M16.5 19a7.5 7.5 0 0 0 1.5-2.5"></path>
    <path d="M7.5 19a7.5 7.5 0 0 1-1.5-2.5"></path>
    <path d="M5 13.5a7.5 7.5 0 0 1 0-3"></path>
    <path d="M7.5 5a7.5 7.5 0 0 1 2.5-1"></path>
    <path d="M14 4a7.5 7.5 0 0 1 2.5 1"></path>
  `,

  logout: `
    <path d="M10 17l5-5-5-5"></path>
    <path d="M15 12H3"></path>
    <path d="M21 19V5a2 2 0 0 0-2-2h-5"></path>
  `,

  menu: `
    <path d="M4 6h16"></path>
    <path d="M4 12h16"></path>
    <path d="M4 18h16"></path>
  `,

  bell: `
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>
    <path d="M10 21h4"></path>
  `,

  close: `
    <path d="M6 6l12 12"></path>
    <path d="M18 6L6 18"></path>
  `,

  check: `
    <path d="M20 6L9 17l-5-5"></path>
  `,

  sun: `
    <circle cx="12" cy="12" r="4"></circle>
    <path d="M12 2v2"></path>
    <path d="M12 20v2"></path>
    <path d="M4.93 4.93l1.42 1.42"></path>
    <path d="M17.65 17.65l1.42 1.42"></path>
    <path d="M2 12h2"></path>
    <path d="M20 12h2"></path>
    <path d="M4.93 19.07l1.42-1.42"></path>
    <path d="M17.65 6.35l1.42-1.42"></path>
  `,

  moon: `
    <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z"></path>
  `,
};

function Icon({
  name,
  size = 18,
}: {
  name: IconName;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{
        __html: iconPaths[name],
      }}
    />
  );
}

export default function HRMSLayout({
  children,
  title = 'Dashboard',
}: HRMSLayoutProps) {
  const router = useRouter();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [darkMode, setDarkMode] =
    useState(false);

  /*
   * Load saved theme
   */
  useEffect(() => {
    const savedTheme =
      localStorage.getItem('hrms_theme');

    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add(
        'hrms-dark'
      );
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove(
        'hrms-dark'
      );
    }
  }, []);

  /*
   * Change theme
   */
  const toggleTheme = () => {
    setDarkMode((currentMode) => {
      const newMode = !currentMode;

      if (newMode) {
        localStorage.setItem(
          'hrms_theme',
          'dark'
        );

        document.documentElement.classList.add(
          'hrms-dark'
        );
      } else {
        localStorage.setItem(
          'hrms_theme',
          'light'
        );

        document.documentElement.classList.remove(
          'hrms-dark'
        );
      }

      return newMode;
    });
  };

  /*
   * Notifications
   */
  const [notifications, setNotifications] =
    useState([
      {
        id: 1,
        title: 'Welcome to HRMS',
        message:
          'Your HRMS dashboard is ready to use.',
        time: 'Just now',
        unread: true,
      },
      {
        id: 2,
        title: 'Attendance Reminder',
        message:
          'Please make sure your attendance is updated.',
        time: 'Today',
        unread: true,
      },
      {
        id: 3,
        title: 'Leave Management',
        message:
          'Check your pending leave requests.',
        time: 'Today',
        unread: false,
      },
    ]);

  const menuItems: {
    label: string;
    path: string;
    icon: IconName;
  }[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'dashboard',
    },
    {
      label: 'Employees',
      path: '/employees',
      icon: 'employees',
    },
    {
      label: 'Attendance',
      path: '/attendance',
      icon: 'attendance',
    },
    {
      label: 'Leave',
      path: '/leave',
      icon: 'leave',
    },
    {
      label: 'Payroll',
      path: '/payroll',
      icon: 'payroll',
    },
    {
      label: 'Recruitment',
      path: '/recruitment',
      icon: 'recruitment',
    },
    {
      label: 'Performance',
      path: '/performance',
      icon: 'performance',
    },
    {
      label: 'Training',
      path: '/training',
      icon: 'training',
    },
    {
      label: 'Documents',
      path: '/documents',
      icon: 'documents',
    },
    {
      label: 'Announcements',
      path: '/announcements',
      icon: 'announcements',
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: 'reports',
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: 'settings',
    },
  ];

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          notification.unread
      ).length,
    [notifications]
  );

  /*
   * Mark every notification as read
   */
  const markAllAsRead = () => {
    setNotifications(
      (currentNotifications) =>
        currentNotifications.map(
          (notification) => ({
            ...notification,
            unread: false,
          })
        )
    );

    setNotificationsOpen(false);
  };

  /*
   * Mark individual notification as read
   */
  const markNotificationAsRead = (
    notificationId: number
  ) => {
    setNotifications(
      (currentNotifications) =>
        currentNotifications.map(
          (notification) =>
            notification.id ===
            notificationId
              ? {
                  ...notification,
                  unread: false,
                }
              : notification
        )
    );
  };

  const logout = () => {
    localStorage.removeItem('hrms_token');
    localStorage.removeItem('hrms_user');

    router.push('/login');
  };

  return (
    <div
      className={`hrms-shell ${
        darkMode ? 'hrms-dark-mode' : ''
      }`}
    >
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() =>
            setMobileOpen(false)
          }
        />
      )}

      <aside
        className={`sidebar ${
          mobileOpen
            ? 'sidebar-open'
            : ''
        }`}
      >
        <div className="brand">
          <div className="brand-logo">
            H
          </div>

          <div>
            <div className="brand-title">
              HRMS
            </div>

            <div className="brand-subtitle">
              Human Resources
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">
            MAIN MENU
          </div>

          {menuItems.map((item) => (
            <button
              key={item.path}
              type="button"
              className="nav-item"
              onClick={() => {
                setMobileOpen(false);
                router.push(item.path);
              }}
            >
              <span className="nav-icon">
                <Icon
                  name={item.icon}
                  size={18}
                />
              </span>

              <span>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">

          {/* THEME BUTTON */}
          <button
            type="button"
            className="theme-button"
            onClick={toggleTheme}
            title={
              darkMode
                ? 'Switch to light mode'
                : 'Switch to dark mode'
            }
          >
            <span className="nav-icon">
              <Icon
                name={
                  darkMode
                    ? 'sun'
                    : 'moon'
                }
                size={18}
              />
            </span>

            <span>
              {darkMode
                ? 'Light Mode'
                : 'Dark Mode'}
            </span>
          </button>

          {/* LOGOUT */}
          <button
            type="button"
            className="logout-button"
            onClick={logout}
          >
            <span className="nav-icon">
              <Icon
                name="logout"
                size={18}
              />
            </span>

            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() =>
              setMobileOpen(true)
            }
            aria-label="Open menu"
            title="Open menu"
          >
            <Icon
              name="menu"
              size={20}
            />
          </button>

          <div>
            <h1>{title}</h1>

            <p>
              Manage your HR activities from
              one place.
            </p>
          </div>

          <div className="topbar-actions">

            {/* NOTIFICATIONS */}
            <div className="notification-wrapper">

              <button
                type="button"
                className="icon-button notification-button"
                title="Notifications"
                aria-label="Notifications"
                onClick={() =>
                  setNotificationsOpen(
                    (current) =>
                      !current
                  )
                }
              >
                <Icon
                  name="bell"
                  size={19}
                />

                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="notification-panel">

                  <div className="notification-header">

                    <div>
                      <h3>
                        Notifications
                      </h3>

                      <span>
                        {unreadCount}{' '}
                        unread
                      </span>
                    </div>

                    <button
                      type="button"
                      className="notification-close"
                      onClick={() =>
                        setNotificationsOpen(
                          false
                        )
                      }
                      aria-label="Close notifications"
                      title="Close"
                    >
                      <Icon
                        name="close"
                        size={17}
                      />
                    </button>

                  </div>

                  <div className="notification-list">

                    {notifications.length ===
                    0 ? (
                      <div className="empty-notifications">

                        <Icon
                          name="check"
                          size={22}
                        />

                        <strong>
                          No notifications
                        </strong>

                        <span>
                          You're all caught up.
                        </span>

                      </div>
                    ) : (
                      notifications.map(
                        (notification) => (
                          <button
                            key={
                              notification.id
                            }
                            type="button"
                            className={`notification-item ${
                              notification.unread
                                ? 'notification-unread'
                                : ''
                            }`}
                            onClick={() =>
                              markNotificationAsRead(
                                notification.id
                              )
                            }
                          >

                            <div className="notification-icon">
                              <Icon
                                name="bell"
                                size={16}
                              />
                            </div>

                            <div className="notification-content">

                              <strong>
                                {
                                  notification.title
                                }
                              </strong>

                              <p>
                                {
                                  notification.message
                                }
                              </p>

                              <span>
                                {
                                  notification.time
                                }
                              </span>

                            </div>

                            {notification.unread && (
                              <span className="unread-dot" />
                            )}

                          </button>
                        )
                      )
                    )}

                  </div>

                  {unreadCount > 0 && (
                    <div className="notification-footer">

                      <button
                        type="button"
                        onClick={
                          markAllAsRead
                        }
                      >
                        <Icon
                          name="check"
                          size={15}
                        />

                        Mark all as read
                      </button>

                    </div>
                  )}

                </div>
              )}

            </div>

            {/* USER */}
            <div className="user-profile">

              <div className="avatar">
                U
              </div>

              <div className="user-info">

                <strong>
                  HRMS User
                </strong>

                <span>
                  Employee
                </span>

              </div>

            </div>

          </div>
        </header>

        <section className="page-content">
          {children}
        </section>
      </main>

      <style jsx>{`

        /* =========================
           THEME BUTTON
        ========================= */

        .theme-button {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          margin-bottom: 7px;
          border: 0;
          border-radius: 9px;
          background: transparent;
          color: inherit;
          font-size: 13px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .theme-button:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        /* =========================
           NOTIFICATIONS
        ========================= */

        .notification-wrapper {
          position: relative;
        }

        .notification-button {
          position: relative;
        }

        .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: #dc2626;
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          line-height: 1;
          border: 2px solid #ffffff;
        }

        .notification-panel {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 370px;
          max-width: calc(100vw - 32px);
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          box-shadow:
            0 18px 45px
              rgba(15, 23, 42, 0.14),
            0 4px 12px
              rgba(15, 23, 42, 0.06);
          overflow: hidden;
          z-index: 1000;
        }

        .notification-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 18px 14px;
          border-bottom: 1px solid #eef2f7;
        }

        .notification-header h3 {
          margin: 0;
          color: #0f172a;
          font-size: 16px;
          font-weight: 700;
        }

        .notification-header span {
          display: block;
          margin-top: 3px;
          color: #64748b;
          font-size: 12px;
        }

        .notification-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #ffffff;
          color: #64748b;
          cursor: pointer;
        }

        .notification-close:hover {
          background: #f8fafc;
          color: #0f172a;
        }

        .notification-list {
          max-height: 360px;
          overflow-y: auto;
        }

        .notification-item {
          position: relative;
          width: 100%;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 15px 18px;
          border: 0;
          border-bottom: 1px solid #f1f5f9;
          background: #ffffff;
          text-align: left;
          cursor: pointer;
          transition:
            background 0.15s ease;
        }

        .notification-item:hover {
          background: #f8fafc;
        }

        .notification-unread {
          background: #f8fbff;
        }

        .notification-icon {
          flex: 0 0 34px;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #eff6ff;
          color: #2563eb;
        }

        .notification-content {
          min-width: 0;
          padding-right: 8px;
        }

        .notification-content strong {
          display: block;
          color: #1e293b;
          font-size: 13px;
          font-weight: 700;
        }

        .notification-content p {
          margin: 4px 0;
          color: #64748b;
          font-size: 12px;
          line-height: 1.45;
        }

        .notification-content span {
          color: #94a3b8;
          font-size: 11px;
        }

        .unread-dot {
          position: absolute;
          top: 18px;
          right: 15px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2563eb;
        }

        .notification-footer {
          padding: 11px 16px;
          border-top: 1px solid #eef2f7;
          background: #fafafa;
        }

        .notification-footer button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 9px 12px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #2563eb;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .notification-footer button:hover {
          background: #eff6ff;
        }

        .empty-notifications {
          min-height: 180px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 7px;
          color: #64748b;
          text-align: center;
        }

        .empty-notifications svg {
          color: #16a34a;
          margin-bottom: 4px;
        }

        .empty-notifications strong {
          color: #334155;
          font-size: 14px;
        }

        .empty-notifications span {
          color: #94a3b8;
          font-size: 12px;
        }

        /* =========================
           DARK THEME
        ========================= */

        .hrms-dark-mode {
          background: #0f172a;
          color: #e2e8f0;
        }

        .hrms-dark-mode .main-area {
          background: #0f172a;
        }

        .hrms-dark-mode .topbar {
          background: #111827 !important;
          border-bottom-color: #1e293b !important;
          color: #f8fafc;
        }

        .hrms-dark-mode .topbar h1 {
          color: #f8fafc !important;
        }

        .hrms-dark-mode .topbar p {
          color: #94a3b8 !important;
        }

        .hrms-dark-mode .page-content {
          background: #0f172a;
        }

        .hrms-dark-mode .icon-button {
          background: #1e293b !important;
          border-color: #334155 !important;
          color: #e2e8f0 !important;
        }

        .hrms-dark-mode .icon-button:hover {
          background: #334155 !important;
        }

        .hrms-dark-mode .user-profile {
          color: #e2e8f0;
        }

        .hrms-dark-mode .user-info strong {
          color: #f8fafc !important;
        }

        .hrms-dark-mode .user-info span {
          color: #94a3b8 !important;
        }

        /*
         * Common cards / containers
         */
        .hrms-dark-mode .card,
        .hrms-dark-mode .dashboard-card,
        .hrms-dark-mode .stat-card,
        .hrms-dark-mode .panel,
        .hrms-dark-mode .section-card,
        .hrms-dark-mode .content-card,
        .hrms-dark-mode .table-card,
        .hrms-dark-mode .form-card,
        .hrms-dark-mode .modal-content {
          background: #111827 !important;
          border-color: #1e293b !important;
          color: #e2e8f0 !important;
        }

        /*
         * Common text
         */
        .hrms-dark-mode h1,
        .hrms-dark-mode h2,
        .hrms-dark-mode h3,
        .hrms-dark-mode h4,
        .hrms-dark-mode h5,
        .hrms-dark-mode strong,
        .hrms-dark-mode label {
          color: #f8fafc !important;
        }

        .hrms-dark-mode p,
        .hrms-dark-mode small,
        .hrms-dark-mode .muted,
        .hrms-dark-mode .subtitle,
        .hrms-dark-mode .description {
          color: #94a3b8 !important;
        }

        /*
         * Inputs
         */
        .hrms-dark-mode input,
        .hrms-dark-mode select,
        .hrms-dark-mode textarea {
          background: #0f172a !important;
          color: #e2e8f0 !important;
          border-color: #334155 !important;
        }

        .hrms-dark-mode input::placeholder,
        .hrms-dark-mode textarea::placeholder {
          color: #64748b !important;
        }

        /*
         * Tables
         */
        .hrms-dark-mode table {
          background: #111827 !important;
          color: #e2e8f0 !important;
        }

        .hrms-dark-mode th {
          background: #1e293b !important;
          color: #cbd5e1 !important;
          border-color: #334155 !important;
        }

        .hrms-dark-mode td {
          color: #cbd5e1 !important;
          border-color: #1e293b !important;
        }

        .hrms-dark-mode tr:hover td {
          background: #172033 !important;
        }

        /*
         * Buttons
         */
        .hrms-dark-mode button:not(.nav-item):not(.logout-button):not(.theme-button) {
          color: #e2e8f0;
        }

        /*
         * Notification dark theme
         */
        .hrms-dark-mode .notification-panel {
          background: #111827 !important;
          border-color: #334155 !important;
          box-shadow:
            0 20px 50px
              rgba(0, 0, 0, 0.45);
        }

        .hrms-dark-mode .notification-header {
          border-bottom-color: #1e293b;
        }

        .hrms-dark-mode .notification-header h3 {
          color: #f8fafc;
        }

        .hrms-dark-mode .notification-header span {
          color: #94a3b8;
        }

        .hrms-dark-mode .notification-close {
          background: #1e293b;
          border-color: #334155;
          color: #cbd5e1;
        }

        .hrms-dark-mode .notification-close:hover {
          background: #334155;
          color: #ffffff;
        }

        .hrms-dark-mode .notification-item {
          background: #111827;
          border-bottom-color: #1e293b;
        }

        .hrms-dark-mode .notification-item:hover {
          background: #172033;
        }

        .hrms-dark-mode .notification-unread {
          background: #172033;
        }

        .hrms-dark-mode .notification-content strong {
          color: #f1f5f9;
        }

        .hrms-dark-mode .notification-content p {
          color: #94a3b8;
        }

        .hrms-dark-mode .notification-content span {
          color: #64748b;
        }

        .hrms-dark-mode .notification-footer {
          background: #0f172a;
          border-top-color: #1e293b;
        }

        .hrms-dark-mode .notification-footer button:hover {
          background: #1e293b;
        }

        .hrms-dark-mode .empty-notifications strong {
          color: #f1f5f9;
        }

        .hrms-dark-mode .empty-notifications span {
          color: #94a3b8;
        }

        /*
         * Mobile
         */
        @media (max-width: 600px) {
          .notification-panel {
            position: fixed;
            top: 70px;
            right: 16px;
            width: calc(100vw - 32px);
          }
        }

      `}</style>
    </div>
  );
}

