'use client';

import { useEffect, useMemo, useState } from 'react';
import HRMSLayout from '../../components/HRMSLayout';

type Job = {
  id: string;
  title: string;
  department_id: string | null;
  department: string | null;
  location: string | null;
  employment_type: string;
  description: string;
  requirements: string | null;
  openings: number;
  status: string;
  posted_date: string | null;
  closing_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type Candidate = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  resume_url: string | null;
  skills: string | null;
  created_at: string;
  updated_at: string;
};

type Application = {
  id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  applied_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  job_title: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
};

type ActiveTab = 'jobs' | 'candidates' | 'applications';

const API_URL = 'http://localhost:5000/api';

const emptyJobForm = {
  title: '',
  departmentId: '',
  location: '',
  employmentType: 'FULL_TIME',
  description: '',
  requirements: '',
  openings: '1',
  status: 'OPEN',
  postedDate: '',
  closingDate: '',
};

const emptyCandidateForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  resumeUrl: '',
  skills: '',
};

const emptyApplicationForm = {
  jobId: '',
  candidateId: '',
  notes: '',
};

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [activeTab, setActiveTab] =
    useState<ActiveTab>('jobs');

  const [search, setSearch] = useState('');

  const [showJobForm, setShowJobForm] = useState(false);
  const [showCandidateForm, setShowCandidateForm] =
    useState(false);
  const [showApplicationForm, setShowApplicationForm] =
    useState(false);

  const [selectedJob, setSelectedJob] =
    useState<Job | null>(null);

  const [selectedCandidate, setSelectedCandidate] =
    useState<Candidate | null>(null);

  const [editingJob, setEditingJob] =
    useState<Job | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const [jobForm, setJobForm] =
    useState(emptyJobForm);

  const [candidateForm, setCandidateForm] =
    useState(emptyCandidateForm);

  const [applicationForm, setApplicationForm] =
    useState(emptyApplicationForm);

  useEffect(() => {
    loadRecruitmentData();
  }, []);

  function getToken() {
    return localStorage.getItem('hrms_token');
  }

  function clearMessages() {
    setError('');
    setSuccess('');
  }

  async function loadRecruitmentData() {
    const token = getToken();

    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      setLoading(true);
      setError('');

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [
        jobsResponse,
        candidatesResponse,
        applicationsResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/recruitment/jobs`, {
          headers,
        }),

        fetch(`${API_URL}/recruitment/candidates`, {
          headers,
        }),

        fetch(`${API_URL}/recruitment/applications`, {
          headers,
        }),
      ]);

      const jobsData = await jobsResponse.json();
      const candidatesData =
        await candidatesResponse.json();
      const applicationsData =
        await applicationsResponse.json();

      if (!jobsResponse.ok) {
        throw new Error(
          jobsData.message ||
            'Unable to load job openings.'
        );
      }

      if (!candidatesResponse.ok) {
        throw new Error(
          candidatesData.message ||
            'Unable to load candidates.'
        );
      }

      if (!applicationsResponse.ok) {
        throw new Error(
          applicationsData.message ||
            'Unable to load applications.'
        );
      }

      setJobs(
        Array.isArray(jobsData)
          ? jobsData
          : []
      );

      setCandidates(
        Array.isArray(candidatesData)
          ? candidatesData
          : []
      );

      setApplications(
        Array.isArray(applicationsData)
          ? applicationsData
          : []
      );
    } catch (err) {
      console.error(
        'Recruitment loading error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to the HRMS server.'
      );
    } finally {
      setLoading(false);
    }
  }

  const openJobs = jobs.filter(
    (job) => job.status === 'OPEN'
  ).length;

  const totalOpenings = jobs
    .filter((job) => job.status === 'OPEN')
    .reduce(
      (total, job) =>
        total + Number(job.openings || 0),
      0
    );

  const activeApplications =
    applications.filter(
      (application) =>
        !['REJECTED', 'HIRED'].includes(
          application.status
        )
    ).length;

  const hiredCandidates =
    applications.filter(
      (application) =>
        application.status === 'HIRED'
    ).length;

  const filteredJobs = useMemo(() => {
    const value = search
      .toLowerCase()
      .trim();

    if (!value) {
      return jobs;
    }

    return jobs.filter((job) => {
      return (
        job.title
          .toLowerCase()
          .includes(value) ||
        (job.department || '')
          .toLowerCase()
          .includes(value) ||
        (job.location || '')
          .toLowerCase()
          .includes(value) ||
        job.status
          .toLowerCase()
          .includes(value)
      );
    });
  }, [jobs, search]);

  const filteredCandidates = useMemo(() => {
    const value = search
      .toLowerCase()
      .trim();

    if (!value) {
      return candidates;
    }

    return candidates.filter((candidate) => {
      const fullName =
        `${candidate.first_name} ${candidate.last_name}`
          .toLowerCase();

      return (
        fullName.includes(value) ||
        candidate.email
          .toLowerCase()
          .includes(value) ||
        (candidate.phone || '').includes(value) ||
        (candidate.skills || '')
          .toLowerCase()
          .includes(value)
      );
    });
  }, [candidates, search]);

  const filteredApplications = useMemo(() => {
    const value = search
      .toLowerCase()
      .trim();

    if (!value) {
      return applications;
    }

    return applications.filter(
      (application) => {
        const candidateName =
          `${application.first_name} ${application.last_name}`
            .toLowerCase();

        return (
          candidateName.includes(value) ||
          application.email
            .toLowerCase()
            .includes(value) ||
          application.job_title
            .toLowerCase()
            .includes(value) ||
          application.status
            .toLowerCase()
            .includes(value)
        );
      }
    );
  }, [applications, search]);

  function formatDate(
    value: string | null
  ) {
    if (!value) {
      return '—';
    }

    return new Date(value).toLocaleDateString(
      'en-US',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );
  }

  function formatEmploymentType(
    value: string
  ) {
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  }

  function getCandidateInitials(
    candidate: Candidate
  ) {
    return `${candidate.first_name.charAt(
      0
    )}${candidate.last_name.charAt(
      0
    )}`.toUpperCase();
  }

  function getStatusClass(
    status: string
  ) {
    return status
      .toLowerCase()
      .replace(/_/g, '-');
  }

  function openCreateJobForm() {
    clearMessages();
    setEditingJob(null);
    setJobForm({
      ...emptyJobForm,
    });
    setShowJobForm(true);
  }

  function openEditJobForm(job: Job) {
    clearMessages();

    setSelectedJob(null);
    setEditingJob(job);

    setJobForm({
      title: job.title || '',
      departmentId:
        job.department_id
          ? String(job.department_id)
          : '',
      location: job.location || '',
      employmentType:
        job.employment_type ||
        'FULL_TIME',
      description:
        job.description || '',
      requirements:
        job.requirements || '',
      openings: String(
        job.openings || 1
      ),
      status:
        job.status || 'OPEN',
      postedDate:
        job.posted_date
          ? job.posted_date.substring(
              0,
              10
            )
          : '',
      closingDate:
        job.closing_date
          ? job.closing_date.substring(
              0,
              10
            )
          : '',
    });

    setShowJobForm(true);
  }

  function closeJobForm() {
    if (submitting) return;

    setShowJobForm(false);
    setEditingJob(null);
    setJobForm({
      ...emptyJobForm,
    });
  }

  async function saveJob(
    event: React.FormEvent
  ) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      window.location.href = '/login';
      return;
    }

    if (!jobForm.title.trim()) {
      setError(
        'Job title is required.'
      );
      return;
    }

    if (!jobForm.description.trim()) {
      setError(
        'Job description is required.'
      );
      return;
    }

    try {
      setSubmitting(true);
      clearMessages();

      const isEditing =
        Boolean(editingJob);

      const url = isEditing
        ? `${API_URL}/recruitment/jobs/${editingJob!.id}`
        : `${API_URL}/recruitment/jobs`;

      const response = await fetch(
        url,
        {
          method: isEditing
            ? 'PUT'
            : 'POST',

          headers: {
            Authorization:
              `Bearer ${token}`,
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            title:
              jobForm.title.trim(),

            departmentId:
              jobForm.departmentId
                ? Number(
                    jobForm.departmentId
                  )
                : null,

            location:
              jobForm.location.trim() ||
              null,

            employmentType:
              jobForm.employmentType,

            description:
              jobForm.description.trim(),

            requirements:
              jobForm.requirements.trim() ||
              null,

            openings:
              Number(jobForm.openings) ||
              1,

            status:
              jobForm.status,

            postedDate:
              jobForm.postedDate ||
              null,

            closingDate:
              jobForm.closingDate ||
              null,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            (isEditing
              ? 'Unable to update job.'
              : 'Unable to create job.')
        );
      }

      closeJobForm();

      setSuccess(
        isEditing
          ? 'Job opening updated successfully.'
          : 'Job opening created successfully.'
      );

      await loadRecruitmentData();
    } catch (err) {
      console.error(
        'Save job error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to save job opening.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteJob(
    job: Job
  ) {
    const token = getToken();

    if (!token) {
      window.location.href = '/login';
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${job.title}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setSubmitting(true);
      clearMessages();

      const response =
        await fetch(
          `${API_URL}/recruitment/jobs/${job.id}`,
          {
            method: 'DELETE',
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Unable to delete job.'
        );
      }

      setSelectedJob(null);

      setSuccess(
        'Job opening deleted successfully.'
      );

      await loadRecruitmentData();
    } catch (err) {
      console.error(
        'Delete job error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete job opening.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function createCandidate(
    event: React.FormEvent
  ) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      setSubmitting(true);
      clearMessages();

      const response =
        await fetch(
          `${API_URL}/recruitment/candidates`,
          {
            method: 'POST',
            headers: {
              Authorization:
                `Bearer ${token}`,
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              firstName:
                candidateForm.firstName.trim(),

              lastName:
                candidateForm.lastName.trim(),

              email:
                candidateForm.email.trim(),

              phone:
                candidateForm.phone.trim() ||
                null,

              resumeUrl:
                candidateForm.resumeUrl.trim() ||
                null,

              skills:
                candidateForm.skills.trim() ||
                null,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Unable to create candidate.'
        );
      }

      setShowCandidateForm(false);

      setCandidateForm({
        ...emptyCandidateForm,
      });

      setSuccess(
        'Candidate added successfully.'
      );

      await loadRecruitmentData();
    } catch (err) {
      console.error(
        'Create candidate error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create candidate.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function createApplication(
    event: React.FormEvent
  ) {
    event.preventDefault();

    const token = getToken();

    if (!token) {
      window.location.href = '/login';
      return;
    }

    if (!applicationForm.jobId) {
      setError(
        'Please select a job.'
      );
      return;
    }

    if (!applicationForm.candidateId) {
      setError(
        'Please select a candidate.'
      );
      return;
    }

    try {
      setSubmitting(true);
      clearMessages();

      const response =
        await fetch(
          `${API_URL}/recruitment/applications`,
          {
            method: 'POST',
            headers: {
              Authorization:
                `Bearer ${token}`,
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              jobId:
                Number(
                  applicationForm.jobId
                ),

              candidateId:
                Number(
                  applicationForm.candidateId
                ),

              notes:
                applicationForm.notes.trim() ||
                null,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Unable to create application.'
        );
      }

      setShowApplicationForm(false);

      setApplicationForm({
        ...emptyApplicationForm,
      });

      setActiveTab('applications');

      setSuccess(
        'Application created successfully.'
      );

      await loadRecruitmentData();
    } catch (err) {
      console.error(
        'Create application error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create application.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function updateApplicationStatus(
    applicationId: string,
    status: string
  ) {
    const token = getToken();

    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      clearMessages();

      const response =
        await fetch(
          `${API_URL}/recruitment/applications/${applicationId}/status`,
          {
            method: 'PATCH',
            headers: {
              Authorization:
                `Bearer ${token}`,
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              status,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Unable to update application status.'
        );
      }

      setApplications(
        (current) =>
          current.map(
            (application) =>
              application.id ===
              applicationId
                ? {
                    ...application,
                    ...data,
                  }
                : application
          )
      );

      setSuccess(
        'Application status updated successfully.'
      );
    } catch (err) {
      console.error(
        'Application status error:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update application status.'
      );
    }
  }

  return (
    <HRMSLayout title="Recruitment">
      <div className="recruitment-container">

        {/* HEADER */}
        <section className="recruitment-header">
          <div>
            <p className="eyebrow recruitment-eyebrow">
              TALENT MANAGEMENT
            </p>

            <h2>Recruitment</h2>

            <p>
              Manage job openings, candidates and
              recruitment applications from one place.
            </p>
          </div>

          <div className="recruitment-header-actions">

            <button
              className="recruitment-secondary-button"
              onClick={() => {
                clearMessages();
                setShowCandidateForm(true);
              }}
            >
              + Add Candidate
            </button>

            <button
              className="recruitment-secondary-button"
              onClick={() => {
                clearMessages();
                setShowApplicationForm(true);
              }}
            >
              + Create Application
            </button>

            <button
              className="recruitment-primary-button"
              onClick={openCreateJobForm}
            >
              + Create Job
            </button>

          </div>
        </section>

        {/* SUCCESS / ERROR */}
        {success && (
          <div className="recruitment-success">
            {success}
          </div>
        )}

        {/* SUMMARY */}
        <section className="recruitment-summary-grid">

          <div className="recruitment-summary-card">
            <div className="recruitment-summary-icon blue">
              💼
            </div>

            <div>
              <span>Open Jobs</span>

              <strong>
                {loading ? '...' : openJobs}
              </strong>
            </div>
          </div>

          <div className="recruitment-summary-card">
            <div className="recruitment-summary-icon green">
              👥
            </div>

            <div>
              <span>Total Openings</span>

              <strong>
                {loading ? '...' : totalOpenings}
              </strong>
            </div>
          </div>

          <div className="recruitment-summary-card">
            <div className="recruitment-summary-icon orange">
              📝
            </div>

            <div>
              <span>Active Applications</span>

              <strong>
                {loading
                  ? '...'
                  : activeApplications}
              </strong>
            </div>
          </div>

          <div className="recruitment-summary-card">
            <div className="recruitment-summary-icon purple">
              ✓
            </div>

            <div>
              <span>Hired</span>

              <strong>
                {loading
                  ? '...'
                  : hiredCandidates}
              </strong>
            </div>
          </div>

        </section>

        {/* TABS */}
        <section className="recruitment-tabs-card">

          <div className="recruitment-tabs">

            <button
              className={
                activeTab === 'jobs'
                  ? 'recruitment-tab active'
                  : 'recruitment-tab'
              }
              onClick={() => {
                setActiveTab('jobs');
                setSearch('');
                clearMessages();
              }}
            >
              Job Openings
              <span>{jobs.length}</span>
            </button>

            <button
              className={
                activeTab === 'candidates'
                  ? 'recruitment-tab active'
                  : 'recruitment-tab'
              }
              onClick={() => {
                setActiveTab('candidates');
                setSearch('');
                clearMessages();
              }}
            >
              Candidates
              <span>{candidates.length}</span>
            </button>

            <button
              className={
                activeTab === 'applications'
                  ? 'recruitment-tab active'
                  : 'recruitment-tab'
              }
              onClick={() => {
                setActiveTab('applications');
                setSearch('');
                clearMessages();
              }}
            >
              Applications
              <span>{applications.length}</span>
            </button>

          </div>

        </section>

        {/* MAIN CARD */}
        <section className="recruitment-main-card">

          <div className="recruitment-card-header">

            <div>
              <h3>
                {activeTab === 'jobs'
                  ? 'Job Openings'
                  : activeTab === 'candidates'
                  ? 'Candidates'
                  : 'Applications'}
              </h3>

              <p>
                {activeTab === 'jobs'
                  ? 'View and manage available positions.'
                  : activeTab === 'candidates'
                  ? 'View candidates in your recruitment pipeline.'
                  : 'Track candidate applications and their status.'}
              </p>
            </div>

            <div className="recruitment-search">
              <span>⌕</span>

              <input
                type="text"
                placeholder={
                  activeTab === 'jobs'
                    ? 'Search jobs...'
                    : activeTab === 'candidates'
                    ? 'Search candidates...'
                    : 'Search applications...'
                }
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />
            </div>

          </div>

          {error && (
            <div className="recruitment-error">
              {error}
            </div>
          )}

          {loading ? (
            <div className="recruitment-loading">
              <div className="loading-spinner"></div>

              <p>
                Loading recruitment data...
              </p>
            </div>
          ) : (
            <>

              {/* JOBS */}
              {activeTab === 'jobs' && (
                filteredJobs.length === 0 ? (
                  <div className="recruitment-empty">
                    <div>💼</div>

                    <h3>
                      No job openings found
                    </h3>

                    <p>
                      Create a job opening to
                      start recruiting.
                    </p>
                  </div>
                ) : (
                  <div className="recruitment-table-wrapper">

                    <table className="recruitment-table">

                      <thead>
                        <tr>
                          <th>Position</th>
                          <th>Department</th>
                          <th>Location</th>
                          <th>Employment</th>
                          <th>Openings</th>
                          <th>Posted</th>
                          <th>Closing</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredJobs.map(
                          (job) => (
                            <tr key={job.id}>

                              <td>
                                <div className="recruitment-name-cell">

                                  <div className="recruitment-job-icon">
                                    💼
                                  </div>

                                  <div>
                                    <strong>
                                      {job.title}
                                    </strong>

                                    <span>
                                      Job #{job.id}
                                    </span>
                                  </div>

                                </div>
                              </td>

                              <td>
                                {job.department ||
                                  '—'}
                              </td>

                              <td>
                                {job.location ||
                                  '—'}
                              </td>

                              <td>
                                {formatEmploymentType(
                                  job.employment_type
                                )}
                              </td>

                              <td>
                                {job.openings}
                              </td>

                              <td>
                                {formatDate(
                                  job.posted_date
                                )}
                              </td>

                              <td>
                                {formatDate(
                                  job.closing_date
                                )}
                              </td>

                              <td>
                                <span
                                  className={`recruitment-status ${getStatusClass(
                                    job.status
                                  )}`}
                                >
                                  {job.status}
                                </span>
                              </td>

                              <td>
                                <button
                                  className="recruitment-view-button"
                                  onClick={() =>
                                    setSelectedJob(
                                      job
                                    )
                                  }
                                >
                                  View
                                </button>
                              </td>

                            </tr>
                          )
                        )}
                      </tbody>

                    </table>

                  </div>
                )
              )}

              {/* CANDIDATES */}
              {activeTab === 'candidates' && (
                filteredCandidates.length === 0 ? (
                  <div className="recruitment-empty">
                    <div>👤</div>

                    <h3>
                      No candidates found
                    </h3>

                    <p>
                      Add a candidate to your
                      recruitment pipeline.
                    </p>
                  </div>
                ) : (
                  <div className="recruitment-table-wrapper">

                    <table className="recruitment-table">

                      <thead>
                        <tr>
                          <th>Candidate</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Skills</th>
                          <th>Added</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredCandidates.map(
                          (candidate) => (
                            <tr key={candidate.id}>

                              <td>
                                <div className="recruitment-name-cell">

                                  <div className="recruitment-candidate-avatar">
                                    {getCandidateInitials(
                                      candidate
                                    )}
                                  </div>

                                  <div>
                                    <strong>
                                      {
                                        candidate.first_name
                                      }{' '}
                                      {
                                        candidate.last_name
                                      }
                                    </strong>

                                    <span>
                                      Candidate #
                                      {
                                        candidate.id
                                      }
                                    </span>
                                  </div>

                                </div>
                              </td>

                              <td>
                                {candidate.email}
                              </td>

                              <td>
                                {candidate.phone ||
                                  '—'}
                              </td>

                              <td>
                                <div className="candidate-skills">
                                  {candidate.skills ||
                                    '—'}
                                </div>
                              </td>

                              <td>
                                {formatDate(
                                  candidate.created_at
                                )}
                              </td>

                              <td>
                                <button
                                  className="recruitment-view-button"
                                  onClick={() =>
                                    setSelectedCandidate(
                                      candidate
                                    )
                                  }
                                >
                                  View
                                </button>
                              </td>

                            </tr>
                          )
                        )}
                      </tbody>

                    </table>

                  </div>
                )
              )}

              {/* APPLICATIONS */}
              {activeTab === 'applications' && (
                filteredApplications.length === 0 ? (
                  <div className="recruitment-empty">
                    <div>📝</div>

                    <h3>
                      No applications found
                    </h3>

                    <p>
                      Create an application to
                      start tracking candidates.
                    </p>
                  </div>
                ) : (
                  <div className="recruitment-table-wrapper">

                    <table className="recruitment-table">

                      <thead>
                        <tr>
                          <th>Candidate</th>
                          <th>Position</th>
                          <th>Applied</th>
                          <th>Status</th>
                          <th>Notes</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredApplications.map(
                          (application) => (
                            <tr
                              key={
                                application.id
                              }
                            >

                              <td>
                                <div className="recruitment-name-cell">

                                  <div className="recruitment-candidate-avatar">
                                    {application.first_name.charAt(
                                      0
                                    )}
                                    {application.last_name.charAt(
                                      0
                                    )}
                                  </div>

                                  <div>
                                    <strong>
                                      {
                                        application.first_name
                                      }{' '}
                                      {
                                        application.last_name
                                      }
                                    </strong>

                                    <span>
                                      {
                                        application.email
                                      }
                                    </span>
                                  </div>

                                </div>
                              </td>

                              <td>
                                <strong>
                                  {
                                    application.job_title
                                  }
                                </strong>
                              </td>

                              <td>
                                {formatDate(
                                  application.applied_at
                                )}
                              </td>

                              <td>
                                <select
                                  className={`application-status-select ${getStatusClass(
                                    application.status
                                  )}`}
                                  value={
                                    application.status
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    updateApplicationStatus(
                                      application.id,
                                      event.target.value
                                    )
                                  }
                                >

                                  <option value="APPLIED">
                                    APPLIED
                                  </option>

                                  <option value="SCREENING">
                                    SCREENING
                                  </option>

                                  <option value="INTERVIEW">
                                    INTERVIEW
                                  </option>

                                  <option value="SELECTED">
                                    SELECTED
                                  </option>

                                  <option value="ON_HOLD">
                                    ON HOLD
                                  </option>

                                  <option value="HIRED">
                                    HIRED
                                  </option>

                                  <option value="REJECTED">
                                    REJECTED
                                  </option>

                                </select>
                              </td>

                              <td>
                                <span className="application-notes">
                                  {
                                    application.notes ||
                                    '—'
                                  }
                                </span>
                              </td>

                            </tr>
                          )
                        )}
                      </tbody>

                    </table>

                  </div>
                )
              )}

            </>
          )}

        </section>

        {/* JOB DETAILS MODAL */}
        {selectedJob && (
          <div
            className="recruitment-modal-overlay"
            onClick={() =>
              setSelectedJob(null)
            }
          >
            <div
              className="recruitment-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="recruitment-modal-header">

                <div>
                  <h3>
                    Job Details
                  </h3>

                  <p>
                    Complete information about
                    this position.
                  </p>
                </div>

                <button
                  className="recruitment-modal-close"
                  onClick={() =>
                    setSelectedJob(null)
                  }
                >
                  ×
                </button>

              </div>

              <div className="recruitment-modal-job-header">

                <div className="recruitment-large-job-icon">
                  💼
                </div>

                <div>

                  <h2>
                    {selectedJob.title}
                  </h2>

                  <p>
                    {selectedJob.department ||
                      'Department not specified'}
                  </p>

                  <span
                    className={`recruitment-status ${getStatusClass(
                      selectedJob.status
                    )}`}
                  >
                    {selectedJob.status}
                  </span>

                </div>

              </div>

              <div className="recruitment-details-grid">

                <div>
                  <span>
                    Location
                  </span>

                  <strong>
                    {selectedJob.location ||
                      'Not specified'}
                  </strong>
                </div>

                <div>
                  <span>
                    Employment Type
                  </span>

                  <strong>
                    {formatEmploymentType(
                      selectedJob.employment_type
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Openings
                  </span>

                  <strong>
                    {selectedJob.openings}
                  </strong>
                </div>

                <div>
                  <span>
                    Posted Date
                  </span>

                  <strong>
                    {formatDate(
                      selectedJob.posted_date
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Closing Date
                  </span>

                  <strong>
                    {formatDate(
                      selectedJob.closing_date
                    )}
                  </strong>
                </div>

              </div>

              <div className="recruitment-description">

                <h4>
                  Description
                </h4>

                <p>
                  {selectedJob.description}
                </p>

              </div>

              <div className="recruitment-description">

                <h4>
                  Requirements
                </h4>

                <p>
                  {selectedJob.requirements ||
                    'No requirements specified.'}
                </p>

              </div>

              {/* JOB ACTIONS */}
              <div className="recruitment-form-actions">

                <button
                  type="button"
                  className="recruitment-secondary-button"
                  onClick={() =>
                    openEditJobForm(
                      selectedJob
                    )
                  }
                >
                  Edit Job
                </button>

                <button
                  type="button"
                  className="recruitment-danger-button"
                  disabled={submitting}
                  onClick={() =>
                    deleteJob(
                      selectedJob
                    )
                  }
                >
                  {submitting
                    ? 'Deleting...'
                    : 'Delete Job'}
                </button>

              </div>

            </div>
          </div>
        )}

        {/* CANDIDATE DETAILS MODAL */}
        {selectedCandidate && (
          <div
            className="recruitment-modal-overlay"
            onClick={() =>
              setSelectedCandidate(
                null
              )
            }
          >
            <div
              className="recruitment-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="recruitment-modal-header">

                <div>
                  <h3>
                    Candidate Details
                  </h3>

                  <p>
                    Complete candidate information.
                  </p>
                </div>

                <button
                  className="recruitment-modal-close"
                  onClick={() =>
                    setSelectedCandidate(
                      null
                    )
                  }
                >
                  ×
                </button>

              </div>

              <div className="recruitment-modal-job-header">

                <div className="recruitment-large-candidate-avatar">
                  {getCandidateInitials(
                    selectedCandidate
                  )}
                </div>

                <div>

                  <h2>
                    {
                      selectedCandidate.first_name
                    }{' '}
                    {
                      selectedCandidate.last_name
                    }
                  </h2>

                  <p>
                    {selectedCandidate.email}
                  </p>

                </div>

              </div>

              <div className="recruitment-details-grid">

                <div>
                  <span>
                    Email
                  </span>

                  <strong>
                    {selectedCandidate.email}
                  </strong>
                </div>

                <div>
                  <span>
                    Phone
                  </span>

                  <strong>
                    {selectedCandidate.phone ||
                      'Not specified'}
                  </strong>
                </div>

                <div>
                  <span>
                    Added
                  </span>

                  <strong>
                    {formatDate(
                      selectedCandidate.created_at
                    )}
                  </strong>
                </div>

              </div>

              <div className="recruitment-description">

                <h4>
                  Skills
                </h4>

                <p>
                  {selectedCandidate.skills ||
                    'No skills specified.'}
                </p>

              </div>

              {selectedCandidate.resume_url && (
                <div className="recruitment-description">

                  <h4>
                    Resume
                  </h4>

                  <a
                    href={
                      selectedCandidate.resume_url
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="resume-link"
                  >
                    View Resume
                  </a>

                </div>
              )}

            </div>
          </div>
        )}

        {/* CREATE / EDIT JOB MODAL */}
        {showJobForm && (
          <div
            className="recruitment-modal-overlay"
            onClick={closeJobForm}
          >
            <div
              className="recruitment-modal form-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="recruitment-modal-header">

                <div>
                  <h3>
                    {editingJob
                      ? 'Edit Job Opening'
                      : 'Create Job Opening'}
                  </h3>

                  <p>
                    {editingJob
                      ? 'Update this position.'
                      : 'Add a new position to your recruitment pipeline.'}
                  </p>
                </div>

                <button
                  className="recruitment-modal-close"
                  onClick={closeJobForm}
                >
                  ×
                </button>

              </div>

              <form onSubmit={saveJob}>

                <div className="recruitment-form-grid">

                  <div className="recruitment-form-group full">

                    <label>
                      Job Title *
                    </label>

                    <input
                      type="text"
                      required
                      value={
                        jobForm.title
                      }
                      onChange={(event) =>
                        setJobForm({
                          ...jobForm,
                          title:
                            event.target.value,
                        })
                      }
                      placeholder="e.g. Software Engineer"
                    />

                  </div>

                  <div className="recruitment-form-group">

                    <label>
                      Department ID
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={
                        jobForm.departmentId
                      }
                      onChange={(event) =>
                        setJobForm({
                          ...jobForm,
                          departmentId:
                            event.target.value,
                        })
                      }
                      placeholder="e.g. 6"
                    />

                  </div>

                  <div className="recruitment-form-group">

                    <label>
                      Location
                    </label>

                    <input
                      type="text"
                      value={
                        jobForm.location
                      }
                      onChange={(event) =>
                        setJobForm({
                          ...jobForm,
                          location:
                            event.target.value,
                        })
                      }
                      placeholder="e.g. Hyderabad"
                    />

                  </div>

                  <div className="recruitment-form-group">

                    <label>
                      Employment Type
                    </label>

                    <select
                      value={
                        jobForm.employmentType
                      }
                      onChange={(event) =>
                        setJobForm({
                          ...jobForm,
                          employmentType:
                            event.target.value,
                        })
                      }
                    >

                      <option value="FULL_TIME">
                        Full Time
                      </option>

                      <option value="PART_TIME">
                        Part Time
                      </option>

                      <option value="CONTRACT">
                        Contract
                      </option>

                      <option value="INTERNSHIP">
                        Internship
                      </option>

                    </select>

                  </div>

                  <div className="recruitment-form-group">

                    <label>
                      Number of Openings
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={
                        jobForm.openings
                      }
                      onChange={(event) =>
                        setJobForm({
                          ...jobForm,
                          openings:
                            event.target.value,
                        })
                      }
                    />

                  </div>

                  <div className="recruitment-form-group">

                    <label>
                      Status
                    </label>

                    <select
                      value={
                        jobForm.status
                      }
                      onChange={(event) =>
                        setJobForm({
                          ...jobForm,
                          status:
                            event.target.value,
                        })
                      }
                    >

                      <option value="OPEN">
                        OPEN
                      </option>

                      <option value="CLOSED">
                        CLOSED
                      </option>

                      <option value="ON_HOLD">
                        ON HOLD
                      </option>

                    </select>

                  </div>

                  <div className="recruitment-form-group">

                    <label>
                      Posted Date
                    </label>

                    <input
                      type="date"
                      value={
                        jobForm.postedDate
                      }
                      onChange={(event) =>
                        setJobForm({
                          ...jobForm,
                          postedDate:
                            event.target.value,
                        })
                      }
                    />

                  </div>

                  <div className="recruitment-form-group">

                    <label>
                      Closing Date
                    </label>

                    <input
                      type="date"
                      value={
                        jobForm.closingDate
                      }
                      onChange={(event) =>
                        setJobForm({
                          ...jobForm,
                          closingDate:
                            event.target.value,
                        })
                      }
                    />

                  </div>

                  <div className="recruitment-form-group full">

                    <label>
                      Description *
                    </label>

                    <textarea
                      required
                      rows={4}
                      value={
                        jobForm.description
                      }
                      onChange={(event) =>
                        setJobForm({
                          ...jobForm,
                          description:
                            event.target.value,
                        })
                      }
                      placeholder="Describe the role..."
                    />

                  </div>

                  <div className="recruitment-form-group full">

                    <label>
                      Requirements
                    </label>

                    <textarea
                      rows={4}
                      value={
                        jobForm.requirements
                      }
                      onChange={(event) =>
                        setJobForm({
                          ...jobForm,
                          requirements:
                            event.target.value,
                        })
                      }
                      placeholder="Required skills and qualifications..."
                    />

                  </div>

                </div>

                <div className="recruitment-form-actions">

                  <button
                    type="button"
                    className="recruitment-secondary-button"
                    onClick={closeJobForm}
                    disabled={submitting}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="recruitment-primary-button"
                    disabled={submitting}
                  >
                    {submitting
                      ? editingJob
                        ? 'Updating...'
                        : 'Creating...'
                      : editingJob
                      ? 'Update Job'
                      : 'Create Job'}
                  </button>

                </div>

              </form>

            </div>
          </div>
        )}

        {/* CREATE CANDIDATE MODAL */}
        {showCandidateForm && (
          <div
            className="recruitment-modal-overlay"
            onClick={() => {
              if (!submitting) {
                setShowCandidateForm(
                  false
                );
              }
            }}
          >
            <div
              className="recruitment-modal form-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="recruitment-modal-header">

                <div>
                  <h3>
                    Add Candidate
                  </h3>

                  <p>
                    Add a candidate to the
                    recruitment pipeline.
                  </p>
                </div>

                <button
                  className="recruitment-modal-close"
                  onClick={() =>
                    setShowCandidateForm(
                      false
                    )
                  }
                >
                  ×
                </button>

              </div>

              <form onSubmit={createCandidate}>

                <div className="recruitment-form-grid">

                  <div className="recruitment-form-group">

                    <label>
                      First Name *
                    </label>

                    <input
                      type="text"
                      required
                      value={
                        candidateForm.firstName
                      }
                      onChange={(event) =>
                        setCandidateForm({
                          ...candidateForm,
                          firstName:
                            event.target.value,
                        })
                      }
                      placeholder="First name"
                    />

                  </div>

                  <div className="recruitment-form-group">

                    <label>
                      Last Name *
                    </label>

                    <input
                      type="text"
                      required
                      value={
                        candidateForm.lastName
                      }
                      onChange={(event) =>
                        setCandidateForm({
                          ...candidateForm,
                          lastName:
                            event.target.value,
                        })
                      }
                      placeholder="Last name"
                    />

                  </div>

                  <div className="recruitment-form-group">

                    <label>
                      Email *
                    </label>

                    <input
                      type="email"
                      required
                      value={
                        candidateForm.email
                      }
                      onChange={(event) =>
                        setCandidateForm({
                          ...candidateForm,
                          email:
                            event.target.value,
                        })
                      }
                      placeholder="candidate@example.com"
                    />

                  </div>

                  <div className="recruitment-form-group">

                    <label>
                      Phone
                    </label>

                    <input
                      type="tel"
                      value={
                        candidateForm.phone
                      }
                      onChange={(event) =>
                        setCandidateForm({
                          ...candidateForm,
                          phone:
                            event.target.value,
                        })
                      }
                      placeholder="Phone number"
                    />

                  </div>

                  <div className="recruitment-form-group full">

                    <label>
                      Resume URL
                    </label>

                    <input
                      type="url"
                      value={
                        candidateForm.resumeUrl
                      }
                      onChange={(event) =>
                        setCandidateForm({
                          ...candidateForm,
                          resumeUrl:
                            event.target.value,
                        })
                      }
                      placeholder="https://example.com/resume.pdf"
                    />

                  </div>

                  <div className="recruitment-form-group full">

                    <label>
                      Skills
                    </label>

                    <textarea
                      rows={4}
                      value={
                        candidateForm.skills
                      }
                      onChange={(event) =>
                        setCandidateForm({
                          ...candidateForm,
                          skills:
                            event.target.value,
                        })
                      }
                      placeholder="e.g. JavaScript, React, SQL"
                    />

                  </div>

                </div>

                <div className="recruitment-form-actions">

                  <button
                    type="button"
                    className="recruitment-secondary-button"
                    onClick={() =>
                      setShowCandidateForm(
                        false
                      )
                    }
                    disabled={submitting}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="recruitment-primary-button"
                    disabled={submitting}
                  >
                    {submitting
                      ? 'Adding...'
                      : 'Add Candidate'}
                  </button>

                </div>

              </form>

            </div>
          </div>
        )}

        {/* CREATE APPLICATION MODAL */}
        {showApplicationForm && (
          <div
            className="recruitment-modal-overlay"
            onClick={() => {
              if (!submitting) {
                setShowApplicationForm(
                  false
                );
              }
            }}
          >
            <div
              className="recruitment-modal form-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="recruitment-modal-header">

                <div>
                  <h3>
                    Create Application
                  </h3>

                  <p>
                    Add a candidate to a job
                    opening.
                  </p>
                </div>

                <button
                  className="recruitment-modal-close"
                  onClick={() =>
                    setShowApplicationForm(
                      false
                    )
                  }
                >
                  ×
                </button>

              </div>

              <form
                onSubmit={
                  createApplication
                }
              >

                <div className="recruitment-form-grid">

                  <div className="recruitment-form-group full">

                    <label>
                      Job Opening *
                    </label>

                    <select
                      required
                      value={
                        applicationForm.jobId
                      }
                      onChange={(event) =>
                        setApplicationForm({
                          ...applicationForm,
                          jobId:
                            event.target.value,
                        })
                      }
                    >

                      <option value="">
                        Select a job
                      </option>

                      {jobs
                        .filter(
                          (job) =>
                            job.status ===
                            'OPEN'
                        )
                        .map((job) => (
                          <option
                            key={job.id}
                            value={job.id}
                          >
                            {job.title} —{' '}
                            {job.location ||
                              'Location not specified'}
                          </option>
                        ))}

                    </select>

                  </div>

                  <div className="recruitment-form-group full">

                    <label>
                      Candidate *
                    </label>

                    <select
                      required
                      value={
                        applicationForm.candidateId
                      }
                      onChange={(event) =>
                        setApplicationForm({
                          ...applicationForm,
                          candidateId:
                            event.target.value,
                        })
                      }
                    >

                      <option value="">
                        Select a candidate
                      </option>

                      {candidates.map(
                        (candidate) => (
                          <option
                            key={
                              candidate.id
                            }
                            value={
                              candidate.id
                            }
                          >
                            {
                              candidate.first_name
                            }{' '}
                            {
                              candidate.last_name
                            } —{' '}
                            {candidate.email}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  <div className="recruitment-form-group full">

                    <label>
                      Notes
                    </label>

                    <textarea
                      rows={4}
                      value={
                        applicationForm.notes
                      }
                      onChange={(event) =>
                        setApplicationForm({
                          ...applicationForm,
                          notes:
                            event.target.value,
                        })
                      }
                      placeholder="Add interview notes or other application details..."
                    />

                  </div>

                </div>

                <div className="recruitment-form-actions">

                  <button
                    type="button"
                    className="recruitment-secondary-button"
                    onClick={() =>
                      setShowApplicationForm(
                        false
                      )
                    }
                    disabled={submitting}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="recruitment-primary-button"
                    disabled={submitting}
                  >
                    {submitting
                      ? 'Creating...'
                      : 'Create Application'}
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