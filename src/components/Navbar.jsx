import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-soft group-hover:scale-105 transition">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 leading-tight">
                QuizArena
              </h1>
              <p className="text-[10px] text-slate-500 leading-tight -mt-0.5">
                Learn · Collaborate · Grow
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${isActive("/") ? "bg-brand-100 text-brand-700" : "text-slate-600 hover:bg-slate-100"}`}
            >
              Home
            </Link>
            <Link
              to="/teacher"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${location.pathname.startsWith("/teacher") ? "bg-brand-100 text-brand-700" : "text-slate-600 hover:bg-slate-100"}`}
            >
              Teacher
            </Link>
            <Link
              to="/join"
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${location.pathname.startsWith("/join") || location.pathname.startsWith("/student") ? "bg-brand-100 text-brand-700" : "text-slate-600 hover:bg-slate-100"}`}
            >
              Join Quiz
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/join" className="btn-secondary text-sm !px-4 !py-2">
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
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
              Join
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
