import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuiz } from "../../context/QuizContext";
import { calculatePercent } from "../../utils/helpers";

export default function StudentResults() {
  const { code } = useParams();
  const { getSession, getQuiz } = useQuiz();
  const session = getSession(code);
  const quiz = session ? getQuiz(session.quizId) || session.quizSnapshot : null;

  const me = useMemo(() => {
    try {
      return (
        JSON.parse(sessionStorage.getItem(`qa_participant_${code}`)) || null
      );
    } catch {
      return null;
    }
  }, [code]);

  if (!session || !quiz) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4">
        <h2 className="text-2xl font-bold mb-2">Session not found</h2>
        <Link to="/" className="btn-primary">
          Home
        </Link>
      </div>
    );
  }

  const myParticipant = me
    ? session.participants.find((p) => p.id === me.id)
    : null;
  const myScore = myParticipant?.score || 0;
  const total = session.totalQuestions;
  const percent = calculatePercent(myScore, total);

  // Ranking
  const ranked = [...session.participants].sort((a, b) => b.score - a.score);
  const myRank = me ? ranked.findIndex((p) => p.id === me.id) + 1 : 0;

  const feedback =
    percent >= 80
      ? {
          emoji: "🌟",
          title: "Excellent work!",
          text: "You have a strong grasp of this topic.",
        }
      : percent >= 60
        ? {
            emoji: "👏",
            title: "Good job!",
            text: "You’re getting there — review the missed ones below.",
          }
        : percent >= 40
          ? {
              emoji: "💪",
              title: "Keep going!",
              text: "Review the explanations below to strengthen your understanding.",
            }
          : {
              emoji: "📚",
              title: "Time to review",
              text: "Take a moment to read the explanations — you got this next time.",
            };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Score summary */}
      <div className="card p-8 text-center mb-6 animate-slide-up">
        <div className="text-5xl mb-2">{feedback.emoji}</div>
        <h1 className="text-3xl font-extrabold text-slate-900">
          {feedback.title}
        </h1>
        <p className="text-slate-600 mt-1">{feedback.text}</p>

        <div className="mt-6 grid grid-cols-3 gap-3 max-w-md mx-auto">
          <Stat value={`${myScore}/${total}`} label="Score" />
          <Stat value={`${percent}%`} label="Accuracy" />
          <Stat value={myRank ? `#${myRank}` : "—"} label="Rank" />
        </div>

        {me && (
          <div className="mt-5 text-sm text-slate-500">
            Played as{" "}
            <span className="font-bold text-slate-800">{me.name}</span>
            {me.team && (
              <span className="ml-1 text-brand-600">· 🤝 {me.team}</span>
            )}
          </div>
        )}
      </div>

      {/* Review section */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xl">💬</span>
          <h3 className="font-bold text-slate-900">Review & Feedback</h3>
        </div>
        <p className="text-sm text-slate-600 mb-5">
          Review each question below. Understanding your mistakes is part of
          learning.
        </p>

        <div className="space-y-5">
          {quiz.questions.map((q, idx) => {
            const myAns = myParticipant?.answers.find(
              (a) => a.questionId === q.id,
            );
            const myChoice = myAns ? myAns.choiceIndex : null;
            const wasCorrect = myAns?.correct;

            return (
              <div
                key={q.id}
                className="pb-5 border-b border-slate-100 last:border-0 last:pb-0"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      myAns == null
                        ? "bg-slate-200 text-slate-600"
                        : wasCorrect
                          ? "bg-success-500 text-white"
                          : "bg-danger-500 text-white"
                    }`}
                  >
                    {myAns == null ? "–" : wasCorrect ? "✓" : "✗"}
                  </span>
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                      Question {idx + 1}
                    </div>
                    <p className="font-semibold text-slate-900 mt-0.5">
                      {q.text}
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-2 ml-11">
                  {q.choices.map((c, ci) => {
                    const isCorrect = ci === q.correctIndex;
                    const isMine = ci === myChoice;
                    let style = "border-slate-200 bg-white";
                    if (isCorrect) style = "border-success-500 bg-emerald-50";
                    else if (isMine && !isCorrect)
                      style = "border-danger-500 bg-rose-50";
                    return (
                      <div
                        key={ci}
                        className={`px-3 py-2 rounded-lg border-2 text-sm flex items-center gap-2 ${style}`}
                      >
                        <span
                          className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            isCorrect
                              ? "bg-success-500 text-white"
                              : isMine
                                ? "bg-danger-500 text-white"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {String.fromCharCode(65 + ci)}
                        </span>
                        <span className="flex-1">{c}</span>
                        {isCorrect && (
                          <span className="text-xs font-bold text-success-600">
                            Correct
                          </span>
                        )}
                        {isMine && !isCorrect && (
                          <span className="text-xs font-bold text-danger-600">
                            Your pick
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div className="ml-11 mt-3 p-3 rounded-lg bg-brand-50 border border-brand-100">
                    <p className="text-xs font-bold text-brand-700 mb-0.5">
                      Why?
                    </p>
                    <p className="text-sm text-slate-700">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card p-6 mb-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          🏆 Class Standings
        </h3>
        <div className="space-y-2">
          {ranked.map((p, i) => {
            const isMe = me && p.id === me.id;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3 p-2.5 rounded-lg ${isMe ? "bg-brand-50 border-2 border-brand-200" : "bg-slate-50"}`}
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
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
                <span className="flex-1 font-semibold text-sm text-slate-800 truncate">
                  {p.name}{" "}
                  {isMe && (
                    <span className="text-brand-600 text-xs">(You)</span>
                  )}
                </span>
                <span className="font-bold text-brand-700 text-sm">
                  {p.score}/{total}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/join" className="btn-secondary flex-1">
          Join Another Quiz
        </Link>
        <Link to="/" className="btn-primary flex-1">
          Back to Home
        </Link>
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
      <div className="text-2xl font-extrabold text-slate-900">{value}</div>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}
