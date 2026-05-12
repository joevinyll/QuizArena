import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useQuiz } from "../../context/QuizContext";
import { useFirebase } from "../../context/FirebaseContext.jsx";
import { formatDate } from "../../utils/helpers";
import { getUserFirstName } from "../../utils/helpers";

export default function TeacherDashboard() {
  const {
    quizzes,
    quizzesLoading,
    quizzesError,
    deleteQuiz,
    createSession,
    endSession,
    sessions,
  } = useQuiz();
  const { user, updateTeacherProfile, loading } = useFirebase();
  const navigate = useNavigate();
  const teacherFirstName = getUserFirstName(user);
  const [firstName, setFirstName] = useState(teacherFirstName);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [editingName, setEditingName] = useState(false);

  useEffect(() => {
    setFirstName(teacherFirstName);
  }, [teacherFirstName]);

  // Filter quizzes: if logged in, show only user's quizzes; if not, show all
  const displayedQuizzes = user
    ? quizzes.filter((q) => q.isSample || q.teacherId === user.uid)
    : quizzes;
  const activeSession = useMemo(() => {
    if (!user) return null;

    return Object.values(sessions)
      .filter(
        (session) =>
          session.hostTeacherId === user.uid && session.status !== "finished",
      )
      .sort((left, right) => {
        const leftTime = new Date(left.createdAt || 0).getTime();
        const rightTime = new Date(right.createdAt || 0).getTime();
        return rightTime - leftTime;
      })[0] || null;
  }, [sessions, user]);

  const handleHost = async (quizId) => {
    if (!user) {
      navigate("/teacher/login");
      return;
    }
    try {
      const s = await createSession(quizId, {
        teamMode: false,
        timerEnabled: false,
      });
      if (s) navigate(`/teacher/host/${s.code}`);
    } catch (err) {
      alert(err.message || "Unable to host this quiz. Please try again.");
    }
  };

  const handleDelete = async (quiz) => {
    if (!confirm(`Delete "${quiz.title}"? This cannot be undone.`)) return;

    try {
      await deleteQuiz(quiz.id);
    } catch (err) {
      alert(err.message || "Unable to delete quiz. Please try again.");
    }
  };

  const handleCancelActiveSession = async () => {
    if (!activeSession) return;

    const shouldCancel = confirm(
      `Cancel the active session ${activeSession.code}? Students will no longer be able to continue using this code.`,
    );
    if (!shouldCancel) return;

    try {
      await endSession(activeSession.code);
    } catch (err) {
      alert(err.message || "Unable to cancel the active session right now.");
    }
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setProfileMessage("");
    setProfileError("");

    if (!firstName.trim()) {
      setProfileError("Please enter your first name.");
      return;
    }

    try {
      await updateTeacherProfile({ displayName: firstName.trim() });
      setProfileMessage("First name updated.");
      setEditingName(false);
    } catch (err) {
      setProfileError(err.message || "Unable to update your profile.");
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-12">
          <span className="badge-brand mb-2">Teacher Dashboard</span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-3 mb-2">
            Manage Your Quizzes
          </h1>
          <p className="text-slate-600 mb-8">
            Sign in to create and manage your quizzes, host live sessions, and
            track student performance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/teacher/login" className="btn-primary">
              Sign in
            </Link>
            <Link to="/teacher/register" className="btn-secondary">
              Create Account
            </Link>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            Sample Quizzes
          </h2>
          {displayedQuizzes.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-slate-600">No quizzes available.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="card p-6 flex flex-col hover:shadow-soft transition opacity-75 cursor-not-allowed"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="badge-slate">{quiz.subject}</span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-1">
                    {quiz.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2 flex-1">
                    {quiz.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      {quiz.questions.length} question
                      {quiz.questions.length !== 1 && "s"}
                    </span>
                    <span>{formatDate(quiz.createdAt)}</span>
                  </div>
                  <button
                    disabled
                    className="btn-primary w-full opacity-50 cursor-not-allowed"
                  >
                    Sign in to host
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <span className="badge-brand mb-2">Teacher Dashboard</span>
        <div className="mt-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            {editingName ? (
              <form
                onSubmit={handleProfileSave}
                className="flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Welcome
                </div>
                <input
                  type="text"
                  value={firstName}
                  onChange={(event) =>
                    setFirstName(event.target.value.slice(0, 40))
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 focus:border-brand-500 focus:outline-none"
                  placeholder="Enter your first name"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-secondary whitespace-nowrap"
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingName(false);
                      setFirstName(teacherFirstName);
                      setProfileError("");
                      setProfileMessage("");
                    }}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-extrabold text-slate-900">
                  Welcome {teacherFirstName}
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    setEditingName(true);
                    setProfileError("");
                    setProfileMessage("");
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-brand-300 hover:text-brand-600"
                  title="Edit first name"
                  aria-label="Edit first name"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                    />
                  </svg>
                </button>
              </div>
            )}
            {(profileError || profileMessage) && (
              <div
                className={`mt-3 inline-flex rounded-xl px-4 py-3 text-sm ${
                  profileError
                    ? "border border-red-200 bg-red-50 text-red-700"
                    : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {profileError || profileMessage}
              </div>
            )}
            <h2 className="text-3xl font-extrabold text-slate-900 mt-3">
              Your Quiz Library
            </h2>
            <p className="text-slate-600 mt-1">
              Create, manage, and host quizzes for your classroom.
            </p>
            {activeSession && (
              <div className="mt-4 inline-flex flex-wrap items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3">
                <span className="text-sm font-semibold text-brand-700">
                  Active Session:{" "}
                  <span className="font-mono tracking-wider">
                    {activeSession.code}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => navigate(`/teacher/host/${activeSession.code}`)}
                  className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-brand-700 border border-brand-200 hover:bg-brand-100 transition"
                >
                  Return to Session
                </button>
                <button
                  type="button"
                  onClick={handleCancelActiveSession}
                  className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-rose-700 border border-rose-200 hover:bg-rose-50 transition"
                >
                  Cancel Session
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-8">
        <Link to="/teacher/create" className="btn-primary">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create New Quiz
        </Link>
      </div>

      {quizzesLoading ? (
        <div className="card p-12 text-center">
          <p className="text-slate-600">Loading your quizzes...</p>
        </div>
      ) : quizzesError ? (
        <div className="card p-12 text-center border-rose-200 bg-rose-50">
          <h3 className="text-xl font-bold text-rose-700 mb-2">
            Unable to load quizzes
          </h3>
          <p className="text-rose-700 text-sm">{quizzesError}</p>
        </div>
      ) : displayedQuizzes.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-3">📝</div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">
            No quizzes yet
          </h3>
          <p className="text-slate-600 mb-5">
            Start by creating your first quiz.
          </p>
          <Link to="/teacher/create" className="btn-primary">
            Create Quiz
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="card p-6 flex flex-col hover:shadow-soft transition"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="badge-slate">{quiz.subject}</span>
                {!quiz.isSample && (
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/teacher/edit/${quiz.id}`}
                      className="text-slate-400 hover:text-brand-600 transition p-1"
                      title="Edit quiz"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                        />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDelete(quiz)}
                      className="text-slate-400 hover:text-danger-500 transition p-1"
                      title="Delete quiz"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">
                {quiz.title}
              </h3>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2 flex-1">
                {quiz.description}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                <span className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  {quiz.questions.length} question
                  {quiz.questions.length !== 1 && "s"}
                </span>
                <span>{formatDate(quiz.createdAt)}</span>
              </div>
              <button
                onClick={() => handleHost(quiz.id)}
                className="btn-primary w-full"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Host Live Session
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
