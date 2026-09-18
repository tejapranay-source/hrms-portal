'use client';

import { useEffect, useState } from 'react';
import HRMSLayout from '../../components/HRMSLayout';

type User = {
  id: number;
  email: string;
  role: string;
};

type Stats = {
  employees?: number;
  presentToday?: number;
  onLeaveToday?: number;
  pendingLeaves?: number;
};

type Attendance = {
  id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  worked_minutes: number | null;
  status: string;
};

type Announcement = {
  id: string;
  title: string;
  message: string;
  created_at: string;
};

type IconName =
  | 'users'
  | 'check'
  | 'calendar'
  | 'clock'
  | 'user'
  | 'money'
  | 'document'
  | 'megaphone'
  | 'arrowIn'
  | 'arrowOut'
  | 'arrowRight';

function Icon({
  name,
  size = 20,
}: {
  name: IconName;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (name) {
    case 'users':
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );

    case 'check':
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );

    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );

    case 'user':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );

    case 'money':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="12" cy="12" r="3" />
          <path d="M7 9h.01M17 15h.01" />
        </svg>
      );

    case 'document':
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M8 13h8M8 17h6" />
        </svg>
      );

    case 'megaphone':
      return (
        <svg {...common}>
          <path d="m3 11 15-5v12L3 13z" />
          <path d="M18 9h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" />
          <path d="m7 14 2 6" />
        </svg>
      );

    case 'arrowIn':
      return (
        <svg {...common}>
          <path d="M3 12h13" />
          <path d="m11 7 5 5-5 5" />
          <path d="M20 5v14" />
        </svg>
      );

    case 'arrowOut':
      return (
        <svg {...common}>
          <path d="M21 12H8" />
          <path d="m13 7-5 5 5 5" />
          <path d="M4 5v14" />
        </svg>
      );

    case 'arrowRight':
      return (
        <svg {...common}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );

    default:
      return null;
  }
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>({});
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('hrms_token');
    const storedUser = localStorage.getItem('hrms_user');

    if (!token) {
      window.location.href = '/login';
      return;
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Unable to read stored user:', error);
      }
    }

    loadDashboard(token);
  }, []);

  function getTodayDate() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  async function loadDashboard(token: string) {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [
        statsResponse,
        attendanceResponse,
        announcementsResponse,
      ] = await Promise.all([
        fetch('http://localhost:5000/api/dashboard/stats', {
          headers,
        }),

        fetch('http://localhost:5000/api/attendance/me', {
          headers,
        }),

        fetch('http://localhost:5000/api/announcements', {
          headers,
        }),
      ]);

      if (statsResponse.ok) {
        setStats(await statsResponse.json());
      }

      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json();

        const records: Attendance[] = Array.isArray(
          attendanceData
        )
          ? attendanceData
          : [];

        setAttendance(records);
      } else {
        setAttendance([]);
      }

      if (announcementsResponse.ok) {
        const announcementData =
          await announcementsResponse.json();

        setAnnouncements(
          Array.isArray(announcementData)
            ? announcementData
            : []
        );
      } else {
        setAnnouncements([]);
      }
    } catch (error) {
      console.error('Dashboard loading error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function attendanceAction(
    action: 'check-in' | 'check-out'
  ) {
    const token = localStorage.getItem('hrms_token');

    if (!token) {
      window.location.href = '/login';
      return;
    }

    const today = getTodayDate();

    const todayRecord = attendance.find(
      (record) =>
        record.attendance_date.slice(0, 10) === today
    );

    if (action === 'check-in' && todayRecord?.check_in) {
      setMessage('You have already checked in today.');
      return;
    }

    if (action === 'check-out' && !todayRecord?.check_in) {
      setMessage('Please check in before checking out.');
      return;
    }

    if (action === 'check-out' && todayRecord?.check_out) {
      setMessage('You have already checked out today.');
      return;
    }

    setActionLoading(true);
    setMessage('');

    try {
      const response = await fetch(
        `http://localhost:5000/api/attendance/${action}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data?.message ||
            'Unable to update attendance. Please try again.'
        );
        return;
      }

      setMessage(
        data?.message ||
          'Attendance updated successfully.'
      );

      await loadDashboard(token);
    } catch (error) {
      console.error('Attendance action error:', error);

      setMessage(
        'Unable to connect to the HRMS server.'
      );
    } finally {
      setActionLoading(false);
    }
  }

  const formatTime = (
    value: string | null | undefined
  ) => {
    if (!value) return '--';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '--';
    }

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '--';
    }

    return date.toLocaleDateString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDisplayName = () => {
    if (!user?.email) return 'User';

    return user.email
      .split('@')[0]
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const today = getTodayDate();

  const todayAttendance =
    attendance.find(
      (record) =>
        record.attendance_date.slice(0, 10) === today
    ) ?? null;

  const hasCheckedIn = Boolean(
    todayAttendance?.check_in
  );

  const hasCheckedOut = Boolean(
    todayAttendance?.check_out
  );

  const attendanceStatus =
    todayAttendance?.status || 'NOT MARKED';

  const checkInDisabled =
    actionLoading || hasCheckedIn;

  const checkOutDisabled =
    actionLoading ||
    !hasCheckedIn ||
    hasCheckedOut;

  return (
    <HRMSLayout title="Dashboard">
      <div className="dashboard-container">
        <section className="welcome-section">
          <div>
            <p className="eyebrow">HRMS PORTAL</p>

            <h2>
              Welcome back, {getDisplayName()}
            </h2>

            <p>
              Here&apos;s what&apos;s happening with your HR
              activities today.
            </p>
          </div>

          <div className="role-badge">
            {user?.role || 'EMPLOYEE'}
          </div>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Icon name="users" />
            </div>

            <div>
              <span>Total Employees</span>

              <strong>
                {loading
                  ? '...'
                  : stats.employees ?? 0}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Icon name="check" />
            </div>

            <div>
              <span>Present Today</span>

              <strong>
                {loading
                  ? '...'
                  : stats.presentToday ?? 0}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Icon name="calendar" />
            </div>

            <div>
              <span>On Leave</span>

              <strong>
                {loading
                  ? '...'
                  : stats.onLeaveToday ?? 0}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Icon name="clock" />
            </div>

            <div>
              <span>Pending Leaves</span>

              <strong>
                {loading
                  ? '...'
                  : stats.pendingLeaves ?? 0}
              </strong>
            </div>
          </div>
        </section>

        <section className="dashboard-grid">
          <div className="dashboard-card attendance-card">
            <div className="card-header">
              <div>
                <h3>Today&apos;s Attendance</h3>

                <p>Manage your daily attendance</p>
              </div>

              <span className="status-dot">
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'currentColor',
                    marginRight: 6,
                  }}
                />

                Active
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(3, minmax(0, 1fr))',
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: 12,
                    opacity: 0.7,
                    marginBottom: 5,
                  }}
                >
                  Status
                </span>

                <strong>
                  {attendanceStatus}
                </strong>
              </div>

              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: 12,
                    opacity: 0.7,
                    marginBottom: 5,
                  }}
                >
                  Check In
                </span>

                <strong>
                  {formatTime(
                    todayAttendance?.check_in
                  )}
                </strong>
              </div>

              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: 12,
                    opacity: 0.7,
                    marginBottom: 5,
                  }}
                >
                  Check Out
                </span>

                <strong>
                  {formatTime(
                    todayAttendance?.check_out
                  )}
                </strong>
              </div>
            </div>

            <div className="attendance-actions">
              <button
                className="primary-action"
                disabled={checkInDisabled}
                onClick={() =>
                  attendanceAction('check-in')
                }
              >
                <Icon name="arrowIn" size={18} />

                {actionLoading
                  ? 'Processing...'
                  : hasCheckedIn
                    ? 'Checked In'
                    : 'Check In'}
              </button>

              <button
                className="secondary-action"
                disabled={checkOutDisabled}
                onClick={() =>
                  attendanceAction('check-out')
                }
              >
                <Icon name="arrowOut" size={18} />

                {actionLoading
                  ? 'Processing...'
                  : hasCheckedOut
                    ? 'Checked Out'
                    : 'Check Out'}
              </button>
            </div>

            {message && (
              <div className="action-message">
                {message}
              </div>
            )}
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <div>
                <h3>Quick Actions</h3>

                <p>Frequently used HR services</p>
              </div>
            </div>

            <div className="quick-actions">
              <button
                onClick={() =>
                  (window.location.href = '/leave')
                }
              >
                <Icon name="calendar" size={21} />
                <span>Apply Leave</span>
              </button>

              <button
                onClick={() =>
                  (window.location.href =
                    '/employees')
                }
              >
                <Icon name="user" size={21} />
                <span>My Profile</span>
              </button>

              <button
                onClick={() =>
                  (window.location.href =
                    '/payroll')
                }
              >
                <Icon name="money" size={21} />
                <span>View Payslip</span>
              </button>

              <button
                onClick={() =>
                  (window.location.href =
                    '/documents')
                }
              >
                <Icon name="document" size={21} />
                <span>Documents</span>
              </button>
            </div>
          </div>
        </section>

        <section className="dashboard-grid lower-grid">
          <div className="dashboard-card">
            <div className="card-header">
              <div>
                <h3>Recent Attendance</h3>

                <p>Your latest attendance records</p>
              </div>

              <button
                className="text-button"
                onClick={() =>
                  (window.location.href =
                    '/attendance')
                }
              >
                View All
                <Icon name="arrowRight" size={16} />
              </button>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Worked</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {attendance.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="empty-state"
                      >
                        No attendance records found.
                      </td>
                    </tr>
                  ) : (
                    attendance
                      .slice(0, 5)
                      .map((record) => (
                        <tr key={record.id}>
                          <td>
                            {formatDate(
                              record.attendance_date
                            )}
                          </td>

                          <td>
                            {formatTime(
                              record.check_in
                            )}
                          </td>

                          <td>
                            {formatTime(
                              record.check_out
                            )}
                          </td>

                          <td>
                            {record.worked_minutes ??
                              0}{' '}
                            min
                          </td>

                          <td>
                            <span className="status-badge present">
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <div>
                <h3>Announcements</h3>

                <p>Latest company updates</p>
              </div>

              <button
                className="text-button"
                onClick={() =>
                  (window.location.href =
                    '/announcements')
                }
              >
                View All
                <Icon name="arrowRight" size={16} />
              </button>
            </div>

            <div className="announcement-list">
              {announcements.length === 0 ? (
                <div className="empty-state">
                  No announcements available.
                </div>
              ) : (
                announcements
                  .slice(0, 4)
                  .map((announcement) => (
                    <div
                      className="announcement-item"
                      key={announcement.id}
                    >
                      <div className="announcement-icon">
                        <Icon
                          name="megaphone"
                          size={20}
                        />
                      </div>

                      <div>
                        <h4>
                          {announcement.title}
                        </h4>

                        <p>
                          {announcement.message}
                        </p>

                        <small>
                          {formatDate(
                            announcement.created_at
                          )}
                        </small>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </section>
      </div>
    </HRMSLayout>
  );
}