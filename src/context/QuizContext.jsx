import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { useFirebase } from "./FirebaseContext.jsx";
import { initialQuizzes } from "../data/mockData";
import { generateSessionCode, generateId } from "../utils/helpers";

const QuizContext = createContext(null);

function sanitizeTeams(teams = []) {
  return [...new Set(
    teams
      .map((team) => team?.trim())
      .filter(Boolean),
  )];
}

export function QuizProvider({ children }) {
  const { user } = useFirebase();
  const [quizzes, setQuizzes] = useState(initialQuizzes);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [quizzesError, setQuizzesError] = useState(null);
  const [sessions, setSessions] = useState({});
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState(null);

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

        setQuizzes([...teacherQuizzes, ...initialQuizzes]);
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

  // Load live sessions from Firestore so different devices stay in sync.
  useEffect(() => {
    setSessionsLoading(true);
    setSessionsError(null);

    const unsubscribe = onSnapshot(
      collection(db, "sessions"),
      (snapshot) => {
        const liveSessions = {};
        snapshot.docs.forEach((document) => {
          liveSessions[document.id] = {
            ...document.data(),
            code: document.id,
          };
        });
        setSessions(liveSessions);
        setSessionsLoading(false);
      },
      (err) => {
        setSessionsError(err.message || "Unable to load live sessions.");
        setSessionsLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // ===== Quiz CRUD =====
  const addQuiz = useCallback(async (quiz, teacher) => {
    const teacherId = typeof teacher === "string" ? teacher : teacher?.uid;
    const teacherEmail = typeof teacher === "object" ? teacher?.email : null;
    const teacherName =
      typeof teacher === "object" ? teacher?.displayName?.trim() : null;

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
      teacherName: teacherName || null,
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
    const teacherName =
      typeof teacher === "object" ? teacher?.displayName?.trim() : null;
    const teacherEmail = typeof teacher === "object" ? teacher?.email : null;

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
      teacherName: teacherName || existingQuiz.teacherName || null,
      teacherEmail: teacherEmail || existingQuiz.teacherEmail || null,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, "quizzes", quizId), {
      title: updatedQuiz.title,
      subject: updatedQuiz.subject,
      description: updatedQuiz.description,
      questions: updatedQuiz.questions,
      teacherId,
      teacherName: updatedQuiz.teacherName,
      teacherEmail: updatedQuiz.teacherEmail,
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
  const createSession = useCallback(
    async (quizId, options = {}) => {
      const quiz = quizzes.find((q) => q.id === quizId);
      if (!quiz) return null;

      let code;
      let exists = false;
      do {
        code = generateSessionCode();
        const existingSession = await getDoc(doc(db, "sessions", code));
        exists = existingSession.exists() || Boolean(sessions[code]);
      } while (exists);

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
          teacherName: quiz.teacherName || null,
          teacherEmail: quiz.teacherEmail || null,
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
        teams: sanitizeTeams(options.teams || []),
        scores: {}, // { participantId: { name, score, totalCorrect } }
        startedAt: null,
        finishedAt: null,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "sessions", code), newSession);
      setSessions((prev) => ({ ...prev, [code]: newSession }));
      return newSession;
    },
    [quizzes, sessions],
  );

  const getSession = useCallback(
    (code) => {
      if (!code) return null;
      return sessions[code.toUpperCase()] || null;
    },
    [sessions],
  );

  const loadSession = useCallback(async (code) => {
    if (!code) return null;
    const upper = code.toUpperCase();
    if (sessions[upper]) return sessions[upper];

    const snapshot = await getDoc(doc(db, "sessions", upper));
    if (!snapshot.exists()) return null;

    const session = { ...snapshot.data(), code: upper };
    setSessions((prev) => ({ ...prev, [upper]: session }));
    return session;
  }, [sessions]);

  const updateSession = useCallback(async (code, updater) => {
    const upper = code.toUpperCase();
    const existing = sessions[upper] || (await loadSession(upper));
    if (!existing) return;
    const updatedSession =
      typeof updater === "function"
        ? updater(existing)
        : { ...existing, ...updater };
    await setDoc(doc(db, "sessions", upper), updatedSession);
    setSessions((prev) => ({ ...prev, [upper]: updatedSession }));
    return updatedSession;
  }, [loadSession, sessions]);

  const joinSession = useCallback(async (code, name, team = null) => {
    const upper = code.toUpperCase();
    const session = await loadSession(upper);

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

    const normalizedTeam = team?.trim() || null;
    if (session.teamMode) {
      const availableTeams = sanitizeTeams(session.teams);
      if (availableTeams.length === 0) {
        return {
          ok: false,
          error: "Your teacher has not added groups yet.",
        };
      }
      if (!normalizedTeam || !availableTeams.includes(normalizedTeam)) {
        return {
          ok: false,
          error: "Please choose a valid group selected by your teacher.",
        };
      }
    }

    const participant = {
      id: generateId("p"),
      name,
      team: session.teamMode ? normalizedTeam : null,
      score: 0,
      answers: [],
      joinedAt: new Date().toISOString(),
    };

    const updatedSession = {
      ...session,
      participants: [...session.participants, participant],
    };
    await setDoc(doc(db, "sessions", upper), updatedSession);
    setSessions((prev) => ({ ...prev, [upper]: updatedSession }));

    return {
      ok: true,
      participant,
      session: updatedSession,
    };
  }, [loadSession]);

  const submitAnswer = useCallback(
    async (code, participantId, questionId, choiceIndex) => {
      const upper = code.toUpperCase();
      const session = await loadSession(upper);
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
              timedOut: choiceIndex < 0,
              timestamp: Date.now(),
            },
          ],
        };
      });

      const updatedSession = {
        ...session,
        participants: updatedParticipants,
      };
      await setDoc(doc(db, "sessions", upper), updatedSession);
      setSessions((prev) => ({ ...prev, [upper]: updatedSession }));

      return {
        correct,
        correctIndex: question.correctIndex,
        explanation: question.explanation,
      };
    },
    [loadSession, quizzes],
  );

  const advanceQuestion = useCallback(async (code) => {
    const upper = code.toUpperCase();
    const s = await loadSession(upper);
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
    await setDoc(doc(db, "sessions", upper), updatedSession);
    setSessions((prev) => ({ ...prev, [upper]: updatedSession }));
    return updatedSession;
  }, [loadSession]);

  const startSession = useCallback(async (code) => {
    const upper = code.toUpperCase();
    const s = await loadSession(upper);
    if (!s) return;
    const updatedSession = {
      ...s,
      status: "running",
      startedAt: new Date().toISOString(),
      questionStartedAt: Date.now(),
    };
    await setDoc(doc(db, "sessions", upper), updatedSession);
    setSessions((prev) => ({ ...prev, [upper]: updatedSession }));
    return updatedSession;
  }, [loadSession]);

  const endSession = useCallback(async (code) => {
    const upper = code.toUpperCase();
    const s = await loadSession(upper);
    if (!s) return;
    const updatedSession = {
      ...s,
      status: "finished",
      finishedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "sessions", upper), updatedSession);
    setSessions((prev) => ({ ...prev, [upper]: updatedSession }));
    return updatedSession;
  }, [loadSession]);

  const value = {
    quizzes,
    quizzesLoading,
    quizzesError,
    sessions,
    sessionsLoading,
    sessionsError,
    addQuiz,
    updateQuiz,
    deleteQuiz,
    getQuiz,
    createSession,
    getSession,
    loadSession,
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
