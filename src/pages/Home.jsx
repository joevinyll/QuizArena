import { Link, useNavigate } from "react-router-dom";
import { useRole } from "../context/RoleContext.jsx";

export default function Home() {
  const navigate = useNavigate();
  const { setUserRole } = useRole();

  const handleStudentRole = () => {
    setUserRole("student");
    navigate("/join");
  };

  const handleTeacherRole = () => {
    setUserRole("teacher");
    navigate("/teacher");
  };

  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 pb-10 sm:pb-12">
        <div className="text-center max-w-3xl mx-auto animate-fade-in">
          <span className="badge-brand mb-4 inline-block">
            🎓 Collaborative Learning Platform
          </span>
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">
            Learning quizzes that <span className="text-brand-600">engage</span>
            , not just compete.
          </h1>
          <p className="mt-4 sm:mt-5 text-base sm:text-lg text-slate-600 leading-relaxed px-2 sm:px-0">
            QuizArena is a classroom quiz platform focused on participation,
            feedback, and learning progress — not just speed and leaderboards.
          </p>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <button
              onClick={handleStudentRole}
              className="btn-primary text-base !px-7 !py-3.5 w-full sm:w-auto"
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
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
              I'm a Student — Join a Quiz
            </button>
            <button
              onClick={handleTeacherRole}
              className="btn-secondary text-base !px-7 !py-3.5 w-full sm:w-auto"
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              I'm a Teacher — Host a Quiz
            </button>
          </div>
        </div>

        {/* Decorative cards preview */}
        <div className="mt-12 sm:mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
          <FeatureCard
            icon="🔑"
            title="Session Code System"
            description="Students join instantly using a short code. No accounts required for participants."
          />
          <FeatureCard
            icon="🧠"
            title="Learning Mode"
            description="Questions are presented one at a time with immediate feedback and explanations."
          />
          <FeatureCard
            icon="🤝"
            title="Team Play Option"
            description="Participate individually or in groups to encourage discussion and collaboration."
          />
          <FeatureCard
            icon="⏱️"
            title="Optional Timer"
            description="Add a countdown only when it fits — learning shouldn't always be a race."
          />
          <FeatureCard
            icon="📈"
            title="Progress Tracking"
            description="Students see progress, scores, and review answers after each activity."
          />
          <FeatureCard
            icon="📊"
            title="Teacher Dashboard"
            description="View class accuracy, difficult questions, and student-by-student results."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-slate-100 py-12 sm:py-16 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              How it works
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600">
              Three simple steps to start a collaborative quiz.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            <Step
              n="1"
              title="Teacher creates a quiz"
              text="Build multiple-choice questions with explanations for learning-focused feedback."
            />
            <Step
              n="2"
              title="Students join with a code"
              text="Participants open the join page, enter the session code, and pick a name."
            />
            <Step
              n="3"
              title="Learn, answer, review"
              text="Everyone answers in real time. Review correct answers and reflect on mistakes."
            />
          </div>
        </div>
      </section>

      {/* HCI principles */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-8 sm:mb-10">
          <span className="badge-slate mb-3 inline-block">
            HCI · UX Principles
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Built around the way people learn
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Principle
            title="Feedback"
            text="Instant, meaningful responses after every answer."
          />
          <Principle
            title="Consistency"
            text="Predictable layout for questions, choices, and results."
          />
          <Principle
            title="Visibility"
            text="Progress, scores, and status are always visible."
          />
          <Principle
            title="Simplicity"
            text="Minimum steps to create, join, and play."
          />
          <Principle
            title="User Control"
            text="Teachers control timer, flow, and scoring."
          />
          <Principle
            title="Engagement"
            text="Interactive elements and optional team play."
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="card p-6 hover:shadow-soft hover:-translate-y-0.5 transition">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ n, title, text }) {
  return (
    <div className="relative p-6 rounded-2xl bg-slate-50 border border-slate-100">
      <div className="absolute -top-4 left-6 w-10 h-10 rounded-xl bg-brand-600 text-white font-extrabold flex items-center justify-center shadow-soft">
        {n}
      </div>
      <h4 className="font-bold text-slate-900 mt-3 mb-1">{title}</h4>
      <p className="text-sm text-slate-600">{text}</p>
    </div>
  );
}

function Principle({ title, text }) {
  return (
    <div className="card p-5">
      <h4 className="font-bold text-brand-700 mb-1">{title}</h4>
      <p className="text-sm text-slate-600">{text}</p>
    </div>
  );
}
