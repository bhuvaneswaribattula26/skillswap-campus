import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 flex flex-col items-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Sparkles size={20} />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Log in to continue swapping skills.</p>
      </div>

      <form onSubmit={onSubmit} className="card p-6 sm:p-8 space-y-4">
        {error && <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</div>}
        <div>
          <label className="label">Email</label>
          <input
            type="email" required className="input" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@campus.edu"
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            type="password" required className="input" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Logging in…' : 'Log in'}
        </button>
        <p className="text-center text-sm text-slate-500">
          New here? <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create an account</Link>
        </p>
      </form>

      <p className="mt-6 text-center text-xs text-slate-400">
        Demo login: alice@campus.edu / Password123! (after running the seed script)
      </p>
    </div>
  );
}
