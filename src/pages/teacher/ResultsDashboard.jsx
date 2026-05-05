import { useParams, Link } from "react-router-dom";
import { useQuiz } from "../../context/QuizContext";
import { calculatePercent, difficultyLabel } from "../../utils/helpers";
import { useMemo } from "react";

export default function ResultsDashboard() {
  const { code } = useParams();
  const { getSession, getQuiz, sessionsLoading } = useQuiz();
  const session = getSession(code);
  const quiz = session ? getQuiz(session.quizId) || session.quizSnapshot : null;

  const stats = useMemo(() => {
    const totalParticipants = session?.participants.length || 0;
    const totalQuestions = session?.totalQuestions || 0;
    const pointsPerCorrect = Math.max(
      0,
      Number(session?.pointsPerCorrect) || 1,
    );
    const totalPoints = totalQuestions * pointsPerCorrect;

    const ranked = session
      ? [...session.participants].sort((a, b) => b.score - a.score)
      : [];

    const avgScore = totalParticipants
      ? session.participants.reduce((sum, p) => sum + p.score, 0) /
        totalParticipants
      : 0;
    const classAccuracy = totalPoints
      ? calculatePercent(avgScore, totalPoints)
      : 0;

    const questionStats = (quiz?.questions || []).map((q) => {
      let answered = 0;
      let correct = 0;
      const choiceCounts = q.choices.map(() => 0);
      session.participants.forEach((p) => {
        const ans = p.answers.find((a) => a.questionId === q.id);
        if (ans) {
          answered++;
          if (ans.choiceIndex >= 0) {
            choiceCounts[ans.choiceIndex] =
              (choiceCounts[ans.choiceIndex] || 0) + 1;
          }
          if (ans.correct) correct++;
        }
      });
      const accuracy = answered ? Math.round((correct / answered) * 100) : 0;
      return { question: q, answered, correct, accuracy, choiceCounts };
    });

    const hardest = [...questionStats]
      .filter((s) => s.answered > 0)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);

    const teamStats = session?.teamMode
      ? (session.teams || []).map((teamName) => {
          const members = session.participants.filter(
            (participant) => participant.team === teamName,
          );
          const points = members.reduce(
            (sum, participant) => sum + (participant.score || 0),
            0,
          );
          const correctAnswers = members.reduce(
            (sum, participant) =>
              sum +
              participant.answers.filter((answer) => answer.correct).length,
            0,
          );
          return {
            name: teamName,
            members: members.length,
            points,
            correctAnswers,
          };
        }).sort((a, b) => b.points - a.points)
      : [];

    return {
      totalParticipants,
      totalQuestions,
      totalPoints,
      pointsPerCorrect,
      ranked,
      avgScore,
      classAccuracy,
      questionStats,
      hardest,
      teamStats,
    };
  }, [session, quiz]);

  if (sessionsLoading) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4">
        <p className="text-slate-600">Loading results...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4">
        <h2 className="text-2xl font-bold mb-2">Session not found</h2>
        <Link to="/teacher" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-6">
        <div>
          <span className="badge-slate">Session Ended</span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-2">
            {session.quizTitle} — Results
          </h1>
          <p className="text-slate-600">
            {session.quizSubject} · Code:{" "}
            <span className="font-mono font-bold">{session.code}</span>
          </p>
        </div>
        <Link to="/teacher" className="btn-secondary self-start">
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <SummaryCard
          label="Participants"
          value={stats.totalParticipants}
          icon="👥"
        />
        <SummaryCard label="Questions" value={stats.totalQuestions} icon="📝" />
        <SummaryCard
          label="Points Each"
          value={stats.pointsPerCorrect}
          icon="➕"
        />
        <SummaryCard
          label="Class Accuracy"
          value={`${stats.classAccuracy}%`}
          icon="🎯"
        />
        <SummaryCard
          label="Avg Score"
          value={stats.avgScore.toFixed(1)}
          icon="⭐"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Leaderboard */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            🏆 Student Results
          </h3>
          {stats.ranked.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              No participants.
            </p>
          ) : (
            <div className="space-y-2">
              {stats.ranked.map((p, i) => {
                const pct = calculatePercent(p.score, stats.totalPoints);
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50"
                  >
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
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
                    <span className="flex-1 font-semibold text-slate-800 truncate">
                      {p.name}
                    </span>
                    <div className="w-32 hidden sm:block">
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-brand-700"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="font-bold text-brand-700 w-20 text-right text-sm">
                      {p.score}/{stats.totalPoints} · {calculatePercent(p.score, stats.totalPoints)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Hardest questions */}
        <div className="card p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            🔥 Most Difficult
          </h3>
          {stats.hardest.length === 0 ? (
            <p className="text-sm text-slate-500">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.hardest.map((s, i) => (
                <div
                  key={s.question.id}
                  className="p-3 rounded-xl bg-rose-50 border border-rose-100"
                >
                  <p className="text-xs font-bold text-rose-700 mb-1">
                    {s.accuracy}% correct
                  </p>
                  <p className="text-sm text-slate-800 line-clamp-2">
                    {s.question.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {session.teamMode && (
        <div className="card p-6 mt-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            🤝 Group Standings
          </h3>
          {stats.teamStats.length === 0 ? (
            <p className="text-sm text-slate-500">No group data yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {stats.teamStats.map((team, index) => (
                <div
                  key={team.name}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Group #{index + 1}
                      </p>
                      <h4 className="font-bold text-slate-900">{team.name}</h4>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-extrabold text-brand-700">
                        {team.points}
                      </div>
                      <div className="text-xs text-slate-500">points</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                    <span>{team.members} member{team.members !== 1 && "s"}</span>
                    <span>{team.correctAnswers} correct answers</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Per-question breakdown */}
      <div className="card p-6 mt-6">
        <h3 className="font-bold text-slate-900 mb-4">
          Per-Question Breakdown
        </h3>
        <div className="space-y-5">
          {stats.questionStats.map((s, idx) => {
            const diff = difficultyLabel(s.accuracy);
            return (
              <div
                key={s.question.id}
                className="pb-5 border-b border-slate-100 last:border-0 last:pb-0"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge-slate text-xs">Q{idx + 1}</span>
                      <span
                        className={`badge text-xs ${
                          diff.color === "emerald"
                            ? "bg-emerald-100 text-emerald-700"
                            : diff.color === "amber"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {diff.label}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {s.question.text}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold text-brand-700">
                      {s.accuracy}%
                    </div>
                    <div className="text-xs text-slate-500">
                      {s.correct}/{s.answered} correct
                    </div>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {s.question.choices.map((c, ci) => {
                    const pct = s.answered
                      ? Math.round((s.choiceCounts[ci] / s.answered) * 100)
                      : 0;
                    const isCorrect = ci === s.question.correctIndex;
                    return (
                      <div
                        key={ci}
                        className={`relative px-3 py-2 rounded-lg border overflow-hidden text-sm ${isCorrect ? "border-success-500 bg-emerald-50" : "border-slate-200 bg-white"}`}
                      >
                        <div
                          className="absolute inset-y-0 left-0 bg-brand-100/60"
                          style={{ width: `${pct}%` }}
                        ></div>
                        <div className="relative flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 ${isCorrect ? "bg-success-500 text-white" : "bg-slate-100 text-slate-600"}`}
                          >
                            {String.fromCharCode(65 + ci)}
                          </span>
                          <span className="flex-1 truncate">{c}</span>
                          <span className="font-bold text-slate-700 text-xs">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon }) {
  return (
    <div className="card p-5">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-extrabold text-slate-900">{value}</div>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}
