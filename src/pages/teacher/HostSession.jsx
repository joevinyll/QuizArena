import { useParams, useNavigate, Link, useBeforeUnload } from "react-router-dom";
import { useQuiz } from "../../context/QuizContext";
import SessionCodeDisplay from "../../components/SessionCodeDisplay";
import ProgressBar from "../../components/ProgressBar";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const [teamName, setTeamName] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerSecondsInput, setTimerSecondsInput] = useState("");
  const [pointsInput, setPointsInput] = useState("");
  const allowNavigationRef = useRef(false);
  const shouldBlockNavigation =
    Boolean(session) &&
    !allowNavigationRef.current &&
    (session.status === "lobby" || session.status === "running");

  // Count answers for current question
  const answerStats = useMemo(() => {
    if (!session || !currentQ) return { total: 0, counts: [0, 0, 0, 0] };
    const counts = currentQ.choices.map(() => 0);
    let total = 0;
    session.participants.forEach((p) => {
      const ans = p.answers.find((a) => a.questionId === currentQ.id);
      if (ans) {
        if (ans.choiceIndex >= 0) {
          counts[ans.choiceIndex] = (counts[ans.choiceIndex] || 0) + 1;
        }
        total++;
      }
    });
    return { total, counts };
  }, [session, currentQ]);

  useEffect(() => {
    if (
      !session?.timerEnabled ||
      session.status !== "running" ||
      !session.questionStartedAt
    ) {
      setTimeLeft(null);
      return;
    }

    const syncTimer = () => {
      const elapsedSeconds = Math.floor(
        (Date.now() - session.questionStartedAt) / 1000,
      );
      setTimeLeft(Math.max(0, session.timerSeconds - elapsedSeconds));
    };

    syncTimer();
    const interval = setInterval(syncTimer, 250);
    return () => clearInterval(interval);
  }, [
    session?.timerEnabled,
    session?.status,
    session?.questionStartedAt,
    session?.timerSeconds,
  ]);

  useEffect(() => {
    if (!session) return;
    setTimerSecondsInput(String(session.timerSeconds ?? 20));
    setPointsInput(String(session.pointsPerCorrect ?? 1));
  }, [session?.code, session?.timerSeconds, session?.pointsPerCorrect]);

  useBeforeUnload(
    useMemo(
      () => (event) => {
        if (!shouldBlockNavigation) return;
        event.preventDefault();
        event.returnValue = "";
      },
      [shouldBlockNavigation],
    ),
    { capture: true },
  );

  useEffect(() => {
    if (!shouldBlockNavigation || !session) return;

    const handleDocumentClick = async (event) => {
      const link = event.target.closest("a");
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
      if (link.target && link.target !== "_self") return;

      const targetUrl = new URL(link.href, window.location.href);
      const currentUrl = new URL(window.location.href);

      if (targetUrl.origin !== currentUrl.origin) return;
      if (
        targetUrl.pathname === currentUrl.pathname &&
        targetUrl.search === currentUrl.search &&
        targetUrl.hash === currentUrl.hash
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const shouldEndSession = window.confirm("Are you sure to end session?");
      if (!shouldEndSession) return;

      allowNavigationRef.current = true;
      try {
        await endSession(session.code);
        navigate(`${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`);
      } catch {
        allowNavigationRef.current = false;
        alert("Unable to end the session right now. Please try again.");
      }
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [shouldBlockNavigation, endSession, navigate, session]);

  const teamStandings = useMemo(() => {
    if (!session?.teamMode) return [];

    const teamMap = new Map();

    (session.teams || []).forEach((team) => {
      teamMap.set(team, { name: team, points: 0, members: 0, correct: 0 });
    });

    session.participants.forEach((participant) => {
      if (!participant.team) return;
      const existing = teamMap.get(participant.team) || {
        name: participant.team,
        points: 0,
        members: 0,
        correct: 0,
      };
      existing.points += participant.score || 0;
      existing.members += 1;
      existing.correct += participant.answers.filter((answer) => answer.correct).length;
      teamMap.set(participant.team, existing);
    });

    return [...teamMap.values()].sort((a, b) => b.points - a.points);
  }, [session]);

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
      allowNavigationRef.current = true;
      await endSession(session.code);
      navigate(`/teacher/results/${session.code}`);
    } else {
      await advanceQuestion(session.code);
    }
  };

  const handleEnd = async () => {
    if (confirm("End this session now?")) {
      allowNavigationRef.current = true;
      await endSession(session.code);
      navigate(`/teacher/results/${session.code}`);
    }
  };

  const handleAddTeam = async (event) => {
    event.preventDefault();
    const nextTeam = teamName.trim();
    if (!nextTeam) return;

    if ((session.teams || []).includes(nextTeam)) {
      alert("That group already exists.");
      return;
    }

    await updateSession(session.code, {
      teams: [...(session.teams || []), nextTeam],
    });
    setTeamName("");
  };

  const handleRemoveTeam = async (teamToRemove) => {
    const hasMembers = session.participants.some(
      (participant) => participant.team === teamToRemove,
    );
    if (hasMembers) {
      alert("Students are already assigned to this group.");
      return;
    }

    await updateSession(session.code, {
      teams: (session.teams || []).filter((team) => team !== teamToRemove),
    });
  };

  const commitTimerSeconds = async () => {
    const parsed = parseInt(timerSecondsInput, 10);
    const nextValue = Math.max(5, Number.isNaN(parsed) ? 5 : parsed);
    setTimerSecondsInput(String(nextValue));
    if (nextValue !== session.timerSeconds) {
      await updateSession(session.code, { timerSeconds: nextValue });
    }
  };

  const commitPointsPerCorrect = async () => {
    const parsed = parseInt(pointsInput, 10);
    const nextValue = Math.max(0, Number.isNaN(parsed) ? 0 : parsed);
    setPointsInput(String(nextValue));
    if (nextValue !== (session.pointsPerCorrect ?? 1)) {
      await updateSession(session.code, { pointsPerCorrect: nextValue });
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
              {session.teamMode && (
                <div className="p-3 rounded-xl bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-700">
                      Groups
                    </span>
                    <span className="text-xs text-slate-500">
                      Teacher-managed
                    </span>
                  </div>
                  <form onSubmit={handleAddTeam} className="flex gap-2">
                    <input
                      value={teamName}
                      onChange={(event) => setTeamName(event.target.value.slice(0, 30))}
                      placeholder="Add group name"
                      className="flex-1 px-3 py-2 rounded-lg border-2 border-slate-200 text-sm"
                    />
                    <button type="submit" className="btn-secondary !py-2 !px-4">
                      Add
                    </button>
                  </form>
                  {(session.teams || []).length === 0 ? (
                    <p className="text-xs text-amber-700">
                      Add at least one group before students join with team mode.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(session.teams || []).map((team) => (
                        <button
                          key={team}
                          type="button"
                          onClick={() => handleRemoveTeam(team)}
                          className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sm text-slate-700 hover:border-rose-300 hover:text-rose-600"
                        >
                          {team} ×
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
                    inputMode="numeric"
                    value={timerSecondsInput}
                    onChange={(e) => setTimerSecondsInput(e.target.value)}
                    onBlur={commitTimerSeconds}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitTimerSeconds();
                      }
                    }}
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
                  inputMode="numeric"
                  value={pointsInput}
                  onChange={(e) => setPointsInput(e.target.value)}
                  onBlur={commitPointsPerCorrect}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitPointsPerCorrect();
                    }
                  }}
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
                  {p.team ? ` · ${p.team}` : ""}
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
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {timeLeft !== null && (
              <div
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold text-xs sm:text-sm ${timeLeft <= 5 ? "bg-rose-100 text-rose-700 animate-pulse" : "bg-brand-100 text-brand-700"}`}
              >
                ⏱️ {timeLeft}s
              </div>
            )}
            <button
              onClick={handleEnd}
              className="btn-danger !py-2 !px-3 sm:!px-5 text-xs sm:text-sm flex-shrink-0"
            >
              End
              <span className="hidden sm:inline">&nbsp;Session</span>
            </button>
          </div>
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
              {session.teamMode && teamStandings.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Group Standings
                  </p>
                  <div className="space-y-2">
                    {teamStandings.map((team, index) => (
                      <div
                        key={team.name}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-brand-50 border border-brand-100"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold bg-brand-600 text-white">
                            {index + 1}
                          </span>
                          <span className="font-medium text-sm text-slate-800 truncate">
                            {team.name}
                          </span>
                        </div>
                        <span className="font-bold text-brand-700 text-sm">
                          {team.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                        {p.team ? ` · ${p.team}` : ""}
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
