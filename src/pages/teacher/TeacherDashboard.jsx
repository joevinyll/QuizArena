import { Link, useNavigate } from "react-router-dom";
import { useQuiz } from "../../context/QuizContext";
import { formatDate } from "../../utils/helpers";

export default function TeacherDashboard() {
  const { quizzes, deleteQuiz, createSession } = useQuiz();
  const navigate = useNavigate();

  const handleHost = (quizId) => {
    const s = createSession(quizId, { teamMode: false, timerEnabled: false });
    if (s) navigate(`/teacher/host/${s.code}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="badge-brand mb-2">Teacher Dashboard</span>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Your Quiz Library
          </h1>
          <p className="text-slate-600 mt-1">
            Create, manage, and host quizzes for your classroom.
          </p>
        </div>
        <Link to="/teacher/create" className="btn-primary">
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create New Quiz
        </Link>
      </div>

      {quizzes.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-3">📝</div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">
            No quizzes yet
          </h3>
          <p className="text-slate-600 mb-5">
            Start by creating your first quiz.
          </p>
          <Link to="/teacher/create" className="btn-primary">
            Create Quiz
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="card p-6 flex flex-col hover:shadow-soft transition"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="badge-slate">{quiz.subject}</span>
                <button
                  onClick={() => {
                    if (
                      confirm(`Delete "${quiz.title}"? This cannot be undone.`)
                    )
                      deleteQuiz(quiz.id);
                  }}
                  className="text-slate-400 hover:text-danger-500 transition p-1"
                  title="Delete quiz"
                >
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"
                    />
                  </svg>
                </button>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">
                {quiz.title}
              </h3>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2 flex-1">
                {quiz.description}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                <span className="flex items-center gap-1">
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  {quiz.questions.length} question
                  {quiz.questions.length !== 1 && "s"}
                </span>
                <span>{formatDate(quiz.createdAt)}</span>
              </div>
              <button
                onClick={() => handleHost(quiz.id)}
                className="btn-primary w-full"
              >
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
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Host Live Session
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
