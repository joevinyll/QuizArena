import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuiz } from "../../context/QuizContext";
import QuestionCard from "../../components/QuestionCard";
import ProgressBar from "../../components/ProgressBar";

export default function QuizPlay() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { getSession, getQuiz, submitAnswer } = useQuiz();

  const session = getSession(code);
  const quiz = session ? getQuiz(session.quizId) : null;

  const me = useMemo(() => {
    try {
      return (
        JSON.parse(sessionStorage.getItem(`qa_participant_${code}`)) || null
      );
    } catch {
      return null;
    }
  }, [code]);

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const currentQ = quiz?.questions[session?.currentQuestionIndex ?? 0] || null;

  // Restore answered state on mount/question-change (handles page refresh)
  // If the participant already answered the current question, show the revealed state.
  useEffect(() => {
    if (!session || !currentQ || !me) return;
    const myParticipant = session.participants.find((p) => p.id === me.id);
    const existingAnswer = myParticipant?.answers.find(
      (a) => a.questionId === currentQ.id,
    );

    if (existingAnswer) {
      // Student already answered this question — restore revealed state
      setSelectedIndex(existingAnswer.choiceIndex);
      setRevealed(true);
      setLastResult({
        correct: existingAnswer.correct,
        correctIndex: currentQ.correctIndex,
        explanation: currentQ.explanation,
      });
      setTimeLeft(null); // stop timer since already answered
    } else {
      // Fresh question — reset state and (re)start timer if enabled
      setSelectedIndex(null);
      setRevealed(false);
      setLastResult(null);
      if (session.timerEnabled && session.status === "running") {
        setTimeLeft(session.timerSeconds);
      } else {
        setTimeLeft(null);
      }
    }
  }, [
    session?.currentQuestionIndex,
    session?.status,
    currentQ?.id,
    me?.id,
    // intentionally not depending on participants array (would reset on every poll)
  ]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || revealed || session?.status !== "running") return;
    if (timeLeft <= 0) {
      // Time out — auto-submit with no answer (mark as incorrect)
      if (selectedIndex === null && currentQ && me) {
        // submit -1 (no choice)
        const result = submitAnswer(code, me.id, currentQ.id, -1);
        setLastResult(result);
      }
      setRevealed(true);
      return;
    }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [
    timeLeft,
    revealed,
    session?.status,
    selectedIndex,
    currentQ,
    me,
    code,
    submitAnswer,
  ]);

  // Redirect when finished
  useEffect(() => {
    if (!session) return;
    if (session.status === "finished") navigate(`/student/results/${code}`);
    if (session.status === "lobby") navigate(`/student/lobby/${code}`);
  }, [session, code, navigate]);

  if (!session || !quiz) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4">
        <div className="text-5xl mb-3">🔍</div>
        <h2 className="text-2xl font-bold mb-2">Session not found</h2>
        <Link to="/join" className="btn-primary">
          Back to Join
        </Link>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4">
        <h2 className="text-2xl font-bold mb-2">
          You haven't joined this session
        </h2>
        <Link to="/join" className="btn-primary">
          Join Now
        </Link>
      </div>
    );
  }

  const myParticipant = session.participants.find((p) => p.id === me.id);
  const myScore = myParticipant?.score || 0;

  const handleAnswer = (idx) => {
    if (revealed || !currentQ) return;
    setSelectedIndex(idx);
    const result = submitAnswer(code, me.id, currentQ.id, idx);
    setLastResult(result);
    setRevealed(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="min-w-0">
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            You are
          </div>
          <div className="font-bold text-slate-900 truncate">
            {me.name}
            {me.team && (
              <span className="text-brand-600 font-semibold text-sm">
                {" "}
                · {me.team}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {timeLeft !== null && (
            <div
              className={`px-3 py-1.5 rounded-xl font-bold text-sm ${timeLeft <= 5 ? "bg-rose-100 text-rose-700 animate-pulse" : "bg-brand-100 text-brand-700"}`}
            >
              ⏱️ {timeLeft}s
            </div>
          )}
          <div className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-700 font-bold text-sm">
            ⭐ {myScore} pts
          </div>
        </div>
      </div>

      <ProgressBar
        value={session.currentQuestionIndex + 1}
        max={session.totalQuestions}
        className="mb-6"
      />

      {currentQ ? (
        <QuestionCard
          question={currentQ}
          questionNumber={session.currentQuestionIndex + 1}
          totalQuestions={session.totalQuestions}
          selectedIndex={selectedIndex}
          revealed={revealed}
          correctIndex={lastResult?.correctIndex ?? null}
          disabled={revealed}
          onAnswer={handleAnswer}
        />
      ) : (
        <div className="card p-10 text-center">
          <p className="text-slate-600">Waiting for the next question…</p>
        </div>
      )}

      {revealed && (
        <div className="mt-6 card p-5 animate-fade-in text-center">
          <p className="text-sm text-slate-600">
            {lastResult?.correct ? (
              <>
                Great job! ✨ Wait for the teacher to move to the next question.
              </>
            ) : (
              <>
                Don't worry — you can learn from this. Wait for the teacher to
                continue.
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
