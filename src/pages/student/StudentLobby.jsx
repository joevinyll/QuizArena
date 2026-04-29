import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuiz } from "../../context/QuizContext";

export default function StudentLobby() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { getSession } = useQuiz();
  const session = getSession(code);

  // Poll for session status (since we're using local state, context updates will re-render)
  useEffect(() => {
    if (!session) return;
    if (session.status === "running") navigate(`/student/play/${code}`);
    if (session.status === "finished") navigate(`/student/results/${code}`);
  }, [session, code, navigate]);

  const me = (() => {
    try {
      return (
        JSON.parse(sessionStorage.getItem(`qa_participant_${code}`)) || null
      );
    } catch {
      return null;
    }
  })();

  if (!session) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4">
        <div className="text-5xl mb-3">🔍</div>
        <h2 className="text-2xl font-bold mb-2">Session not found</h2>
        <Link to="/join" className="btn-primary">
          Try a different code
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="card p-8 text-center animate-slide-up">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-soft mb-4 animate-pulse">
          <span className="text-3xl">⏳</span>
        </div>
        <span className="badge-brand">You're in!</span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
          Waiting for the teacher to start…
        </h1>
        <p className="text-slate-600 mt-2">
          {session.quizTitle} · {session.quizSubject}
        </p>

        <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">
            Joined as
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">
            {me?.name || "Student"}
          </div>
          {me?.team && (
            <div className="text-sm text-brand-700 font-semibold mt-0.5">
              🤝 {me.team}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-600">
          <div className="flex -space-x-2">
            {session.participants.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="w-8 h-8 rounded-full bg-brand-100 border-2 border-white flex items-center justify-center font-bold text-xs text-brand-700"
              >
                {p.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          <span className="font-semibold">
            {session.participants.length} student
            {session.participants.length !== 1 && "s"} in lobby
          </span>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 justify-center">
          {session.participants.map((p) => (
            <span key={p.id} className="badge-slate">
              {p.name}
            </span>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 mt-4">
        Keep this page open. The quiz will start automatically.
      </p>
    </div>
  );
}
