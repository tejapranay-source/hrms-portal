'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import HRMSLayout from '../../components/HRMSLayout';

type LeaveType = {
  id: string;
  name: string;
  annual_days: number;
  is_paid: boolean;
};

type LeaveRequest = {
  id: string;
  employee_id: string;
  leave_type_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
};

export default function LeavePage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadLeaveData();
  }, []);

  async function loadLeaveData() {
    const token = localStorage.getItem('hrms_token');

    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      setLoading(true);
      setError('');

      const [typesResponse, requestsResponse] =
        await Promise.all([
          fetch('http://localhost:5000/api/leave/types', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),

          fetch('http://localhost:5000/api/leave/me', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

      const typesData = await typesResponse.json();
      const requestsData = await requestsResponse.json();

      if (!typesResponse.ok) {
        setError(
          typesData.message ||
            'Unable to load leave types.'
        );
        return;
      }

      if (!requestsResponse.ok) {
        setError(
          requestsData.message ||
            'Unable to load leave requests.'
        );
        return;
      }

      const types = Array.isArray(typesData)
        ? typesData
        : [];

      const requests = Array.isArray(requestsData)
        ? requestsData
        : [];

      setLeaveTypes(types);
      setLeaveRequests(requests);

      if (types.length > 0 && !leaveTypeId) {
        setLeaveTypeId(String(types[0].id));
      }
    } catch (err) {
      console.error('Leave loading error:', err);
      setError(
        'Unable to connect to the HRMS server.'
      );
    } finally {
      setLoading(false);
    }
  }

  const totalRequests = leaveRequests.length;

  const pendingRequests = useMemo(
    () =>
      leaveRequests.filter(
        (request) => request.status === 'PENDING'
      ).length,
    [leaveRequests]
  );

  const approvedRequests = useMemo(
    () =>
      leaveRequests.filter(
        (request) => request.status === 'APPROVED'
      ).length,
    [leaveRequests]
  );

  const rejectedRequests = useMemo(
    () =>
      leaveRequests.filter(
        (request) =>
          request.status === 'REJECTED' ||
          request.status === 'CANCELLED'
      ).length,
    [leaveRequests]
  );

  function calculateDays() {
    if (!startDate || !endDate) {
      return 0;
    }

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    if (end < start) {
      return 0;
    }

    const difference =
      end.getTime() - start.getTime();

    return (
      Math.floor(
        difference / (1000 * 60 * 60 * 24)
      ) + 1
    );
  }

  const requestedDays = calculateDays();

  function formatDate(value: string) {
    if (!value) {
      return '—';
    }

    return new Date(`${value.slice(0, 10)}T00:00:00`)
      .toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
  }

  function getStatusClass(status: string) {
    switch (status) {
      case 'APPROVED':
        return 'approved';

      case 'REJECTED':
        return 'rejected';

      case 'CANCELLED':
        return 'cancelled';

      case 'PENDING':
      default:
        return 'pending';
    }
  }

  async function handleApplyLeave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const token = localStorage.getItem('hrms_token');

    if (!token) {
      window.location.href = '/login';
      return;
    }

    setError('');
    setMessage('');

    if (!leaveTypeId) {
      setError('Please select a leave type.');
      return;
    }

    if (!startDate || !endDate) {
      setError(
        'Please select both start date and end date.'
      );
      return;
    }

    if (requestedDays <= 0) {
      setError(
        'End date must be on or after the start date.'
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        'http://localhost:5000/api/leave',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            leaveTypeId: Number(leaveTypeId),
            startDate,
            endDate,
            days: requestedDays,
            reason: reason.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            'Unable to submit leave request.'
        );
        return;
      }

      setMessage(
        'Leave request submitted successfully.'
      );

      setStartDate('');
      setEndDate('');
      setReason('');

      await loadLeaveData();
    } catch (err) {
      console.error('Apply leave error:', err);

      setError(
        'Unable to connect to the HRMS server.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <HRMSLayout title="Leave Management">
      <div className="leave-container">

        {/* Page Header */}
        <section className="leave-page-header">
          <div>
            <p className="eyebrow leave-eyebrow">
              LEAVE MANAGEMENT
            </p>

            <h2>Leave Management</h2>

            <p>
              Apply for leave and track your leave
              requests from one place.
            </p>
          </div>

          <div className="leave-header-icon">
            🏖
          </div>
        </section>

        {/* Messages */}
        {message && (
          <div className="leave-success-message">
            <span>✓</span>
            {message}
          </div>
        )}

        {error && (
          <div className="leave-error-message">
            <span>!</span>
            {error}
          </div>
        )}

        {/* Leave Summary */}
        <section className="leave-summary-grid">

          <div className="leave-summary-card">
            <div className="leave-summary-icon blue">
              📋
            </div>

            <div>
              <span>Total Requests</span>

              <strong>
                {loading ? '...' : totalRequests}
              </strong>
            </div>
          </div>

          <div className="leave-summary-card">
            <div className="leave-summary-icon orange">
              ◷
            </div>

            <div>
              <span>Pending</span>

              <strong>
                {loading ? '...' : pendingRequests}
              </strong>
            </div>
          </div>

          <div className="leave-summary-card">
            <div className="leave-summary-icon green">
              ✓
            </div>

            <div>
              <span>Approved</span>

              <strong>
                {loading ? '...' : approvedRequests}
              </strong>
            </div>
          </div>

          <div className="leave-summary-card">
            <div className="leave-summary-icon red">
              !
            </div>

            <div>
              <span>Rejected</span>

              <strong>
                {loading ? '...' : rejectedRequests}
              </strong>
            </div>
          </div>

        </section>

        {/* Leave Types */}
        <section className="leave-types-card">

          <div className="leave-section-header">
            <div>
              <h3>Leave Types</h3>

              <p>
                Available leave categories in your
                organization.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="leave-loading">
              <div className="loading-spinner"></div>
              <p>Loading leave types...</p>
            </div>
          ) : leaveTypes.length === 0 ? (
            <div className="leave-empty-small">
              <p>No leave types available.</p>
            </div>
          ) : (
            <div className="leave-types-grid">

              {leaveTypes.map((type, index) => (
                <div
                  className="leave-type-card"
                  key={type.id}
                >
                  <div
                    className={`leave-type-icon type-${index % 4}`}
                  >
                    {index === 0
                      ? '🏖'
                      : index === 1
                        ? '🩺'
                        : index === 2
                          ? '🌿'
                          : '🏠'}
                  </div>

                  <div className="leave-type-content">
                    <h4>{type.name}</h4>

                    <strong>
                      {type.annual_days} days
                    </strong>

                    <span>
                      {type.is_paid
                        ? 'Paid Leave'
                        : 'Unpaid Leave'}
                    </span>
                  </div>
                </div>
              ))}

            </div>
          )}

        </section>

        {/* Apply Leave */}
        <section className="leave-apply-card">

          <div className="leave-section-header">
            <div>
              <h3>Apply for Leave</h3>

              <p>
                Submit a new leave request for
                approval.
              </p>
            </div>
          </div>

          <form
            className="leave-form"
            onSubmit={handleApplyLeave}
          >

            <div className="leave-form-grid">

              <div className="leave-form-group">
                <label htmlFor="leaveType">
                  Leave Type
                </label>

                <select
                  id="leaveType"
                  value={leaveTypeId}
                  onChange={(event) =>
                    setLeaveTypeId(event.target.value)
                  }
                  disabled={
                    loading || leaveTypes.length === 0
                  }
                >
                  {leaveTypes.length === 0 ? (
                    <option value="">
                      No leave types available
                    </option>
                  ) : (
                    leaveTypes.map((type) => (
                      <option
                        key={type.id}
                        value={type.id}
                      >
                        {type.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="leave-form-group">
                <label htmlFor="startDate">
                  Start Date
                </label>

                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(event.target.value)
                  }
                  required
                />
              </div>

              <div className="leave-form-group">
                <label htmlFor="endDate">
                  End Date
                </label>

                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) =>
                    setEndDate(event.target.value)
                  }
                  required
                />
              </div>

              <div className="leave-days-preview">
                <span>Requested Days</span>

                <strong>
                  {requestedDays > 0
                    ? `${requestedDays} ${
                        requestedDays === 1
                          ? 'day'
                          : 'days'
                      }`
                    : '—'}
                </strong>
              </div>

            </div>

            <div className="leave-form-group leave-reason-group">
              <label htmlFor="reason">
                Reason
              </label>

              <textarea
                id="reason"
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                placeholder="Enter the reason for your leave..."
                rows={4}
              />
            </div>

            <div className="leave-form-footer">

              <p>
                Your request will be sent for approval.
              </p>

              <button
                type="submit"
                className="leave-submit-button"
                disabled={
                  submitting ||
                  loading ||
                  leaveTypes.length === 0
                }
              >
                {submitting
                  ? 'Submitting...'
                  : '✓ Apply Leave'}
              </button>

            </div>

          </form>

        </section>

        {/* My Leave Requests */}
        <section className="leave-requests-card">

          <div className="leave-section-header">
            <div>
              <h3>My Leave Requests</h3>

              <p>
                Review your previous and current
                leave requests.
              </p>
            </div>

            <span className="leave-record-count">
              {leaveRequests.length} requests
            </span>
          </div>

          {loading ? (
            <div className="leave-loading">
              <div className="loading-spinner"></div>

              <p>Loading leave requests...</p>
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="leave-empty">
              <div>🏖</div>

              <h3>No leave requests</h3>

              <p>
                You have not submitted any leave
                requests yet.
              </p>
            </div>
          ) : (
            <div className="leave-table-wrapper">

              <table className="leave-table">

                <thead>
                  <tr>
                    <th>Leave Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {leaveRequests.map((request) => (
                    <tr key={request.id}>

                      <td>
                        <strong>
                          {request.leave_type}
                        </strong>
                      </td>

                      <td>
                        {formatDate(
                          request.start_date
                        )}
                      </td>

                      <td>
                        {formatDate(
                          request.end_date
                        )}
                      </td>

                      <td>
                        <span className="leave-days">
                          {request.days}
                        </span>
                      </td>

                      <td>
                        <span className="leave-reason">
                          {request.reason || '—'}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`leave-status ${getStatusClass(
                            request.status
                          )}`}
                        >
                          <span className="status-circle">
                            ●
                          </span>

                          {request.status}
                        </span>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>

            </div>
          )}

        </section>

      </div>
    </HRMSLayout>
  );
}