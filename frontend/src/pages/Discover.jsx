import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Search as SearchIcon,
  SlidersHorizontal,
} from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import PageLoader from '../components/PageLoader.jsx';
import SkillPill from '../components/SkillPill.jsx';
import StarRating from '../components/StarRating.jsx';

export default function Discover() {
  const { user } = useAuth();

  const [tab, setTab] = useState('recommended');
  const [recs, setRecs] = useState([]);
  const [users, setUsers] = useState([]);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [requestTarget, setRequestTarget] = useState(null);

  async function loadRecs() {
    try {
      const { data } = await client.get(
        '/discover/recommendations'
      );

      setRecs(data.recommendations || []);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
      setRecs([]);
    }
  }

  async function loadBrowse(q = '') {
    try {
      const { data } = await client.get('/discover', {
        params: { q },
      });

      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      setUsers([]);
    }
  }

  useEffect(() => {
    async function init() {
      setLoading(true);

      await Promise.all([
        loadRecs(),
        loadBrowse(),
      ]);

      setLoading(false);
    }

    init();
  }, []);

  async function onSearch(e) {
    e.preventDefault();

    setLoading(true);

    await loadBrowse(query);

    setLoading(false);
  }

  function filteredUsers() {
    if (filter === 'all') {
      return users;
    }

    if (filter === 'teach') {
      return users.filter(
        (u) => (u.teach || []).length > 0
      );
    }

    if (filter === 'learn') {
      return users.filter(
        (u) => (u.learn || []).length > 0
      );
    }

    return users;
  }

  const displayedUsers = filteredUsers();

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">

      {/* HEADER */}
      <div>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <Sparkles size={20} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Discover students
            </h1>

            <p className="text-slate-500 mt-1">
              Find students to learn from and teach.
            </p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200">

        <TabButton
          active={tab === 'recommended'}
          onClick={() => setTab('recommended')}
          icon={Sparkles}
        >
          For you
        </TabButton>

        <TabButton
          active={tab === 'browse'}
          onClick={() => setTab('browse')}
          icon={SearchIcon}
        >
          Browse all
        </TabButton>

      </div>

      {/* BROWSE CONTROLS */}
      {tab === 'browse' && (

        <div className="space-y-4">

          {/* SEARCH */}
          <form
            onSubmit={onSearch}
            className="flex flex-col sm:flex-row gap-2 max-w-2xl"
          >

            <div className="relative flex-1">

              <SearchIcon
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                className="input pl-10"
                placeholder="Search by name, bio, or skill…"
                value={query}
                onChange={(e) =>
                  setQuery(e.target.value)
                }
              />

            </div>

            <button
              type="submit"
              className="btn-primary shrink-0"
            >
              Search
            </button>

          </form>

          {/* FILTERS */}
          <div className="flex flex-wrap items-center gap-2">

            <div className="flex items-center gap-1.5 text-sm text-slate-500 mr-1">
              <SlidersHorizontal size={15} />
              Filter:
            </div>

            <FilterButton
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              All students
            </FilterButton>

            <FilterButton
              active={filter === 'teach'}
              onClick={() => setFilter('teach')}
            >
              Can teach
            </FilterButton>

            <FilterButton
              active={filter === 'learn'}
              onClick={() => setFilter('learn')}
            >
              Wants to learn
            </FilterButton>

          </div>

        </div>

      )}

      {/* CONTENT */}
      {loading ? (

        <PageLoader />

      ) : tab === 'recommended' ? (

        recs.length === 0 ? (

          <EmptyState />

        ) : (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            {recs.map((r) => (

              <MatchCard
                key={r.user.id}
                u={r.user}
                score={r.score}
                reasons={r.matchReasons}
                onSwap={() =>
                  setRequestTarget(r.user)
                }
              />

            ))}

          </div>

        )

      ) : (

        displayedUsers.length === 0 ? (

          <div className="card p-10 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <SearchIcon
                size={22}
                className="text-slate-400"
              />
            </div>

            <h3 className="mt-4 font-semibold text-slate-800">
              No students found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try another search or filter.
            </p>

          </div>

        ) : (

          <>

            <div className="flex items-center justify-between">

              <p className="text-sm text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-700">
                  {displayedUsers.length}
                </span>{' '}
                student
                {displayedUsers.length !== 1
                  ? 's'
                  : ''}
              </p>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

              {displayedUsers.map((u) => (

                <MatchCard
                  key={u.id}
                  u={u}
                  onSwap={() =>
                    setRequestTarget(u)
                  }
                />

              ))}

            </div>

          </>

        )

      )}

      {/* SWAP MODAL */}
      {requestTarget && (

        <SwapRequestModal
          target={requestTarget}
          me={user}
          onClose={() =>
            setRequestTarget(null)
          }
        />

      )}

    </div>
  );
}


