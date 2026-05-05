import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuiz } from "../../context/QuizContext";
import SessionCodeDisplay from "../../components/SessionCodeDisplay";
import ProgressBar from "../../components/ProgressBar";
import { useMemo } from "react";

export default function HostSession() {
  const { code } = useParams();
  const navigate = useNavigate();
  const {
    getSession,
    getQuiz,
    startSession,
    advanceQuestion,
    endSession,
    updateSession,
    sessionsLoading,
  } = useQuiz();

  const session = getSession(code);
  const quiz = session ? getQuiz(session.quizId) || session.quizSnapshot : null;
  const currentQ = quiz?.questions[session?.currentQuestionIndex ?? 0];

  // Count answers for current question
  const answerStats = useMemo(() => {
    if (!session || !currentQ) return { total: 0, counts: [0, 0, 0, 0] };
    const counts = currentQ.choices.map(() => 0);
    let total = 0;
    session.participants.forEach((p) => {
      const ans = p.answers.find((a) => a.questionId === currentQ.id);
      if (ans) {
        counts[ans.choiceIndex] = (counts[ans.choiceIndex] || 0) + 1;
        total++;
      }
    });
    return { total, counts };
  }, [session, currentQ]);

  if (sessionsLoading) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4">
        <p className="text-slate-600">Loading session...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4">
        <div className="text-5xl mb-3">🔍</div>
        <h2 className="text-2xl font-bold mb-2">Session not found</h2>
        <p className="text-slate-600 mb-6">
          This session may have ended or the code is invalid.
        </p>
        <Link to="/teacher" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const handleStart = async () => {
    if (session.participants.length === 0) {
      if (!confirm("No students have joined yet. Start anyway?")) return;
    }
    await startSession(session.code);
  };

  const handleNext = async () => {
    if (session.currentQuestionIndex >= session.totalQuestions - 1) {
      await endSession(session.code);
      navigate(`/teacher/results/${session.code}`);
    } else {
      await advanceQuestion(session.code);
    }
  };

  const handleEnd = async () => {
    if (confirm("End this session now?")) {
      await endSession(session.code);
      navigate(`/teacher/results/${session.code}`);
    }
  };

  // === Lobby view ===
  if (session.status === "lobby") {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-5 sm:mb-6">
          <span className="badge-brand inline-block">Lobby — Waiting Room</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 break-words">
            {session.quizTitle}
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            {session.quizSubject} · {session.totalQuestions} questions
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
          <SessionCodeDisplay code={session.code} />

          <div className="card p-5 sm:p-6">
            <h3 className="font-bold text-slate-900 mb-4">Session Settings</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-sm font-semibold text-slate-700">
                  🤝 Team Mode
                </span>
                <input
                  type="checkbox"
                  checked={session.teamMode}
                  onChange={(e) =>
                    updateSession(session.code, { teamMode: e.target.checked })
                  }
                  className="w-5 h-5 accent-brand-600"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-sm font-semibold text-slate-700">
                  ⏱️ Question Timer
                </span>
                <input
                  type="checkbox"
                  checked={session.timerEnabled}
                  onChange={(e) =>
                    updateSession(session.code, {
                      timerEnabled: e.target.checked,
                    })
                  }
                  className="w-5 h-5 accent-brand-600"
                />
              </label>
              {session.timerEnabled && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="text-sm font-semibold text-slate-700">
                    Seconds per question
                  </span>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={session.timerSeconds}
                    onChange={(e) =>
                      updateSession(session.code, {
                        timerSeconds: Math.max(
                          5,
                          parseInt(e.target.value, 10) || 5,
                        ),
                      })
                    }
                    className="w-20 px-2 py-1 rounded-lg border-2 border-slate-200 text-center font-semibold"
                  />
                </div>
              )}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-sm font-semibold text-slate-700">
                  Points per correct answer
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={session.pointsPerCorrect ?? 1}
                  onChange={(e) =>
                    updateSession(session.code, {
                      pointsPerCorrect: Math.max(
                        0,
                        parseInt(e.target.value, 10) || 0,
                      ),
                    })
                  }
                  className="w-20 px-2 py-1 rounded-lg border-2 border-slate-200 text-center font-semibold"
                />
              </div>
            </div>

            <button
              onClick={handleStart}
              className="btn-primary w-full mt-6 text-sm sm:text-base"
            >
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="truncate">
                Start Quiz ({session.participants.length} joined)
              </span>
            </button>
          </div>
        </div>

        <div className="card p-5 sm:p-6 mt-4 sm:mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">Students Joined</h3>
            <span className="badge-brand">{session.participants.length}</span>
          </div>
          {session.participants.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <div className="text-4xl mb-2">👥</div>
              <p>Waiting for students to join...</p>
              <p className="text-sm mt-1">
                Share the code above on your screen.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {session.participants.map((p) => (
                <span
                  key={p.id}
                  className="badge-brand !text-sm !px-3 !py-1.5 animate-pop"
                >
                  {p.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // === Running view ===
  if (session.status === "running" && currentQ) {
    const answeredCount = answerStats.total;
    const totalParticipants = session.participants.length;

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0 flex-1">
            <span className="badge-success inline-block">● Live Session</span>
            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 mt-1 truncate">
              {session.quizTitle}
            </h1>
          </div>
          <button
            onClick={handleEnd}
            className="btn-danger !py-2 !px-3 sm:!px-5 text-xs sm:text-sm flex-shrink-0"
          >
            End
            <span className="hidden sm:inline">&nbsp;Session</span>
          </button>
        </div>

        <ProgressBar
          value={session.currentQuestionIndex + 1}
          max={session.totalQuestions}
          className="mb-6"
        />

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 card p-5 sm:p-6">
            <span className="badge-brand mb-3 inline-block">
              Question {session.currentQuestionIndex + 1} of{" "}
              {session.totalQuestions}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-5 break-words">
              {currentQ.text}
            </h2>
            <div className="space-y-3">
              {currentQ.choices.map((choice, idx) => {
                const count = answerStats.counts[idx];
                const pct = answerStats.total
                  ? Math.round((count / answerStats.total) * 100)
                  : 0;
                const isCorrect = idx === currentQ.correctIndex;
                return (
                  <div
                    key={idx}
                    className={`relative p-3 rounded-xl border-2 overflow-hidden ${isCorrect ? "border-success-500 bg-emerald-50" : "border-slate-200 bg-white"}`}
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-brand-100/50"
                      style={{ width: `${pct}%` }}
                    ></div>
                    <div className="relative flex items-center gap-2 sm:gap-3">
                      <span
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 ${isCorrect ? "bg-success-500 text-white" : "bg-slate-100 text-slate-600"}`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1 font-medium text-sm sm:text-base break-words">
                        {choice}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-700 flex-shrink-0 whitespace-nowrap">
                        {count} · {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="text-sm text-slate-600 text-center sm:text-left">
                <span className="font-bold text-slate-900">
                  {answeredCount}
                </span>{" "}
                of{" "}
                <span className="font-bold text-slate-900">
                  {totalParticipants}
                </span>{" "}
                answered
              </div>
              <button
                onClick={handleNext}
                className="btn-primary w-full sm:w-auto"
              >
                {session.currentQuestionIndex >= session.totalQuestions - 1
                  ? "Finish & View Results"
                  : "Next Question"}
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
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="card p-5 sm:p-6">
            <h3 className="font-bold text-slate-900 mb-3">Live Leaderboard</h3>
            <div className="space-y-2">
              {[...session.participants]
                .sort((a, b) => b.score - a.score)
                .slice(0, 10)
                .map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                          i === 0
                            ? "bg-amber-400 text-white"
                            : i === 1
                              ? "bg-slate-300 text-white"
                              : i === 2
                                ? "bg-amber-700 text-white"
                                : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="font-medium text-sm text-slate-800 truncate">
                        {p.name}
                      </span>
                    </div>
                    <span className="font-bold text-brand-700 text-sm">
                      {p.score} pts
                    </span>
                  </div>
                ))}
              {session.participants.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  No participants yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Finished — redirect to results
  if (session.status === "finished") {
    navigate(`/teacher/results/${session.code}`);
  }

  return null;
}
