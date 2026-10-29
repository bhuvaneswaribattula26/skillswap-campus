import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import PageLoader from '../components/PageLoader.jsx';

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  accepted: 'bg-brand-50 text-brand-700',
  declined: 'bg-red-50 text-red-600',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

export default function Swaps() {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/swaps').then(({ data }) => { setSwaps(data.swaps); setLoading(false); });
  }, []);

  if (loading) return <PageLoader />;

  const filtered = filter === 'all' ? swaps : swaps.filter((s) => s.status === filter);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Your swaps</h1>
        <p className="text-slate-500 mt-1">Track every skill-swap request you've sent or received.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'accepted', 'completed', 'declined', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize ${
              filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">No swaps in this category yet.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const otherUser = s.requester.id === user.id ? s.recipient : s.requester;
            const iAmRequester = s.requester.id === user.id;
            return (
              <Link key={s.id} to={`/swaps/${s.id}`} className="card flex items-center justify-between gap-4 p-4 hover:shadow-md transition">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">
                    {otherUser.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{otherUser.name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {iAmRequester ? 'You sent this request' : 'Sent you a request'}
                      {s.requesterSkill ? ` · ${s.requesterSkill.name}` : ''}
                      {s.recipientSkill ? ` ⇄ ${s.recipientSkill.name}` : ''}
                    </p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[s.status]}`}>
                  {s.status}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
