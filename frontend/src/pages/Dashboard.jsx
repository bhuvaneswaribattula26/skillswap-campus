import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Coins,
  Repeat,
  Star,
  Plus,
  Search,
  UserPlus,
  MessageCircle,
  CalendarDays,
  Zap,
  BookOpen,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';

import client from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import PageLoader from '../components/PageLoader.jsx';
import SkillPill from '../components/SkillPill.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [recs, setRecs] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [recRes, swapRes] = await Promise.all([
          client.get('/discover/recommendations'),
          client.get('/swaps'),
        ]);

        setRecs(recRes.data.recommendations.slice(0, 4));
        setSwaps(swapRes.data.swaps);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <PageLoader />;

  const pendingIncoming = swaps.filter(
    (s) => s.status === 'pending' && s.recipient.id === user.id
  );

  const activeSwaps = swaps.filter(
    (s) => s.status === 'accepted'
  );

  const completedSwaps = swaps.filter(
    (s) => s.status === 'completed'
  );

  const firstName = user.name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* HERO / WELCOME */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-indigo-600 to-violet-700 p-6 text-white shadow-xl sm:p-8">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-purple-300/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                <Sparkles size={14} />
                SkillSwap Campus
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Welcome back, {firstName}! 👋
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
                Discover students, exchange knowledge, and turn your skills
                into meaningful connections.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/discover"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <Search size={17} />
                  Find a skill
                </Link>

                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  <UserPlus size={17} />
                  Complete profile
                </Link>
              </div>
            </div>

            <div className="hidden lg:flex h-36 w-36 shrink-0 items-center justify-center rounded-3xl border border-white/20 bg-white/10 backdrop-blur">
              <div className="text-center">
                <Zap className="mx-auto mb-2" size={34} />
                <p className="text-3xl font-bold">{user.credits}</p>
                <p className="text-xs text-white/70">Credits</p>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Coins}
            label="Available credits"
            value={user.credits}
            color="amber"
            description="Ready to use"
          />

          <StatCard
            icon={Repeat}
            label="Active swaps"
            value={activeSwaps.length}
            color="blue"
            description="Currently ongoing"
          />

          <StatCard
            icon={Star}
            label="Pending requests"
            value={pendingIncoming.length}
            color="rose"
            description="Waiting for you"
          />

          <StatCard
            icon={CheckCircle2}
            label="Completed swaps"
            value={completedSwaps.length}
            color="green"
            description="Knowledge exchanged"
          />
        </section>

        {/* QUICK ACTIONS */}
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Quick actions
              </h2>
              <p className="text-sm text-slate-500">
                Jump into what you want to do
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <QuickAction
              to="/discover"
              icon={Search}
              title="Find skills"
              text="Discover students"
            />

            <QuickAction
              to="/profile"
              icon={BookOpen}
              title="My skills"
              text="Manage your skills"
            />

            <QuickAction
              to="/swaps"
              icon={Repeat}
              title="My swaps"
              text="Track your exchanges"
            />

            <QuickAction
              to="/chat"
              icon={MessageCircle}
              title="Messages"
              text="Chat with students"
            />
          </div>
        </section>

        {/* MAIN CONTENT */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* RECOMMENDATIONS */}
          <section className="card overflow-hidden lg:col-span-2">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <Sparkles size={18} />
                    </div>
                    <h2 className="font-bold text-slate-900">
                      Recommended for you
                    </h2>
                  </div>

                  <p className="mt-1 pl-11 text-xs text-slate-400">
                    Students matched to your skills and interests
                  </p>
                </div>

                <Link
                  to="/discover"
                  className="hidden items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 sm:flex"
                >
                  View all
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {recs.length === 0 ? (
                <EmptyState
                  text="Add skills you want to learn and teach on your profile to unlock personalized matches."
                  cta={{
                    to: '/profile',
                    label: 'Update your profile',
                  }}
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {recs.map((r) => (
                    <RecommendationCard
                      key={r.user.id}
                      recommendation={r}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* PENDING REQUESTS */}
          <section className="card overflow-hidden">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                  <Star size={17} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Pending requests
                  </h2>
                  <p className="text-xs text-slate-400">
                    Requests waiting for you
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              {pendingIncoming.length === 0 ? (
                <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <CheckCircle2
                      size={22}
                      className="text-slate-400"
                    />
                  </div>

                  <p className="font-medium text-slate-700">
                    You're all caught up!
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    No pending requests right now.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingIncoming.map((s) => (
                    <Link
                      key={s.id}
                      to={`/swaps/${s.id}`}
                      className="block rounded-2xl border border-slate-100 p-4 transition hover:border-brand-200 hover:bg-brand-50/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-500 font-bold text-white">
                          {s.requester.name.charAt(0)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {s.requester.name}
                          </p>

                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">
                            {s.message || 'Sent a swap request'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-600">
                          Pending
                        </span>

                        <ArrowRight
                          size={15}
                          className="text-slate-400"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* LOWER SECTION */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">

          {/* PROGRESS */}
          <section className="card relative overflow-hidden p-6">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-brand-50 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <TrendingUp size={19} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Your SkillSwap journey
                  </h2>
                  <p className="text-xs text-slate-400">
                    Keep learning and sharing
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600">
                    Completed swaps
                  </span>

                  <span className="font-bold text-brand-600">
                    {completedSwaps.length}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all"
                    style={{
                      width: `${Math.min(
                        completedSwaps.length * 20,
                        100
                      )}%`,
                    }}
                  />
                </div>

                <p className="mt-3 text-xs text-slate-400">
                  Every completed swap helps you build your campus learning
                  network.
                </p>
              </div>
            </div>
          </section>

          {/* DISCOVER CTA */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-6 text-white shadow-lg">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-xl" />

            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <Sparkles size={20} />
              </div>

              <h2 className="mt-5 text-xl font-bold">
                Ready to learn something new?
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-white/75">
                Explore students who can teach you the skills you're looking
                for while you share what you already know.
              </p>

              <Link
                to="/discover"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-violet-700 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                Explore matches
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}


/* -------------------------------------------------------
   STAT CARD
------------------------------------------------------- */

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  description,
}) {
  const colors = {
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-brand-50 text-brand-600',
    rose: 'bg-rose-50 text-rose-600',
    green: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="card group relative overflow-hidden p-5 transition hover:-translate-y-1 hover:shadow-lg">
      <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-slate-50 blur-2xl transition group-hover:bg-brand-50" />

      <div className="relative flex items-center gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${colors[color]}`}
        >
          <Icon size={21} />
        </div>

        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="text-sm font-medium text-slate-600">
            {label}
          </p>

          <p className="mt-0.5 text-[11px] text-slate-400">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}


/* -------------------------------------------------------
   QUICK ACTION
------------------------------------------------------- */

function QuickAction({ to, icon: Icon, title, text }) {
  return (
    <Link
      to={to}
      className="card group flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-brand-50 group-hover:text-brand-600">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-800">
          {title}
        </p>

        <p className="truncate text-[11px] text-slate-400">
          {text}
        </p>
      </div>
    </Link>
  );
}


/* -------------------------------------------------------
   RECOMMENDATION CARD
------------------------------------------------------- */

function RecommendationCard({ recommendation: r }) {
  return (
    <div className="group rounded-2xl border border-slate-100 bg-white p-4 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-500 font-bold text-white shadow-sm">
            {r.user.name.charAt(0)}
          </div>

          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-800">
              {r.user.name}
            </p>

            <p className="truncate text-xs text-slate-400">
              {r.user.college}
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-600">
          Match {r.score}
        </span>
      </div>

      {r.matchReasons?.canTeachYou?.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Can teach you
          </p>

          <div className="flex flex-wrap gap-1.5">
            {r.matchReasons.canTeachYou
              .slice(0, 3)
              .map((s) => (
                <SkillPill
                  key={s}
                  name={s}
                  type="teach"
                />
              ))}
          </div>
        </div>
      )}

      <Link
        to="/discover"
        className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
      >
        View profile
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}


/* -------------------------------------------------------
   EMPTY STATE
------------------------------------------------------- */

function EmptyState({ text, cta }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
        <Sparkles size={24} />
      </div>

      <p className="max-w-md text-sm leading-6 text-slate-500">
        {text}
      </p>

      {cta && (
        <Link
          to={cta.to}
          className="btn-primary mt-5"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}