/* ================================
   TAB BUTTON
================================ */

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium -mb-px transition ${
        active
          ? 'border-brand-600 text-brand-700'
          : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
    >
      <Icon size={15} />

      {children}
    </button>
  );
}


/* ================================
   FILTER BUTTON
================================ */

function FilterButton({
  active,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition ${
        active
          ? 'bg-brand-600 text-white border-brand-600'
          : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-700'
      }`}
    >
      {children}
    </button>
  );
}


/* ================================
   STUDENT CARD
================================ */

function MatchCard({
  u,
  score,
  reasons,
  onSwap,
}) {
  const teachSkills = u.teach || [];
  const learnSkills = u.learn || [];

  return (
    <div className="card p-5 flex flex-col hover:shadow-lg transition-shadow">

      {/* PROFILE HEADER */}
      <div className="flex items-center gap-3">

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-lg text-brand-700">
          {u.name?.charAt(0)?.toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">

          <Link
            to={`/profile/${u.id}`}
            className="font-semibold text-slate-800 hover:text-brand-700 hover:underline truncate block"
          >
            {u.name}
          </Link>

          <p className="text-xs text-slate-400 truncate">
            {u.college || 'College student'}
          </p>

          {u.year && (
            <p className="text-xs text-slate-400">
              {u.year}
            </p>
          )}

        </div>

        {typeof score === 'number' && (

          <span className="shrink-0 rounded-full bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700">
            {score} pts
          </span>

        )}

      </div>


      {/* RATING */}
      {u.rating && (

        <div className="mt-3 flex items-center gap-1.5">

          <StarRating
            value={u.rating}
            readOnly
            size={13}
          />

          <span className="text-xs text-slate-400">
            {u.rating}
          </span>

        </div>

      )}


      {/* BIO */}
      {u.bio && (

        <p className="mt-3 text-sm text-slate-500 line-clamp-2">
          {u.bio}
        </p>

      )}


      {/* CAN TEACH */}
      <div className="mt-4">

        <p className="text-xs font-semibold text-slate-600 mb-2">
          Can teach
        </p>

        {teachSkills.length > 0 ? (

          <div className="flex flex-wrap gap-1.5">

            {teachSkills.map((s) => (

              <SkillPill
                key={s.user_skill_id}
                name={s.name}
                type="teach"
              />

            ))}

          </div>

        ) : (

          <p className="text-xs text-slate-400">
            No teaching skills listed
          </p>

        )}

      </div>


      {/* WANTS TO LEARN */}
      <div className="mt-4">

        <p className="text-xs font-semibold text-slate-600 mb-2">
          Wants to learn
        </p>

        {learnSkills.length > 0 ? (

          <div className="flex flex-wrap gap-1.5">

            {learnSkills.map((s) => (

              <SkillPill
                key={s.user_skill_id}
                name={s.name}
                type="learn"
              />

            ))}

          </div>

        ) : (

          <p className="text-xs text-slate-400">
            No learning skills listed
          </p>

        )}

      </div>


      {/* MATCH REASON */}
      {reasons?.canTeachYou?.length > 0 && (

        <p className="mt-4 text-xs text-brand-600 bg-brand-50 rounded-lg px-3 py-2">

          <span className="font-semibold">
            Can teach you:
          </span>{' '}

          {reasons.canTeachYou.join(', ')}

        </p>

      )}


      {/* ACTIONS */}
      <div className="mt-5 flex gap-2">

        <Link
          to={`/profile/${u.id}`}
          className="btn-secondary flex-1 justify-center"
        >
          View profile
        </Link>

        <button
          onClick={onSwap}
          className="btn-primary flex-1"
        >
          Request swap
        </button>

      </div>

    </div>
  );
}


/* ================================
   EMPTY STATE
================================ */

function EmptyState() {
  return (
    <div className="card p-10 text-center">

      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
        <Sparkles
          size={22}
          className="text-brand-600"
        />
      </div>

      <h3 className="mt-4 font-semibold text-slate-800">
        No personalized matches yet
      </h3>

      <p className="text-sm text-slate-500 mt-2">
        Add skills you teach and want to learn
        on your profile to get personalized
        matches.
      </p>

      <Link
        to="/profile"
        className="btn-primary mt-4 inline-flex"
      >
        Go to profile
      </Link>

    </div>
  );
}


/* ================================
   SWAP REQUEST MODAL
================================ */

function SwapRequestModal({
  target,
  me,
  onClose,
}) {
  const [message, setMessage] = useState('');
  const [myOfferSkillId, setMyOfferSkillId] =
    useState('');
  const [theirSkillId, setTheirSkillId] =
    useState('');

  const [myTeach, setMyTeach] = useState([]);
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {

    client
      .get('/users/me/full')
      .then(({ data }) =>
        setMyTeach(data.user.teach || [])
      )
      .catch((err) =>
        console.error(
          'Failed to load my skills:',
          err
        )
      );

  }, []);


  async function submit(e) {
    e.preventDefault();

    setSending(true);
    setStatus('');

    try {

      await client.post('/swaps', {
        recipientId: target.id,
        requesterSkillId:
          myOfferSkillId || null,
        recipientSkillId:
          theirSkillId || null,
        message,
      });

      setStatus('success');

    } catch (err) {

      setStatus(
        err.response?.data?.error ||
          'Could not send request.'
      );

    } finally {

      setSending(false);

    }
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

      <div className="card w-full max-w-md p-6">

        {status === 'success' ? (

          <div className="text-center py-4">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              ✓
            </div>

            <p className="font-semibold text-slate-800 mt-3">
              Request sent to {target.name}!
            </p>

            <p className="text-sm text-slate-500 mt-1">
              You'll be notified when they respond.
            </p>

            <button
              onClick={onClose}
              className="btn-primary mt-4"
            >
              Done
            </button>

          </div>

        ) : (

          <>

            <h3 className="font-semibold text-slate-900 mb-1">
              Request a swap with {target.name}
            </h3>

            <p className="text-sm text-slate-500 mb-4">
              Propose what you'll teach and what
              you'd like to learn.
            </p>

            <form
              onSubmit={submit}
              className="space-y-3"
            >

              {status &&
                status !== 'success' && (

                  <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
                    {status}
                  </div>

                )}

              {/* MY SKILL */}
              <div>

                <label className="label">
                  A skill you'll teach them
                </label>

                <select
                  className="input"
                  value={myOfferSkillId}
                  onChange={(e) =>
                    setMyOfferSkillId(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Select a skill (optional)
                  </option>

                  {myTeach.map((s) => (

                    <option
                      key={s.skill_id}
                      value={s.skill_id}
                    >
                      {s.name}
                    </option>

                  ))}

                </select>

              </div>


              {/* THEIR SKILL */}
              <div>

                <label className="label">
                  A skill you'd like from them
                </label>

                <select
                  className="input"
                  value={theirSkillId}
                  onChange={(e) =>
                    setTheirSkillId(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Select a skill (optional)
                  </option>

                  {(target.teach || []).map(
                    (s) => (

                      <option
                        key={s.skill_id}
                        value={s.skill_id}
                      >
                        {s.name}
                      </option>

                    )
                  )}

                </select>

              </div>


              {/* MESSAGE */}
              <div>

                <label className="label">
                  Message
                </label>

                <textarea
                  className="input"
                  rows={3}
                  value={message}
                  onChange={(e) =>
                    setMessage(e.target.value)
                  }
                  placeholder="Hi! I'd love to swap skills…"
                />

              </div>


              {/* BUTTONS */}
              <div className="flex gap-2 justify-end pt-1">

                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={sending}
                  className="btn-primary"
                >
                  {sending
                    ? 'Sending…'
                    : 'Send request'}
                </button>

              </div>

            </form>

          </>

        )}

      </div>

    </div>
  );
}