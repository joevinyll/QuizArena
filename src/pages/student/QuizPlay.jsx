import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuiz } from "../../context/QuizContext";
import QuestionCard from "../../components/QuestionCard";
import ProgressBar from "../../components/ProgressBar";

export default function QuizPlay() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { getSession, getQuiz, sessionsLoading, submitAnswer } = useQuiz();

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

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const currentQ = quiz?.questions[session?.currentQuestionIndex ?? 0] || null;

  const calculateSyncedTimeLeft = () => {
    if (
      !session?.timerEnabled ||
      session.status !== "running" ||
      !session.questionStartedAt
    ) {
      return null;
    }

    const elapsedSeconds = Math.floor(
      (Date.now() - session.questionStartedAt) / 1000,
    );
    return Math.max(0, session.timerSeconds - elapsedSeconds);
  };

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
      // Fresh question — reset state and sync timer from shared session time.
      setSelectedIndex(null);
      setRevealed(false);
      setLastResult(null);
      setTimeLeft(calculateSyncedTimeLeft());
    }
  }, [
    session?.currentQuestionIndex,
    session?.status,
    session?.questionStartedAt,
    session?.timerEnabled,
    session?.timerSeconds,
    currentQ?.id,
    me?.id,
    // intentionally not depending on participants array (would reset on every poll)
  ]);

  // Timer countdown synced to the teacher's shared questionStartedAt timestamp.
  useEffect(() => {
    if (
      !session?.timerEnabled ||
      !session.questionStartedAt ||
      revealed ||
      session.status !== "running"
    ) {
      setTimeLeft(null);
      return;
    }

    const syncTimer = async () => {
      const nextTimeLeft = calculateSyncedTimeLeft();
      setTimeLeft(nextTimeLeft);

      if (nextTimeLeft <= 0) {
        if (selectedIndex === null && currentQ && me) {
          const result = await submitAnswer(code, me.id, currentQ.id, -1);
          setLastResult(result);
        }
        setRevealed(true);
      }
    };

    syncTimer();
    const interval = setInterval(syncTimer, 250);
    return () => clearInterval(interval);
  }, [
    session?.timerEnabled,
    session?.questionStartedAt,
    session?.timerSeconds,
    session?.status,
    revealed,
    selectedIndex,
    currentQ?.id,
    me?.id,
    code,
    submitAnswer,
  ]);

  // Redirect when finished
  useEffect(() => {
    if (!session) return;
    if (session.status === "finished") navigate(`/student/results/${code}`);
    if (session.status === "lobby") navigate(`/student/lobby/${code}`);
  }, [session, code, navigate]);

  if (sessionsLoading) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4">
        <p className="text-slate-600">Loading session...</p>
      </div>
    );
  }

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

  const handleAnswer = async (idx) => {
    if (revealed || !currentQ) return;
    setSelectedIndex(idx);
    const result = await submitAnswer(code, me.id, currentQ.id, idx);
    setLastResult(result);
    setRevealed(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4 gap-2 sm:gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-wider">
            You are
          </div>
          <div className="font-bold text-slate-900 truncate text-sm sm:text-base">
            {me.name}
            {me.team && (
              <span className="text-brand-600 font-semibold text-xs sm:text-sm">
                {" "}
                · {me.team}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {timeLeft !== null && (
            <div
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold text-xs sm:text-sm ${timeLeft <= 5 ? "bg-rose-100 text-rose-700 animate-pulse" : "bg-brand-100 text-brand-700"}`}
            >
              ⏱️ {timeLeft}s
            </div>
          )}
          <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-emerald-100 text-emerald-700 font-bold text-xs sm:text-sm whitespace-nowrap">
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
