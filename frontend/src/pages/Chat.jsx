import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Send,
  Search,
  MessageCircle,
  MoreVertical,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import PageLoader from '../components/PageLoader.jsx';

export default function Chat() {
  const { swapId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  async function loadThreads() {
    try {
      const { data } = await client.get('/messages/threads');
      setThreads(data.threads || []);

      if (!swapId && data.threads?.length > 0) {
        navigate(`/chat/${data.threads[0].swapId}`, { replace: true });
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }

  async function loadMessages() {
    if (!swapId) return;

    try {
      const { data } = await client.get(`/messages/swap/${swapId}`);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }

  useEffect(() => {
    async function init() {
      setLoading(true);

      await loadThreads();
      await loadMessages();

      setLoading(false);
    }

    init();
  }, [swapId]);

  useEffect(() => {
    if (!swapId) return;

    const interval = setInterval(() => {
      loadMessages();
      loadThreads();
    }, 4000);

    return () => clearInterval(interval);
  }, [swapId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages]);

  async function send(e) {
    e.preventDefault();

    if (!content.trim() || !swapId || sending) return;

    const text = content.trim();

    setContent('');
    setSending(true);

    try {
      await client.post('/messages', {
        swapId,
        content: text,
      });

      await loadMessages();
      await loadThreads();

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } catch (error) {
      console.error('Failed to send message:', error);
      setContent(text);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <PageLoader />;
  }

  const activeThread = threads.find(
    (t) => String(t.swapId) === String(swapId)
  );

  const filteredThreads = threads.filter((t) =>
    t.otherUser.name
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">

        {/* Page Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
              <MessageCircle size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Messages
              </h1>
              <p className="text-sm text-slate-500">
                Connect with your skill-swap partners
              </p>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          style={{ height: '72vh' }}
        >
          <div className="grid h-full grid-cols-1 md:grid-cols-[320px_1fr]">

            {/* ================= SIDEBAR ================= */}
            <aside
              className={`flex flex-col border-r border-slate-100 ${
                swapId ? 'hidden md:flex' : 'flex'
              }`}
            >

              {/* Sidebar Header */}
              <div className="border-b border-slate-100 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Conversations
                    </h2>

                    <p className="text-xs text-slate-400 mt-0.5">
                      {threads.length} conversation
                      {threads.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <MessageCircle size={17} />
                  </div>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                  />
                </div>
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto">

                {threads.length === 0 ? (
                  <EmptyConversations />
                ) : filteredThreads.length === 0 ? (
                  <div className="p-6 text-center">
                    <Search
                      size={25}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-2 text-sm font-medium text-slate-500">
                      No conversations found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Try another name
                    </p>
                  </div>
                ) : (
                  filteredThreads.map((t) => {
                    const isActive =
                      String(t.swapId) === String(swapId);

                    return (
                      <button
                        key={t.swapId}
                        onClick={() =>
                          navigate(`/chat/${t.swapId}`)
                        }
                        className={`group flex w-full items-center gap-3 border-b border-slate-50 p-4 text-left transition ${
                          isActive
                            ? 'bg-brand-50'
                            : 'hover:bg-slate-50'
                        }`}
                      >

                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ${
                              isActive
                                ? 'bg-brand-600 text-white'
                                : 'bg-brand-100 text-brand-700'
                            }`}
                          >
                            {t.otherUser.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          {/* Online-style indicator */}
                          {isActive && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                          )}
                        </div>

                        {/* Conversation Info */}
                        <div className="min-w-0 flex-1">

                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`truncate text-sm ${
                                isActive
                                  ? 'font-bold text-brand-700'
                                  : 'font-semibold text-slate-800'
                              }`}
                            >
                              {t.otherUser.name}
                            </p>

                            {t.unread > 0 && (
                              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">
                                {t.unread > 99 ? '99+' : t.unread}
                              </span>
                            )}
                          </div>

                          <p className="mt-1 truncate text-xs text-slate-400">
                            {t.lastMessage?.content ||
                              'Start a conversation'}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            {/* ================= CHAT AREA ================= */}
            <section
              className={`flex min-w-0 flex-col ${
                !swapId ? 'hidden md:flex' : 'flex'
              }`}
            >

              {!swapId || !activeThread ? (
                <EmptyChat />
              ) : (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3.5">

                    <div className="flex min-w-0 items-center gap-3">

                      {/* Mobile back */}
                      <button
                        onClick={() => navigate('/chat')}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
                      >
                        <ArrowLeft size={18} />
                      </button>

                      <div className="relative">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">
                          {activeThread.otherUser.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {activeThread.otherUser.name}
                        </p>

                        <p className="text-xs text-emerald-600">
                          SkillSwap partner
                        </p>
                      </div>
                    </div>

                    <button
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      title="More options"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="relative flex-1 overflow-y-auto bg-slate-50/70 px-4 py-5">

                    {messages.length === 0 ? (
                      <div className="flex h-full items-center justify-center">
                        <div className="max-w-sm text-center">

                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                            <Sparkles size={27} />
                          </div>

                          <h3 className="mt-4 font-semibold text-slate-800">
                            Start the conversation
                          </h3>

                          <p className="mt-1 text-sm leading-6 text-slate-400">
                            Say hello and talk about what you'd
                            like to learn or teach.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mb-5 flex items-center justify-center">
                          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-slate-400 shadow-sm">
                            Your skill-swap conversation
                          </span>
                        </div>

                        <div className="space-y-3">
                          {messages.map((m) => {
                            const mine =
                              m.sender_id === user.id;

                            return (
                              <div
                                key={m.id}
                                className={`flex ${
                                  mine
                                    ? 'justify-end'
                                    : 'justify-start'
                                }`}
                              >
                                <div
                                  className={`max-w-[78%] sm:max-w-[65%] ${
                                    mine
                                      ? 'items-end'
                                      : 'items-start'
                                  }`}
                                >

                                  <div
                                    className={`rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-sm ${
                                      mine
                                        ? 'rounded-br-md bg-brand-600 text-white'
                                        : 'rounded-bl-md border border-slate-100 bg-white text-slate-700'
                                    }`}
                                  >
                                    {m.content}
                                  </div>

                                  <p
                                    className={`mt-1 px-1 text-[10px] text-slate-400 ${
                                      mine
                                        ? 'text-right'
                                        : 'text-left'
                                    }`}
                                  >
                                    {new Date(
                                      m.created_at
                                    ).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div ref={bottomRef} />
                      </>
                    )}
                  </div>

                  {/* Message Input */}
                  <form
                    onSubmit={send}
                    className="border-t border-slate-100 bg-white p-3"
                  >
                    <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 transition focus-within:border-brand-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-50">

                      <input
                        ref={inputRef}
                        className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                        placeholder="Write a message..."
                        value={content}
                        onChange={(e) =>
                          setContent(e.target.value)
                        }
                        disabled={sending}
                      />

                      <button
                        type="submit"
                        disabled={!content.trim() || sending}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Send size={17} />
                      </button>
                    </div>

                    <p className="mt-2 px-2 text-[10px] text-slate-400">
                      Talk about your skills, learning goals, and
                      session plans.
                    </p>
                  </form>
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ================= EMPTY CONVERSATIONS ================= */

function EmptyConversations() {
  return (
    <div className="flex h-full min-h-[300px] flex-col items-center justify-center px-6 text-center">

      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <MessageCircle size={28} />
      </div>

      <h3 className="mt-4 font-semibold text-slate-800">
        No conversations yet
      </h3>

      <p className="mt-1 max-w-xs text-sm leading-6 text-slate-400">
        Accept a skill-swap request to start chatting with
        another student.
      </p>
    </div>
  );
}


/* ================= EMPTY CHAT ================= */

function EmptyChat() {
  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50/70 px-6">
      <div className="max-w-md text-center">

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50 text-brand-600 shadow-sm">
          <MessageCircle size={34} />
        </div>

        <h2 className="mt-5 text-xl font-bold text-slate-800">
          Your conversations
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Select a conversation from the left to start
          messaging your skill-swap partner.
        </p>
      </div>
    </div>
  );
}