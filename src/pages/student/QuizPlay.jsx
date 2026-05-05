import { useEffect, useState, useMemo, useRef } from "react";
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
  const [answered, setAnswered] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [answerMessage, setAnswerMessage] = useState("");
  const timeoutSubmissionRef = useRef(false);

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
      const timedOut =
        existingAnswer.timedOut || existingAnswer.choiceIndex == null || existingAnswer.choiceIndex < 0;
      setSelectedIndex(existingAnswer.choiceIndex >= 0 ? existingAnswer.choiceIndex : null);
      setAnswered(true);
      setShowCorrectAnswer(timedOut);
      setLastResult({
        correct: existingAnswer.correct,
        correctIndex: currentQ.correctIndex,
        explanation: currentQ.explanation,
      });
      setAnswerMessage(
        timedOut
          ? "Time is up. The correct answer is shown so you can review it. Try to answer before the timer ends next time."
          : session.timerEnabled
            ? "Your answer is locked in. Results will appear when the timer ends."
            : "Your answer is locked in. Stay ready for the next question.",
      );
      setTimeLeft(null);
    } else {
      timeoutSubmissionRef.current = false;
      setSelectedIndex(null);
      setAnswered(false);
      setShowCorrectAnswer(false);
      setLastResult(null);
      setAnswerMessage("");
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

  useEffect(() => {
    if (
      !session?.timerEnabled ||
      !session.questionStartedAt ||
      session.status !== "running"
    ) {
      if (!session?.timerEnabled || session.status !== "running") {
        setTimeLeft(null);
      }
      return;
    }

    const syncTimer = async () => {
      const nextTimeLeft = calculateSyncedTimeLeft();
      setTimeLeft(nextTimeLeft);

      if (nextTimeLeft > 0) {
        return;
      }

      if (selectedIndex === null && currentQ && me && !timeoutSubmissionRef.current) {
        timeoutSubmissionRef.current = true;
        try {
          const result = await submitAnswer(code, me.id, currentQ.id, -1);
          setLastResult(result);
          setAnswered(true);
          setShowCorrectAnswer(true);
          setAnswerMessage(
            "Time is up. The correct answer is shown so you can review it. Try to answer before the timer ends next time.",
          );
        } finally {
          setTimeLeft(0);
        }
        return;
      }

      if (selectedIndex !== null) {
        setShowCorrectAnswer(true);
        setAnswerMessage(
          lastResult?.correct
            ? "Time is up. Your answer was correct."
            : "Time is up. Your answer was incorrect. Review the correct answer below.",
        );
        setTimeLeft(0);
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
    selectedIndex,
    currentQ?.id,
    me?.id,
    code,
    lastResult?.correct,
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
  const quizAuthor =
    session.quizSnapshot?.teacherName ||
    session.quizSnapshot?.teacherEmail ||
    "Unknown teacher";

  const handleAnswer = async (idx) => {
    if (answered || !currentQ) return;
    setSelectedIndex(idx);
    setAnswered(true);
    setShowCorrectAnswer(false);
    setAnswerMessage(
      session?.timerEnabled
        ? "Answer submitted. Results will appear when the timer ends."
        : "Answer submitted. Stay focused for the next question.",
    );
    const result = await submitAnswer(code, me.id, currentQ.id, idx);
    setLastResult(result);
    if (!session?.timerEnabled) {
      setShowCorrectAnswer(true);
    }
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
          <div className="text-xs text-slate-500 mt-1">
            Quiz by {quizAuthor}
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
          answered={answered}
          showCorrectAnswer={showCorrectAnswer}
          correctIndex={showCorrectAnswer ? (lastResult?.correctIndex ?? null) : null}
          disabled={answered}
          onAnswer={handleAnswer}
        />
      ) : (
        <div className="card p-10 text-center">
          <p className="text-slate-600">Waiting for the next question…</p>
        </div>
      )}

      {answered && (
        <div className="mt-6 card p-5 animate-fade-in text-center">
          <p className="text-sm text-slate-600">
            {answerMessage ||
              "Your response has been recorded. Wait for the teacher to continue."}
          </p>
        </div>
      )}
    </div>
  );
}
