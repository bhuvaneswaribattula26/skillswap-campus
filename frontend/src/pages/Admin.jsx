import { useEffect, useState } from 'react';
import { Users, Repeat, Star, Flag, ShieldBan, ShieldCheck } from 'lucide-react';
import client from '../api/client';
import PageLoader from '../components/PageLoader.jsx';

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    const [s, u, r] = await Promise.all([
      client.get('/admin/stats'),
      client.get('/admin/users'),
      client.get('/admin/reports'),
    ]);
    setStats(s.data);
    setUsers(u.data.users);
    setReports(r.data.reports);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  async function toggleBan(id, banned) {
    await client.patch(`/admin/users/${id}/ban`, { banned });
    await loadAll();
  }

  async function updateReport(id, status) {
    await client.patch(`/admin/reports/${id}`, { status });
    await loadAll();
  }

  if (loading || !stats) return <PageLoader />;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin dashboard</h1>
        <p className="text-slate-500 mt-1">Platform health, users, and reports.</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {['overview', 'users', 'reports'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2.5 text-sm font-medium capitalize border-b-2 -mb-px ${
              tab === t ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500'
            }`}>{t}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard icon={Users} label="Students" value={stats.userCount} />
          <StatCard icon={Repeat} label="Pending swaps" value={stats.swapCounts.pending || 0} />
          <StatCard icon={Repeat} label="Completed swaps" value={stats.swapCounts.completed || 0} />
          <StatCard icon={Star} label="Avg rating" value={stats.avgRating ?? '—'} />
          <StatCard icon={Flag} label="Open reports" value={stats.openReports} />
        </div>
      )}

      {tab === 'users' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400 border-b border-slate-100">
              <tr>
                <th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Credits</th>
                <th className="p-3">Status</th><th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-50">
                  <td className="p-3 font-medium text-slate-700">{u.name}{u.is_admin ? ' (admin)' : ''}</td>
                  <td className="p-3 text-slate-500">{u.email}</td>
                  <td className="p-3 text-slate-500">{u.credits}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.is_banned ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                      {u.is_banned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="p-3">
                    {!u.is_admin && (
                      <button onClick={() => toggleBan(u.id, !u.is_banned)}
                        className={u.is_banned ? 'btn-secondary text-xs px-2.5 py-1.5' : 'btn-danger text-xs px-2.5 py-1.5'}>
                        {u.is_banned ? <ShieldCheck size={14} /> : <ShieldBan size={14} />}
                        {u.is_banned ? 'Unban' : 'Ban'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 && <div className="card p-8 text-center text-slate-400">No reports filed.</div>}
          {reports.map((r) => (
            <div key={r.id} className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-800">{r.reporter_name} reported {r.reported_name}</p>
                <p className="text-sm text-slate-500 mt-0.5">{r.reason}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(r.created_at).toLocaleString()}</p>
              </div>
              <select value={r.status} onChange={(e) => updateReport(r.id, e.target.value)} className="input sm:w-40">
                <option value="open">Open</option>
                <option value="reviewed">Reviewed</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card p-4 flex flex-col gap-2">
      <Icon size={18} className="text-brand-600" />
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
