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
      setUser(JSON.parse(storedUser));
    }

    loadDashboard(token);
  }, []);

  async function loadDashboard(token: string) {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [statsResponse, attendanceResponse, announcementsResponse] =
        await Promise.all([
          fetch('http://localhost:5000/api/dashboard/stats', { headers }),
          fetch('http://localhost:5000/api/attendance/me', { headers }),
          fetch('http://localhost:5000/api/announcements', { headers }),
        ]);

      if (statsResponse.ok) {
        setStats(await statsResponse.json());
      }

      if (attendanceResponse.ok) {
        setAttendance(await attendanceResponse.json());
      }

      if (announcementsResponse.ok) {
        setAnnouncements(await announcementsResponse.json());
      }
    } catch (error) {
      console.error('Dashboard loading error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function attendanceAction(action: 'check-in' | 'check-out') {
    const token = localStorage.getItem('hrms_token');

    if (!token) {
      window.location.href = '/login';
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
        setMessage(data.message || 'Attendance action failed.');
        return;
      }

      setMessage(data.message || 'Attendance updated successfully.');

      await loadDashboard(token);
    } catch (error) {
      console.error(error);
      setMessage('Unable to connect to the HRMS server.');
    } finally {
      setActionLoading(false);
    }
  }

  const formatTime = (value: string | null) => {
    if (!value) return '--';

    return new Date(value).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (value: string) => {
    return new Date(value).toLocaleDateString([], {
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
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  return (
    <HRMSLayout title="Dashboard">
      <div className="dashboard-container">
        <section className="welcome-section">
          <div>
            <p className="eyebrow">HRMS PORTAL</p>

            <h2>
              Welcome back, {getDisplayName()} 👋
            </h2>

            <p>
              Here&apos;s what&apos;s happening with your HR activities today.
            </p>
          </div>

          <div className="role-badge">
            {user?.role || 'EMPLOYEE'}
          </div>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>

            <div>
              <span>Total Employees</span>
              <strong>{loading ? '...' : stats.employees ?? 0}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✓</div>

            <div>
              <span>Present Today</span>
              <strong>
                {loading ? '...' : stats.presentToday ?? 0}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏖</div>

            <div>
              <span>On Leave</span>
              <strong>
                {loading ? '...' : stats.onLeaveToday ?? 0}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏳</div>

            <div>
              <span>Pending Leaves</span>
              <strong>
                {loading ? '...' : stats.pendingLeaves ?? 0}
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

              <span className="status-dot">● Active</span>
            </div>

            <div className="attendance-actions">
              <button
                className="primary-action"
                disabled={actionLoading}
                onClick={() => attendanceAction('check-in')}
              >
                {actionLoading ? 'Processing...' : '✓ Check In'}
              </button>

              <button
                className="secondary-action"
                disabled={actionLoading}
                onClick={() => attendanceAction('check-out')}
              >
                {actionLoading ? 'Processing...' : '↪ Check Out'}
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
              <button onClick={() => (window.location.href = '/leave')}>
                🏖️
                <span>Apply Leave</span>
              </button>

              <button
                onClick={() => (window.location.href = '/employees')}
              >
                👤
                <span>My Profile</span>
              </button>

              <button
                onClick={() => (window.location.href = '/payroll')}
              >
                💰
                <span>View Payslip</span>
              </button>

              <button
                onClick={() => (window.location.href = '/documents')}
              >
                📄
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
                onClick={() => (window.location.href = '/attendance')}
              >
                View All →
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
                      <td colSpan={5} className="empty-state">
                        No attendance records found.
                      </td>
                    </tr>
                  ) : (
                    attendance.slice(0, 5).map((record) => (
                      <tr key={record.id}>
                        <td>{formatDate(record.attendance_date)}</td>
                        <td>{formatTime(record.check_in)}</td>
                        <td>{formatTime(record.check_out)}</td>
                        <td>
                          {record.worked_minutes ?? 0} min
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
                  (window.location.href = '/announcements')
                }
              >
                View All →
              </button>
            </div>

            <div className="announcement-list">
              {announcements.length === 0 ? (
                <div className="empty-state">
                  No announcements available.
                </div>
              ) : (
                announcements.slice(0, 4).map((announcement) => (
                  <div
                    className="announcement-item"
                    key={announcement.id}
                  >
                    <div className="announcement-icon">📢</div>

                    <div>
                      <h4>{announcement.title}</h4>

                      <p>{announcement.message}</p>

                      <small>
                        {formatDate(announcement.created_at)}
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