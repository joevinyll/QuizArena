import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "../../context/QuizContext";

export default function JoinSession() {
  const navigate = useNavigate();
  const { getSession, loadSession, joinSession } = useQuiz();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [showTeam, setShowTeam] = useState(false);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = code, 2 = name

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const upperCode = code.trim().toUpperCase();
    if (upperCode.length < 4) {
      setError("Please enter a valid session code.");
      return;
    }
    let session = null;
    try {
      setLoading(true);
      session = getSession(upperCode) || (await loadSession(upperCode));
    } catch (err) {
      setError(err.message || "Unable to check this session code.");
      return;
    } finally {
      setLoading(false);
    }

    if (!session) {
      setError("Session not found. Check your code and try again.");
      return;
    }
    if (session.status === "finished") {
      setError("This session has already ended.");
      return;
    }
    setCode(upperCode);
    setShowTeam(session.teamMode);
    setAvailableTeams(session.teams || []);
    setTeam("");
    setStep(2);
  };

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (showTeam && !team.trim()) {
      setError("Please choose your group.");
      return;
    }

    let result = null;
    try {
      setLoading(true);
      result = await joinSession(code, name.trim(), team.trim() || null);
    } catch (err) {
      setError(err.message || "Unable to join this session.");
      return;
    } finally {
      setLoading(false);
    }

    if (!result.ok) {
      setError(result.error);
      return;
    }

    // Persist identity
    sessionStorage.setItem(
      `qa_participant_${code}`,
      JSON.stringify({
        id: result.participant.id,
        name: result.participant.name,
        team: result.participant.team,
      }),
    );

    const session = result.session;
    if (session.status === "lobby") {
      navigate(`/student/lobby/${code}`);
    } else {
      navigate(`/student/play/${code}`);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 animate-fade-in">
          <h1 className="text-3xl font-extrabold text-slate-900">
            Join a Quiz
          </h1>
          <p className="text-slate-600 mt-1">
            Enter the session code from your teacher.
          </p>
        </div>

        <div className="card p-6 sm:p-8 animate-slide-up">
          {/* Step indicator */}
          <div className="flex items-center gap-2 justify-center mb-6">
            <div
              className={`h-2 w-10 rounded-full transition ${step >= 1 ? "bg-brand-600" : "bg-slate-200"}`}
            ></div>
            <div
              className={`h-2 w-10 rounded-full transition ${step >= 2 ? "bg-brand-600" : "bg-slate-200"}`}
            ></div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium text-center">
              ⚠ {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 text-center">
                  Session Code
                </label>
                <input
                  autoFocus
                  value={code}
                  onChange={(e) =>
                    setCode(
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                        .slice(0, 6),
                    )
                  }
                  placeholder="ABC123"
                  maxLength={6}
                  className="input text-center text-3xl font-mono tracking-[0.5em] font-bold !py-5"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full !py-3 text-base"
              >
                {loading ? "Checking..." : "Continue"}
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
            </form>
          ) : (
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-brand-50 border border-brand-100 text-center">
                <span className="text-xs text-brand-600 font-semibold uppercase tracking-wider">
                  Joining Session
                </span>
                <div className="font-mono font-bold text-xl text-brand-700 tracking-widest">
                  {code}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Your Name
                </label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 30))}
                  placeholder="e.g., Maria Santos"
                  className="input"
                  maxLength={30}
                />
              </div>

              {showTeam && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Group 🤝
                  </label>
                  <select
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    className="input"
                  >
                    <option value="">Select your group</option>
                    {availableTeams.map((teamName) => (
                      <option key={teamName} value={teamName}>
                        {teamName}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Your teacher assigned the available groups for this session.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError("");
                  }}
                  className="btn-ghost flex-1"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-[2]"
                >
                  {loading ? "Joining..." : "Join Session"}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-5">
          No account needed — just a code from your teacher.
        </p>
      </div>
    </div>
  );
}
