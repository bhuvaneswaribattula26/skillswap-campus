import { Link } from 'react-router-dom';
import { Sparkles, Repeat, Users, MessageCircle, Star, Coins, Brain } from 'lucide-react';

const features = [
  { icon: Users, title: 'Find your match', desc: 'Discover classmates who can teach what you want to learn.' },
  { icon: Brain, title: 'AI-powered matching', desc: 'Our recommendation engine ranks students by mutual skill fit.' },
  { icon: Repeat, title: 'Swap skills', desc: 'Send swap requests, agree on terms, and schedule sessions.' },
  { icon: MessageCircle, title: 'Chat built in', desc: 'Coordinate details directly inside every accepted swap.' },
  { icon: Star, title: 'Ratings & reviews', desc: 'Build a reputation for great teaching and reliable learning.' },
  { icon: Coins, title: 'Earn credits', desc: 'Every completed swap earns campus credits you can spend later.' },
];

export default function Landing() {
  return (
    <div>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            <Sparkles size={13} /> Built for college campuses
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Trade skills, not tuition.
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            SkillSwap Campus connects students who want to learn something new with peers who already
            know it — no money required, just a fair trade.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="btn-primary w-full sm:w-auto px-6 py-3 text-base">Get started free</Link>
            <Link to="/login" className="btn-secondary w-full sm:w-auto px-6 py-3 text-base">I already have an account</Link>
          </div>
        </div>
      </section>

      <section className="bg-white border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-slate-900">Everything you need to swap skills</h2>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon size={19} />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
                <p className="mt-1.5 text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 text-center">
        <div className="card mx-auto max-w-2xl p-10">
          <h2 className="text-2xl font-bold text-slate-900">Ready to swap your first skill?</h2>
          <p className="mt-2 text-slate-500">Join in under a minute — it's free for all verified students.</p>
          <Link to="/register" className="btn-primary mt-6 inline-flex px-6 py-3 text-base">Create your account</Link>
        </div>
      </section>
    </div>
  );
}
