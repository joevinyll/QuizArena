import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { initialQuizzes, initialSessions } from "../data/mockData";
import { generateSessionCode, generateId } from "../utils/helpers";

const QuizContext = createContext(null);

const QUIZZES_KEY = "qa_quizzes";
const SESSIONS_KEY = "qa_sessions";

function readQuizzes() {
  try {
    const stored = localStorage.getItem(QUIZZES_KEY);
    return stored ? JSON.parse(stored) : initialQuizzes;
  } catch {
    return initialQuizzes;
  }
}

function readSessions() {
  try {
    const stored = localStorage.getItem(SESSIONS_KEY);
    return stored ? JSON.parse(stored) : initialSessions;
  } catch {
    return initialSessions;
  }
}

// Helper: write sessions to localStorage immediately (used for live updates)
function writeSessions(sessions) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {}
}

export function QuizProvider({ children }) {
  const [quizzes, setQuizzes] = useState(readQuizzes);
  // Sessions stored in localStorage (shared across all tabs) — mock real-time layer
  const [sessions, setSessions] = useState(readSessions);

  const lastQuizzesJson = useRef(JSON.stringify(quizzes));
  const lastSessionsJson = useRef(JSON.stringify(sessions));

  // Persist quizzes to localStorage
  useEffect(() => {
    const json = JSON.stringify(quizzes);
    if (json !== lastQuizzesJson.current) {
      try {
        localStorage.setItem(QUIZZES_KEY, json);
      } catch {}
      lastQuizzesJson.current = json;
    }
  }, [quizzes]);

  // Persist sessions to localStorage
  useEffect(() => {
    const json = JSON.stringify(sessions);
    if (json !== lastSessionsJson.current) {
      try {
        localStorage.setItem(SESSIONS_KEY, json);
      } catch {}
      lastSessionsJson.current = json;
    }
  }, [sessions]);

  // Cross-tab sync: listen for storage events from OTHER tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === SESSIONS_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (e.newValue !== lastSessionsJson.current) {
            lastSessionsJson.current = e.newValue;
            setSessions(parsed);
          }
        } catch {}
      }
      if (e.key === QUIZZES_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (e.newValue !== lastQuizzesJson.current) {
            lastQuizzesJson.current = e.newValue;
            setQuizzes(parsed);
          }
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Polling fallback (every 600ms) — ensures same-tab components stay in sync
  // even when storage events don't fire (e.g., same-origin same-tab writes).
  // This is essential so teacher sees student joins in real-time.
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const raw = localStorage.getItem(SESSIONS_KEY);
        if (raw && raw !== lastSessionsJson.current) {
          lastSessionsJson.current = raw;
          setSessions(JSON.parse(raw));
        }
      } catch {}
    }, 600);
    return () => clearInterval(interval);
  }, []);

  // ===== Quiz CRUD =====
  const addQuiz = useCallback((quiz) => {
    const newQuiz = {
      ...quiz,
      id: generateId("quiz"),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setQuizzes((prev) => [newQuiz, ...prev]);
    return newQuiz;
  }, []);

  const deleteQuiz = useCallback((quizId) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
  }, []);

  const getQuiz = useCallback(
    (quizId) => {
      return quizzes.find((q) => q.id === quizId) || null;
    },
    [quizzes],
  );

  // ===== Session management =====
  // NOTE: we do synchronous reads from localStorage for "write" operations,
  // so updates propagate to other tabs instantly (not waiting for React state flush).

  const createSession = useCallback(
    (quizId, options = {}) => {
      const quiz = quizzes.find((q) => q.id === quizId);
      if (!quiz) return null;

      const currentSessions = readSessions();
      let code;
      do {
        code = generateSessionCode();
      } while (currentSessions[code]);

      const newSession = {
        code,
        quizId,
        quizTitle: quiz.title,
        quizSubject: quiz.subject,
        totalQuestions: quiz.questions.length,
        status: "lobby",
        teamMode: !!options.teamMode,
        timerEnabled: !!options.timerEnabled,
        timerSeconds: options.timerSeconds || 20,
        currentQuestionIndex: 0,
        participants: [],
        teams: [],
        startedAt: null,
        finishedAt: null,
        createdAt: new Date().toISOString(),
      };

      const updated = { ...currentSessions, [code]: newSession };
      writeSessions(updated);
      lastSessionsJson.current = JSON.stringify(updated);
      setSessions(updated);
      return newSession;
    },
    [quizzes],
  );

  const getSession = useCallback(
    (code) => {
      if (!code) return null;
      return sessions[code.toUpperCase()] || null;
    },
    [sessions],
  );

  const updateSession = useCallback((code, updater) => {
    const upper = code.toUpperCase();
    const current = readSessions();
    const existing = current[upper];
    if (!existing) return;
    const updatedSession =
      typeof updater === "function"
        ? updater(existing)
        : { ...existing, ...updater };
    const updated = { ...current, [upper]: updatedSession };
    writeSessions(updated);
    lastSessionsJson.current = JSON.stringify(updated);
    setSessions(updated);
  }, []);

  const joinSession = useCallback((code, name, team = null) => {
    const upper = code.toUpperCase();
    const current = readSessions();
    const session = current[upper];

    if (!session)
      return {
        ok: false,
        error: "Session not found. Check the code and try again.",
      };
    if (session.status === "finished")
      return { ok: false, error: "This session has already ended." };

    const exists = session.participants.find(
      (p) => p.name.toLowerCase() === name.toLowerCase(),
    );
    if (exists)
      return {
        ok: false,
        error: "That name is already taken in this session.",
      };

    const participant = {
      id: generateId("p"),
      name,
      team: team || null,
      score: 0,
      answers: [],
      joinedAt: new Date().toISOString(),
    };

    const updatedSession = {
      ...session,
      participants: [...session.participants, participant],
    };
    const updated = { ...current, [upper]: updatedSession };

    writeSessions(updated);
    lastSessionsJson.current = JSON.stringify(updated);
    setSessions(updated);

    return {
      ok: true,
      participant,
      session: updatedSession,
    };
  }, []);

  const submitAnswer = useCallback(
    (code, participantId, questionId, choiceIndex) => {
      const upper = code.toUpperCase();
      const current = readSessions();
      const session = current[upper];
      if (!session) return null;

      const quiz = quizzes.find((q) => q.id === session.quizId);
      if (!quiz) return null;
      const question = quiz.questions.find((q) => q.id === questionId);
      if (!question) return null;

      const correct = choiceIndex === question.correctIndex;

      const updatedParticipants = session.participants.map((p) => {
        if (p.id !== participantId) return p;
        if (p.answers.find((a) => a.questionId === questionId)) return p;
        return {
          ...p,
          score: p.score + (correct ? 1 : 0),
          answers: [
            ...p.answers,
            { questionId, choiceIndex, correct, timestamp: Date.now() },
          ],
        };
      });

      const updatedSession = {
        ...session,
        participants: updatedParticipants,
      };
      const updated = { ...current, [upper]: updatedSession };

      writeSessions(updated);
      lastSessionsJson.current = JSON.stringify(updated);
      setSessions(updated);

      return {
        correct,
        correctIndex: question.correctIndex,
        explanation: question.explanation,
      };
    },
    [quizzes],
  );

  const advanceQuestion = useCallback((code) => {
    const upper = code.toUpperCase();
    const current = readSessions();
    const s = current[upper];
    if (!s) return;
    const next = s.currentQuestionIndex + 1;
    let updatedSession;
    if (next >= s.totalQuestions) {
      updatedSession = {
        ...s,
        status: "finished",
        finishedAt: new Date().toISOString(),
      };
    } else {
      updatedSession = { ...s, currentQuestionIndex: next };
    }
    const updated = { ...current, [upper]: updatedSession };
    writeSessions(updated);
    lastSessionsJson.current = JSON.stringify(updated);
    setSessions(updated);
  }, []);

  const startSession = useCallback((code) => {
    const upper = code.toUpperCase();
    const current = readSessions();
    const s = current[upper];
    if (!s) return;
    const updatedSession = {
      ...s,
      status: "running",
      startedAt: new Date().toISOString(),
    };
    const updated = { ...current, [upper]: updatedSession };
    writeSessions(updated);
    lastSessionsJson.current = JSON.stringify(updated);
    setSessions(updated);
  }, []);

  const endSession = useCallback((code) => {
    const upper = code.toUpperCase();
    const current = readSessions();
    const s = current[upper];
    if (!s) return;
    const updatedSession = {
      ...s,
      status: "finished",
      finishedAt: new Date().toISOString(),
    };
    const updated = { ...current, [upper]: updatedSession };
    writeSessions(updated);
    lastSessionsJson.current = JSON.stringify(updated);
    setSessions(updated);
  }, []);

  const value = {
    quizzes,
    sessions,
    addQuiz,
    deleteQuiz,
    getQuiz,
    createSession,
    getSession,
    updateSession,
    joinSession,
    submitAnswer,
    advanceQuestion,
    startSession,
    endSession,
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz must be used within QuizProvider");
  return ctx;
}
