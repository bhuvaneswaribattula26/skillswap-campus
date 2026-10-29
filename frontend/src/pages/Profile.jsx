import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Flag } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import PageLoader from '../components/PageLoader.jsx';
import SkillPill from '../components/SkillPill.jsx';
import StarRating from '../components/StarRating.jsx';

export default function Profile() {
  const { id } = useParams();
  const { user: me, refreshUser } = useAuth();
  const isOwnProfile = !id || id === me.id;

  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    name: '',
    bio: '',
    college: '',
    year: '',
  });

  const [skillName, setSkillName] = useState('');
  const [skillType, setSkillType] = useState('teach');
  const [skillLevel, setSkillLevel] = useState('Beginner');

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [status, setStatus] = useState('');

  async function loadProfile() {
    setLoading(true);

    try {
      const targetId = isOwnProfile ? me.id : id;

      const [{ data }, revRes] = await Promise.all([
        client.get(
          isOwnProfile
            ? '/users/me/full'
            : `/users/${targetId}`
        ),
        client.get(`/reviews/user/${targetId}`),
      ]);

      setProfile(data.user);

      setForm({
        name: data.user.name || '',
        bio: data.user.bio || '',
        college: data.user.college || '',
        year: data.user.year || '',
      });

      setReviews(revRes.data.reviews || []);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, [id]); // eslint-disable-line

  async function saveProfile(e) {
    e.preventDefault();

    try {
      await client.put('/users/me', form);

      await refreshUser();
      await loadProfile();

      setEditing(false);
      setStatus('Profile updated successfully!');

      setTimeout(() => setStatus(''), 2500);
    } catch (err) {
      setStatus(
        err.response?.data?.error ||
        'Could not update profile.'
      );
    }
  }

  async function addSkill(e) {
    e.preventDefault();

    if (!skillName.trim()) {
      setStatus('Please select a skill.');
      return;
    }

    try {
      await client.post('/users/me/skills', {
        skillName: skillName.trim(),
        type: skillType,
        level: skillLevel,
      });

      setSkillName('');

      await refreshUser();
      await loadProfile();

      setStatus('Skill added successfully!');

      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      setStatus(
        err.response?.data?.error ||
        'Could not add skill.'
      );
    }
  }

  async function removeSkill(userSkillId) {
    try {
      await client.delete(`/users/me/skills/${userSkillId}`);

      await refreshUser();
      await loadProfile();

      setStatus('Skill removed.');

      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      setStatus(
        err.response?.data?.error ||
        'Could not remove skill.'
      );
    }
  }

  async function submitReport(e) {
    e.preventDefault();

    try {
      await client.post('/reports', {
        reportedUserId: profile.id,
        reason: reportReason,
      });

      setReportOpen(false);
      setReportReason('');

      setStatus(
        'Report submitted. Our team will review it.'
      );

      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      setStatus(
        err.response?.data?.error ||
        'Could not submit report.'
      );
    }
  }

  if (loading || !profile) {
    return <PageLoader />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">

      {/* STATUS MESSAGE */}
      {status && (
        <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
          {status}
        </div>
      )}

      {/* PROFILE HEADER */}
      <div className="card p-6 sm:p-8">

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">

          <div className="flex items-center gap-4">

            {/* PROFILE AVATAR */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
              {profile.name?.charAt(0)?.toUpperCase()}
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {profile.name}
              </h1>

              <p className="text-sm text-slate-500">
                {profile.college}

                {profile.year
                  ? ` · ${profile.year}`
                  : ''}
              </p>

              {profile.rating && (
                <div className="mt-1 flex items-center gap-1.5">
                  <StarRating
                    value={profile.rating}
                    readOnly
                    size={14}
                  />

                  <span className="text-xs text-slate-400">
                    {profile.rating} ({profile.ratingCount})
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">

            {isOwnProfile ? (
              <button
                onClick={() =>
                  setEditing((e) => !e)
                }
                className="btn-secondary"
              >
                {editing
                  ? 'Cancel'
                  : 'Edit profile'}
              </button>
            ) : (
              <button
                onClick={() => setReportOpen(true)}
                className="btn-danger"
              >
                <Flag size={15} />
                Report
              </button>
            )}

          </div>
        </div>

        {/* EDIT PROFILE */}
        {editing ? (

          <form
            onSubmit={saveProfile}
            className="mt-6 space-y-4 border-t border-slate-100 pt-6"
          >

            <div>
              <label className="label">
                Name
              </label>

              <input
                className="input"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="label">
                Bio
              </label>

              <textarea
                className="input"
                rows={3}
                value={form.bio}
                onChange={(e) =>
                  setForm({
                    ...form,
                    bio: e.target.value,
                  })
                }
                placeholder="Tell other students about yourself…"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">

              <div>
                <label className="label">
                  College
                </label>

                <input
                  className="input"
                  value={form.college}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      college: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="label">
                  Year
                </label>

                <input
                  className="input"
                  value={form.year}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      year: e.target.value,
                    })
                  }
                />
              </div>

            </div>

            <button
              type="submit"
              className="btn-primary"
            >
              Save changes
            </button>

          </form>

        ) : (

          profile.bio && (
            <p className="mt-5 text-sm text-slate-600 border-t border-slate-100 pt-5">
              {profile.bio}
            </p>
          )

        )}

      </div>

      {/* TEACH + LEARN SKILLS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* CAN TEACH */}
        <div className="card p-6">

          <h2 className="font-semibold text-slate-900 mb-3">
            Can teach
          </h2>

          <div className="flex flex-wrap gap-2 mb-4">

            {profile.teach?.length === 0 && (
              <p className="text-sm text-slate-400">
                No teaching skills added yet.
              </p>
            )}

            {profile.teach?.map((s) => (
              <SkillPill
                key={s.user_skill_id}
                name={s.name}
                type="teach"
                level={s.level}
                onRemove={
                  isOwnProfile
                    ? () =>
                        removeSkill(
                          s.user_skill_id
                        )
                    : undefined
                }
              />
            ))}

          </div>
        </div>

        {/* WANTS TO LEARN */}
        <div className="card p-6">

          <h2 className="font-semibold text-slate-900 mb-3">
            Wants to learn
          </h2>

          <div className="flex flex-wrap gap-2 mb-4">

            {profile.learn?.length === 0 && (
              <p className="text-sm text-slate-400">
                No learning goals added yet.
              </p>
            )}

            {profile.learn?.map((s) => (
              <SkillPill
                key={s.user_skill_id}
                name={s.name}
                type="learn"
                level={s.level}
                onRemove={
                  isOwnProfile
                    ? () =>
                        removeSkill(
                          s.user_skill_id
                        )
                    : undefined
                }
              />
            ))}

          </div>
        </div>

      </div>

      {/* ADD SKILL */}
      {isOwnProfile && (

        <div className="card p-6">

          <h2 className="font-semibold text-slate-900 mb-1">
            Add a skill
          </h2>

          <p className="text-sm text-slate-500 mb-4">
            Choose a skill you can teach or want to learn.
          </p>

          <form
            onSubmit={addSkill}
            className="flex flex-col gap-3"
          >

            {/* SKILL SELECTOR */}
            <div>
              <label className="label">
                Skill
              </label>

              <select
                className="input w-full"
                value={skillName}
                onChange={(e) =>
                  setSkillName(e.target.value)
                }
              >

                <option value="">
                  Select a skill
                </option>

                {/* PROGRAMMING */}
                <optgroup label="💻 Programming & Technology">

                  <option>Python</option>

                  <option>Java</option>

                  <option>JavaScript</option>

                  <option>TypeScript</option>

                  <option>C</option>

                  <option>C++</option>

                  <option>C#</option>

                  <option>Go</option>

                  <option>Rust</option>

                  <option>PHP</option>

                  <option>Ruby</option>

                  <option>Kotlin</option>

                  <option>Swift</option>

                  <option>Dart</option>

                </optgroup>

                {/* WEB DEVELOPMENT */}
                <optgroup label="🌐 Web Development">

                  <option>HTML</option>

                  <option>CSS</option>

                  <option>React</option>

                  <option>Angular</option>

                  <option>Vue.js</option>

                  <option>Node.js</option>

                  <option>Express.js</option>

                  <option>Next.js</option>

                  <option>Spring Boot</option>

                  <option>Django</option>

                  <option>Flask</option>

                  <option>FastAPI</option>

                </optgroup>

                {/* DATABASE */}
                <optgroup label="🗄️ Database">

                  <option>SQL</option>

                  <option>MySQL</option>

                  <option>PostgreSQL</option>

                  <option>MongoDB</option>

                  <option>Oracle Database</option>

                  <option>Redis</option>

                </optgroup>

                {/* AI / DATA */}
                <optgroup label="🤖 AI & Data">

                  <option>Machine Learning</option>

                  <option>Deep Learning</option>

                  <option>Artificial Intelligence</option>

                  <option>Data Science</option>

                  <option>Data Analysis</option>

                  <option>Natural Language Processing</option>

                  <option>Computer Vision</option>

                </optgroup>

                {/* CLOUD & DEVOPS */}
                <optgroup label="☁️ Cloud & DevOps">

                  <option>AWS</option>

                  <option>Microsoft Azure</option>

                  <option>Google Cloud</option>

                  <option>Docker</option>

                  <option>Kubernetes</option>

                  <option>Git</option>

                  <option>GitHub</option>

                  <option>Jenkins</option>

                </optgroup>

                {/* DESIGN */}
                <optgroup label="🎨 Design">

                  <option>UI/UX Design</option>

                  <option>Graphic Design</option>

                  <option>Figma</option>

                  <option>Canva</option>

                  <option>Web Design</option>

                </optgroup>

                {/* LANGUAGES */}
                <optgroup label="🗣️ Languages">

                  <option>English</option>

                  <option>Telugu</option>

                  <option>Hindi</option>

                  <option>Tamil</option>

                  <option>Kannada</option>

                  <option>Malayalam</option>

                  <option>Spanish</option>

                  <option>French</option>

                  <option>German</option>

                  <option>Japanese</option>

                </optgroup>

                {/* CREATIVE */}
                <optgroup label="🎭 Creative Skills">

                  <option>Photography</option>

                  <option>Video Editing</option>

                  <option>Content Writing</option>

                  <option>Creative Writing</option>

                  <option>Singing</option>

                  <option>Guitar</option>

                  <option>Piano</option>

                  <option>Drawing</option>

                  <option>Painting</option>

                </optgroup>

                {/* OTHER */}
                <optgroup label="⭐ Other Skills">

                  <option>Public Speaking</option>

                  <option>Leadership</option>

                  <option>Communication</option>

                  <option>Digital Marketing</option>

                  <option>MS Excel</option>

                  <option>Chess</option>

                </optgroup>

              </select>
            </div>

            {/* TYPE + LEVEL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <div>
                <label className="label">
                  Skill type
                </label>

                <select
                  className="input w-full"
                  value={skillType}
                  onChange={(e) =>
                    setSkillType(e.target.value)
                  }
                >
                  <option value="teach">
                    I can teach
                  </option>

                  <option value="learn">
                    I want to learn
                  </option>
                </select>
              </div>

              {skillType === 'teach' && (

                <div>
                  <label className="label">
                    Skill level
                  </label>

                  <select
                    className="input w-full"
                    value={skillLevel}
                    onChange={(e) =>
                      setSkillLevel(e.target.value)
                    }
                  >
                    <option>
                      Beginner
                    </option>

                    <option>
                      Intermediate
                    </option>

                    <option>
                      Advanced
                    </option>
                  </select>
                </div>

              )}

            </div>

            {/* ADD BUTTON */}
            <button
              type="submit"
              className="btn-primary w-full sm:w-fit"
            >
              <Plus size={16} />
              Add Skill
            </button>

          </form>

        </div>

      )}

      {/* REVIEWS */}
      <div className="card p-6">

        <h2 className="font-semibold text-slate-900 mb-3">
          Reviews
        </h2>

        {reviews.length === 0 ? (

          <p className="text-sm text-slate-400">
            No reviews yet.
          </p>

        ) : (

          <div className="space-y-4">

            {reviews.map((r) => (

              <div
                key={r.id}
                className="border-b border-slate-100 pb-4 last:border-0 last:pb-0"
              >

                <div className="flex items-center justify-between">

                  <p className="font-medium text-slate-800 text-sm">
                    {r.reviewer_name}
                  </p>

                  <StarRating
                    value={r.rating}
                    readOnly
                    size={14}
                  />

                </div>

                {r.comment && (
                  <p className="text-sm text-slate-500 mt-1">
                    {r.comment}
                  </p>
                )}

              </div>

            ))}

          </div>

        )}

      </div>

      {/* REPORT MODAL */}
      {reportOpen && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="card w-full max-w-md p-6">

            <h3 className="font-semibold text-slate-900 mb-3">
              Report {profile.name}
            </h3>

            <form
              onSubmit={submitReport}
              className="space-y-3"
            >

              <textarea
                required
                className="input"
                rows={4}
                placeholder="Describe the issue…"
                value={reportReason}
                onChange={(e) =>
                  setReportReason(e.target.value)
                }
              />

              <div className="flex gap-2 justify-end">

                <button
                  type="button"
                  onClick={() =>
                    setReportOpen(false)
                  }
                  className="btn-secondary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-danger"
                >
                  Submit report
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}