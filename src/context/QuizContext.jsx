import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { useFirebase } from "./FirebaseContext.jsx";
import { initialQuizzes, initialSessions } from "../data/mockData";
import { generateSessionCode, generateId } from "../utils/helpers";

const QuizContext = createContext(null);

const SESSIONS_KEY = "qa_sessions";

function readSessions() {
  try {
    const stored = localStorage.getItem(SESSIONS_KEY);
    if (!stored) return initialSessions;
    const parsed = JSON.parse(stored);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : initialSessions;
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
  const { user } = useFirebase();
  const [quizzes, setQuizzes] = useState(initialQuizzes);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [quizzesError, setQuizzesError] = useState(null);
  // Sessions stored in localStorage (shared across all tabs) — mock real-time layer
  const [sessions, setSessions] = useState(readSessions);

  const lastSessionsJson = useRef(JSON.stringify(sessions));

  // Load teacher-owned quizzes from Firestore. Logged-out users see samples.
  useEffect(() => {
    if (!user) {
      setQuizzes(initialQuizzes);
      setQuizzesLoading(false);
      setQuizzesError(null);
      return;
    }

    setQuizzesLoading(true);
    setQuizzesError(null);

    const teacherQuizzesQuery = query(
      collection(db, "quizzes"),
      where("teacherId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(
      teacherQuizzesQuery,
      (snapshot) => {
        const teacherQuizzes = snapshot.docs
          .map((document) => ({
            id: document.id,
            ...document.data(),
          }))
          .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));

        setQuizzes(teacherQuizzes);
        setQuizzesLoading(false);
      },
      (err) => {
        setQuizzesError(err.message || "Unable to load quizzes.");
        setQuizzes([]);
        setQuizzesLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

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
  const addQuiz = useCallback(async (quiz, teacher) => {
    const teacherId = typeof teacher === "string" ? teacher : teacher?.uid;
    const teacherEmail = typeof teacher === "object" ? teacher?.email : null;

    if (!teacherId) {
      throw new Error("Please sign in as a teacher before saving a quiz.");
    }

    const createdAt = new Date();
    const quizPayload = {
      ...quiz,
      title: quiz.title.trim(),
      subject: quiz.subject.trim(),
      description: quiz.description.trim(),
      questions: quiz.questions.map((question) => ({
        ...question,
        text: question.text.trim(),
        choices: question.choices.map((choice) => choice.trim()),
        explanation: question.explanation.trim(),
      })),
      createdAt: createdAt.toISOString().slice(0, 10),
      createdAtMs: createdAt.getTime(),
      teacherId,
      teacherEmail: teacherEmail || null,
      updatedAt: serverTimestamp(),
    };

    const documentRef = await addDoc(collection(db, "quizzes"), quizPayload);
    const newQuiz = {
      ...quizPayload,
      id: documentRef.id,
    };

    setQuizzes((prev) => {
      const withoutDuplicate = prev.filter((item) => item.id !== newQuiz.id);
      return [newQuiz, ...withoutDuplicate];
    });

    return newQuiz;
  }, []);

  const deleteQuiz = useCallback(async (quizId) => {
    const quiz = quizzes.find((item) => item.id === quizId);

    if (quiz?.teacherId) {
      await deleteDoc(doc(db, "quizzes", quizId));
    }

    setQuizzes((prev) => {
      const updated = (Array.isArray(prev) ? prev : []).filter(
        (q) => q.id !== quizId,
      );
      return updated;
    });
  }, [quizzes]);

  const updateQuiz = useCallback(async (quizId, quiz, teacher) => {
    const teacherId = typeof teacher === "string" ? teacher : teacher?.uid;

    if (!teacherId) {
      throw new Error("Please sign in as a teacher before updating a quiz.");
    }

    const existingQuiz = quizzes.find((item) => item.id === quizId);
    if (!existingQuiz) {
      throw new Error("Quiz not found.");
    }

    if (existingQuiz.teacherId && existingQuiz.teacherId !== teacherId) {
      throw new Error("You can only edit quizzes from your own account.");
    }

    const updatedQuiz = {
      ...existingQuiz,
      ...quiz,
      title: quiz.title.trim(),
      subject: quiz.subject.trim(),
      description: quiz.description.trim(),
      questions: quiz.questions.map((question) => ({
        ...question,
        text: question.text.trim(),
        choices: question.choices.map((choice) => choice.trim()),
        explanation: question.explanation.trim(),
      })),
      teacherId,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, "quizzes", quizId), {
      title: updatedQuiz.title,
      subject: updatedQuiz.subject,
      description: updatedQuiz.description,
      questions: updatedQuiz.questions,
      teacherId,
      updatedAt: serverTimestamp(),
    });

    setQuizzes((prev) =>
      prev.map((item) =>
        item.id === quizId ? { ...updatedQuiz, id: quizId } : item,
      ),
    );

    return { ...updatedQuiz, id: quizId };
  }, [quizzes]);

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
        quizSnapshot: {
          id: quiz.id,
          title: quiz.title,
          subject: quiz.subject,
          description: quiz.description,
          questions: quiz.questions,
        },
        status: "lobby",
        teamMode: !!options.teamMode,
        timerEnabled: !!options.timerEnabled,
        timerSeconds: Math.max(5, Number(options.timerSeconds) || 20),
        pointsPerCorrect: options.pointsPerCorrect || 1,
        currentQuestionIndex: 0,
        questionStartedAt: null,
        participants: [],
        teams: [],
        scores: {}, // { participantId: { name, score, totalCorrect } }
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

      const quiz =
        quizzes.find((q) => q.id === session.quizId) || session.quizSnapshot;
      if (!quiz) return null;
      const question = quiz.questions.find((q) => q.id === questionId);
      if (!question) return null;

      const correct = choiceIndex === question.correctIndex;
      const pointsPerCorrect = Math.max(0, Number(session.pointsPerCorrect) || 1);

      const updatedParticipants = session.participants.map((p) => {
        if (p.id !== participantId) return p;
        if (p.answers.find((a) => a.questionId === questionId)) return p;
        return {
          ...p,
          score: p.score + (correct ? pointsPerCorrect : 0),
          answers: [
            ...p.answers,
            {
              questionId,
              choiceIndex,
              correct,
              points: correct ? pointsPerCorrect : 0,
              timestamp: Date.now(),
            },
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
      updatedSession = {
        ...s,
        currentQuestionIndex: next,
        questionStartedAt: Date.now(),
      };
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
      questionStartedAt: Date.now(),
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
    quizzesLoading,
    quizzesError,
    sessions,
    addQuiz,
    updateQuiz,
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
