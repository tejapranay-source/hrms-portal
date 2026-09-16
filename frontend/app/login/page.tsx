
'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000/api';

export default function Login() {
  const router = useRouter();

  const [email, setEmail] =
    useState('employee@hrms.local');

  const [password, setPassword] =
    useState('Password@123');

  const [error, setError] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  async function submit(
    e: FormEvent
  ) {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const response =
        await fetch(
          API + '/auth/login',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              email,
              password,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Login failed'
        );
      }

      localStorage.setItem(
        'hrms_token',
        data.token
      );

      localStorage.setItem(
        'hrms_user',
        JSON.stringify(data.user)
      );

      router.push('/dashboard');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Login failed'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth">
      <form
        className="card authCard"
        onSubmit={submit}
      >
        <h1>HRMS Portal</h1>

        <p className="muted">
          Employee & HR Management
        </p>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <label>
          Email

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />
        </label>

        <label>
          Password

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
          />
        </label>

        <button disabled={loading}>
          {loading
            ? 'Signing in...'
            : 'Sign in'}
        </button>

        <small>
          Demo password: Password@123
        </small>
      </form>
    </main>
  );
}

