import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MessageCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import PageLoader from '../components/PageLoader.jsx';
import StarRating from '../components/StarRating.jsx';

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700',
  accepted: 'bg-brand-50 text-brand-700',
  declined: 'bg-red-50 text-red-600',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

export default function SwapDetail() {
  const { id } = useParams();
  const { user, refreshUser } = useAuth();
  const [swap, setSwap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scheduleAt, setScheduleAt] = useState('');
  const [duration, setDuration] = useState(60);
  const [busy, setBusy] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [myReviewDone, setMyReviewDone] = useState(false);
  const [notice, setNotice] = useState('');

  async function load() {
    const { data } = await client.get(`/swaps/${id}`);
    setSwap(data.swap);
    if (data.swap.status === 'completed') {
      const revs = await client.get(`/reviews/user/${data.swap.requester.id === user.id ? data.swap.recipient.id : data.swap.requester.id}`);
      setMyReviewDone(revs.data.reviews.some((r) => r.swap_id === id && r.reviewer_id === user.id));
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line

  async function respond(action) {
    setBusy(true);
    try {
      await client.patch(`/swaps/${id}/respond`, { action });
      await load();
    } finally { setBusy(false); }
  }

  async function cancel() {
    setBusy(true);
    try {
      await client.patch(`/swaps/${id}/cancel`);
      await load();
    } finally { setBusy(false); }
  }

  async function complete() {
    setBusy(true);
    try {
      await client.patch(`/swaps/${id}/complete`);
      await load();
      await refreshUser();
      setNotice('Swap marked complete — credits have been added to both accounts!');
    } finally { setBusy(false); }
  }

  async function scheduleSession(e) {
    e.preventDefault();
    if (!scheduleAt) return;
    setBusy(true);
    try {
      await client.post('/sessions', { swapId: id, scheduledAt: new Date(scheduleAt).toISOString(), durationMinutes: Number(duration) });
      setScheduleAt('');
      await load();
    } finally { setBusy(false); }
  }

  async function submitReview(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await client.post('/reviews', { swapId: id, rating: reviewRating, comment: reviewComment });
      setMyReviewDone(true);
      setNotice('Thanks for the review!');
    } finally { setBusy(false); }
  }

  if (loading || !swap) return <PageLoader />;

  const otherUser = swap.requester.id === user.id ? swap.recipient : swap.requester;
  const isRecipient = swap.recipient.id === user.id;
  const isRequester = swap.requester.id === user.id;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
      {notice && <div className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">{notice}</div>}

      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">
              {otherUser.name.charAt(0)}
            </div>
            <div>
              <Link to={`/profile/${otherUser.id}`} className="font-semibold text-slate-800 hover:underline">{otherUser.name}</Link>
              <p className="text-xs text-slate-400">{otherUser.college}</p>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[swap.status]}`}>{swap.status}</span>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-400 mb-1">Requester offers</p>
            <p className="font-medium text-slate-700">{swap.requesterSkill?.name || '—'}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-400 mb-1">Recipient offers</p>
            <p className="font-medium text-slate-700">{swap.recipientSkill?.name || '—'}</p>
          </div>
        </div>

        {swap.message && (
          <p className="mt-4 text-sm text-slate-600 border-t border-slate-100 pt-4">"{swap.message}"</p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {swap.status === 'pending' && isRecipient && (
            <>
              <button disabled={busy} onClick={() => respond('accept')} className="btn-primary"><CheckCircle2 size={16} /> Accept</button>
              <button disabled={busy} onClick={() => respond('decline')} className="btn-danger"><XCircle size={16} /> Decline</button>
            </>
          )}
          {swap.status === 'pending' && isRequester && (
            <button disabled={busy} onClick={cancel} className="btn-secondary">Cancel request</button>
          )}
          {swap.status === 'accepted' && (
            <>
              <Link to={`/chat/${swap.id}`} className="btn-secondary"><MessageCircle size={16} /> Message</Link>
              <button disabled={busy} onClick={complete} className="btn-primary"><CheckCircle2 size={16} /> Mark completed</button>
            </>
          )}
          {swap.status === 'completed' && (
            <Link to={`/chat/${swap.id}`} className="btn-secondary"><MessageCircle size={16} /> Message</Link>
          )}
        </div>
      </div>

      {swap.status === 'accepted' && (
        <div className="card p-6">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900 mb-4"><Calendar size={17} /> Learning sessions</h2>
          <form onSubmit={scheduleSession} className="flex flex-col sm:flex-row gap-3 mb-5">
            <input type="datetime-local" required className="input sm:flex-1" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
            <select className="input sm:w-36" value={duration} onChange={(e) => setDuration(e.target.value)}>
              <option value={30}>30 min</option>
              <option value={60}>60 min</option>
              <option value={90}>90 min</option>
              <option value={120}>120 min</option>
            </select>
            <button type="submit" disabled={busy} className="btn-primary shrink-0">Schedule</button>
          </form>
          {swap.sessions.length === 0 ? (
            <p className="text-sm text-slate-400">No sessions scheduled yet.</p>
          ) : (
            <div className="space-y-2">
              {swap.sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock size={15} className="text-slate-400" />
                    {new Date(s.scheduled_at).toLocaleString()} · {s.duration_minutes} min
                  </div>
                  <span className="capitalize text-xs font-medium text-slate-500">{s.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {swap.status === 'completed' && !myReviewDone && (
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-3">Leave a review for {otherUser.name}</h2>
          <form onSubmit={submitReview} className="space-y-3">
            <StarRating value={reviewRating} onChange={setReviewRating} size={24} />
            <textarea className="input" rows={3} placeholder="How did the swap go?" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
            <button type="submit" disabled={busy} className="btn-primary">Submit review</button>
          </form>
        </div>
      )}
    </div>
  );
}
