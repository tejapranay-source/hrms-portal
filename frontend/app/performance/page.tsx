'use client';

import { useEffect, useState } from 'react';
import HRMSLayout from '../../components/HRMSLayout';

type Goal = {
  id: string;
  employee_id: string;
  title: string;
  description: string | null;
  progress: number;
  status: string;
  start_date: string;
  due_date: string | null;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
};

type Review = {
  id: string;
  employee_id: string;
  reviewer_id: string;
  review_period: string;
  rating: string;
  strengths: string | null;
  areas_for_improvement: string | null;
  comments: string | null;
  status: string;
  review_date: string | null;
  employee_code: string;
  employee_first_name: string;
  employee_last_name: string;
  reviewer_first_name: string;
  reviewer_last_name: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function PerformancePage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState<'goals' | 'reviews'>('goals');

  const [showGoalForm, setShowGoalForm] = useState(false);

  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [goalProgress, setGoalProgress] = useState('0');
  const [goalStatus, setGoalStatus] = useState('NOT_STARTED');
  const [goalStartDate, setGoalStartDate] = useState('');
  const [goalDueDate, setGoalDueDate] = useState('');

  const [savingGoal, setSavingGoal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const getToken = () => {
    if (typeof window === 'undefined') {
      return '';
    }

    return localStorage.getItem('hrms_token') || '';
  };

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found');
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [goalsResponse, reviewsResponse] = await Promise.all([
        fetch(`${API_URL}/performance/goals`, {
          headers,
        }),
        fetch(`${API_URL}/performance/reviews`, {
          headers,
        }),
      ]);

      if (!goalsResponse.ok) {
        throw new Error('Failed to load performance goals');
      }

      if (!reviewsResponse.ok) {
        throw new Error('Failed to load performance reviews');
      }

      const goalsData = await goalsResponse.json();
      const reviewsData = await reviewsResponse.json();

      setGoals(goalsData);
      setReviews(reviewsData);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load performance data'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const resetGoalForm = () => {
    setGoalTitle('');
    setGoalDescription('');
    setGoalProgress('0');
    setGoalStatus('NOT_STARTED');
    setGoalStartDate('');
    setGoalDueDate('');
  };

  const createGoal = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSavingGoal(true);
      setError('');
      setSuccessMessage('');

      const token = getToken();

      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${API_URL}/performance/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: goalTitle,
          description: goalDescription,
          progress: Number(goalProgress),
          status: goalStatus,
          startDate: goalStartDate,
          dueDate: goalDueDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create goal');
      }

      setSuccessMessage('Performance goal created successfully.');

      resetGoalForm();
      setShowGoalForm(false);

      await loadPerformanceData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create performance goal'
      );
    } finally {
      setSavingGoal(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'performance-status completed';

      case 'IN_PROGRESS':
        return 'performance-status in-progress';

      case 'NOT_STARTED':
        return 'performance-status not-started';

      case 'DRAFT':
        return 'performance-status draft';

      default:
        return 'performance-status';
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) {
      return '-';
    }

    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const completedGoals = goals.filter(
    (goal) => goal.status === 'COMPLETED'
  ).length;

  const inProgressGoals = goals.filter(
    (goal) => goal.status === 'IN_PROGRESS'
  ).length;

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (sum, review) => sum + Number(review.rating || 0),
            0
          ) / reviews.length
        ).toFixed(1)
      : '0.0';

  return (
    <HRMSLayout title="Performance">
      <div className="performance-page">

        {/* HEADER */}
        <div className="performance-header">
          <div>
            <h2>Performance Management</h2>
            <p>
              Track employee goals, progress, and performance reviews.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => {
              setSuccessMessage('');
              setError('');
              setShowGoalForm(true);
            }}
          >
            + Add Goal
          </button>
        </div>

        {/* SUCCESS */}
        {successMessage && (
          <div className="performance-success">
            {successMessage}
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="performance-error">
            {error}
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="performance-summary-grid">

          <div className="performance-summary-card">
            <div className="performance-summary-icon">🎯</div>

            <div>
              <span>Total Goals</span>
              <strong>{goals.length}</strong>
            </div>
          </div>

          <div className="performance-summary-card">
            <div className="performance-summary-icon">✅</div>

            <div>
              <span>Completed</span>
              <strong>{completedGoals}</strong>
            </div>
          </div>

          <div className="performance-summary-card">
            <div className="performance-summary-icon">⏳</div>

            <div>
              <span>In Progress</span>
              <strong>{inProgressGoals}</strong>
            </div>
          </div>

          <div className="performance-summary-card">
            <div className="performance-summary-icon">⭐</div>

            <div>
              <span>Average Rating</span>
              <strong>{averageRating}/5</strong>
            </div>
          </div>

        </div>

        {/* TABS */}
        <div className="performance-tabs">

          <button
            className={
              activeTab === 'goals'
                ? 'performance-tab active'
                : 'performance-tab'
            }
            onClick={() => setActiveTab('goals')}
          >
            My Goals
          </button>

          <button
            className={
              activeTab === 'reviews'
                ? 'performance-tab active'
                : 'performance-tab'
            }
            onClick={() => setActiveTab('reviews')}
          >
            Performance Reviews
          </button>

        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="performance-loading">
            <div className="performance-spinner"></div>
            <p>Loading performance data...</p>
          </div>
        ) : activeTab === 'goals' ? (

          /* =========================
             GOALS
          ========================= */

          <div className="performance-card">

            <div className="performance-card-header">
              <div>
                <h3>Performance Goals</h3>
                <p>
                  Goals and progress assigned to employees.
                </p>
              </div>
            </div>

            {goals.length === 0 ? (
              <div className="performance-empty">
                <div>🎯</div>
                <h3>No performance goals found</h3>
                <p>
                  Create a goal to start tracking performance.
                </p>
              </div>
            ) : (
              <div className="performance-goals-list">

                {goals.map((goal) => (
                  <div
                    className="performance-goal-card"
                    key={goal.id}
                  >

                    <div className="performance-goal-top">

                      <div>
                        <h3>{goal.title}</h3>

                        <p className="performance-goal-employee">
                          {goal.first_name} {goal.last_name}
                          {' • '}
                          {goal.employee_code}
                        </p>
                      </div>

                      <span className={getStatusClass(goal.status)}>
                        {goal.status.replace('_', ' ')}
                      </span>

                    </div>

                    {goal.description && (
                      <p className="performance-goal-description">
                        {goal.description}
                      </p>
                    )}

                    <div className="performance-progress-section">

                      <div className="performance-progress-header">
                        <span>Progress</span>
                        <strong>{goal.progress}%</strong>
                      </div>

                      <div className="performance-progress-bar">
                        <div
                          className="performance-progress-fill"
                          style={{
                            width: `${goal.progress}%`,
                          }}
                        />
                      </div>

                    </div>

                    <div className="performance-goal-details">

                      <div>
                        <span>Start Date</span>
                        <strong>
                          {formatDate(goal.start_date)}
                        </strong>
                      </div>

                      <div>
                        <span>Due Date</span>
                        <strong>
                          {formatDate(goal.due_date)}
                        </strong>
                      </div>

                      <div>
                        <span>Email</span>
                        <strong>{goal.email}</strong>
                      </div>

                    </div>

                  </div>
                ))}

              </div>
            )}

          </div>

        ) : (

          /* =========================
             REVIEWS
          ========================= */

          <div className="performance-card">

            <div className="performance-card-header">
              <div>
                <h3>Performance Reviews</h3>
                <p>
                  Employee performance review history.
                </p>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="performance-empty">
                <div>⭐</div>
                <h3>No performance reviews found</h3>
                <p>
                  Performance reviews will appear here.
                </p>
              </div>
            ) : (
              <div className="performance-reviews-list">

                {reviews.map((review) => (
                  <div
                    className="performance-review-card"
                    key={review.id}
                  >

                    <div className="performance-review-top">

                      <div>
                        <h3>{review.review_period}</h3>

                        <p>
                          {review.employee_first_name}{' '}
                          {review.employee_last_name}
                          {' • '}
                          {review.employee_code}
                        </p>
                      </div>

                      <span
                        className={getStatusClass(review.status)}
                      >
                        {review.status.replace('_', ' ')}
                      </span>

                    </div>

                    <div className="performance-rating">

                      <span>Rating</span>

                      <strong>
                        ⭐ {review.rating}/5
                      </strong>

                    </div>

                    <div className="performance-review-grid">

                      <div>
                        <span>Reviewer</span>
                        <strong>
                          {review.reviewer_first_name}{' '}
                          {review.reviewer_last_name}
                        </strong>
                      </div>

                      <div>
                        <span>Review Date</span>
                        <strong>
                          {formatDate(review.review_date)}
                        </strong>
                      </div>

                    </div>

                    {review.strengths && (
                      <div className="performance-review-section">
                        <h4>Strengths</h4>
                        <p>{review.strengths}</p>
                      </div>
                    )}

                    {review.areas_for_improvement && (
                      <div className="performance-review-section">
                        <h4>Areas for Improvement</h4>
                        <p>
                          {review.areas_for_improvement}
                        </p>
                      </div>
                    )}

                    {review.comments && (
                      <div className="performance-review-section">
                        <h4>Comments</h4>
                        <p>{review.comments}</p>
                      </div>
                    )}

                  </div>
                ))}

              </div>
            )}

          </div>
        )}

        {/* ADD GOAL MODAL */}
        {showGoalForm && (
          <div
            className="performance-modal-overlay"
            onClick={() => {
              if (!savingGoal) {
                setShowGoalForm(false);
              }
            }}
          >
            <div
              className="performance-modal"
              onClick={(e) => e.stopPropagation()}
            >

              <div className="performance-modal-header">

                <div>
                  <h2>Add Performance Goal</h2>
                  <p>
                    Create a new goal for an employee.
                  </p>
                </div>

                <button
                  className="performance-modal-close"
                  onClick={() => {
                    if (!savingGoal) {
                      setShowGoalForm(false);
                    }
                  }}
                >
                  ×
                </button>

              </div>

              <form onSubmit={createGoal}>

                <div className="performance-form-group">
                  <label>Goal Title *</label>

                  <input
                    type="text"
                    value={goalTitle}
                    onChange={(e) =>
                      setGoalTitle(e.target.value)
                    }
                    placeholder="Example: Improve API Development Skills"
                    required
                  />
                </div>

                <div className="performance-form-group">
                  <label>Description</label>

                  <textarea
                    value={goalDescription}
                    onChange={(e) =>
                      setGoalDescription(e.target.value)
                    }
                    placeholder="Describe the performance goal..."
                    rows={4}
                  />
                </div>

                <div className="performance-form-row">

                  <div className="performance-form-group">
                    <label>Progress (%)</label>

                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={goalProgress}
                      onChange={(e) =>
                        setGoalProgress(e.target.value)
                      }
                    />
                  </div>

                  <div className="performance-form-group">
                    <label>Status</label>

                    <select
                      value={goalStatus}
                      onChange={(e) =>
                        setGoalStatus(e.target.value)
                      }
                    >
                      <option value="NOT_STARTED">
                        Not Started
                      </option>

                      <option value="IN_PROGRESS">
                        In Progress
                      </option>

                      <option value="COMPLETED">
                        Completed
                      </option>
                    </select>
                  </div>

                </div>

                <div className="performance-form-row">

                  <div className="performance-form-group">
                    <label>Start Date *</label>

                    <input
                      type="date"
                      value={goalStartDate}
                      onChange={(e) =>
                        setGoalStartDate(e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="performance-form-group">
                    <label>Due Date</label>

                    <input
                      type="date"
                      value={goalDueDate}
                      onChange={(e) =>
                        setGoalDueDate(e.target.value)
                      }
                    />
                  </div>

                </div>

                <div className="performance-modal-actions">

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      if (!savingGoal) {
                        setShowGoalForm(false);
                      }
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={savingGoal}
                  >
                    {savingGoal
                      ? 'Creating...'
                      : 'Create Goal'}
                  </button>

                </div>

              </form>

            </div>
          </div>
        )}

      </div>
    </HRMSLayout>
  );
}