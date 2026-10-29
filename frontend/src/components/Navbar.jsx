import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Sparkles, LayoutDashboard, Search, Repeat, MessageCircle, Bell, User, LogOut,
  ShieldCheck, Menu, X, Coins,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import client from '../api/client';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/discover', label: 'Discover', icon: Search },
  { to: '/swaps', label: 'Swaps', icon: Repeat },
  { to: '/chat', label: 'Chat', icon: MessageCircle },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    async function poll() {
      try {
        const { data } = await client.get('/notifications');
        if (active) { setNotifications(data.notifications); setUnreadCount(data.unreadCount); }
      } catch { /* ignore */ }
    }
    poll();
    const id = setInterval(poll, 15000);
    return () => { active = false; clearInterval(id); };
  }, [user]);

  useEffect(() => {
    function onClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function markAllRead() {
    await client.patch('/notifications/read-all');
    setNotifications((n) => n.map((x) => ({ ...x, is_read: 1 })));
    setUnreadCount(0);
  }

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center gap-2 font-extrabold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Sparkles size={16} />
            </span>
            <span className="hidden sm:inline">SkillSwap Campus</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                <Icon size={16} /> {label}
              </NavLink>
            ))}
            {user.isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                <ShieldCheck size={16} /> Admin
              </NavLink>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
            <Coins size={15} /> {user.credits}
          </div>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-50"
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-soft">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-sm font-semibold text-slate-700">Notifications</span>
                  <button onClick={markAllRead} className="text-xs font-medium text-brand-600 hover:underline">
                    Mark all read
                  </button>
                </div>
                {notifications.length === 0 && (
                  <p className="px-2 py-6 text-center text-sm text-slate-400">You're all caught up.</p>
                )}
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => { setNotifOpen(false); if (n.link) navigate(n.link); }}
                    className={`block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                      !n.is_read ? 'bg-brand-50/60' : ''
                    }`}
                  >
                    <p className="text-slate-700">{n.content}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{new Date(n.created_at).toLocaleString()}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link to="/profile" className="hidden sm:flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </Link>
          <button onClick={logout} className="hidden sm:block rounded-lg p-2 text-slate-500 hover:bg-slate-50" title="Log out">
            <LogOut size={18} />
          </button>

          <button className="md:hidden rounded-lg p-2 text-slate-600" onClick={() => setMobileOpen((o) => !o)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3">
          <div className="mb-3 flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 w-fit">
            <Coins size={15} /> {user.credits} credits
          </div>
          <div className="flex flex-col gap-1">
            {navItems.concat(user.isAdmin ? [{ to: '/admin', label: 'Admin', icon: ShieldCheck }] : []).map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600'
                  }`
                }
              >
                <Icon size={17} /> {label}
              </NavLink>
            ))}
            <NavLink to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600">
              <User size={17} /> Profile
            </NavLink>
            <button onClick={logout} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600">
              <LogOut size={17} /> Log out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
