import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useFirebase } from "../context/FirebaseContext.jsx";
import { useRole } from "../context/RoleContext.jsx";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useFirebase();
  const { clearRole } = useRole();
  const isActive = (path) => location.pathname === path;

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const linkClass = (active) =>
    `px-4 py-2 rounded-lg text-sm font-semibold transition ${
      active
        ? "bg-brand-100 text-brand-700"
        : "text-slate-600 hover:bg-slate-100"
    }`;

  const handleLogout = async () => {
    await logout();
    clearRole();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          <Link
            to="/"
            className="flex items-center gap-2 group min-w-0 flex-shrink"
          >
            <img
              src="/quizarena-logo-title.png"
              alt="QuizArena"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain group-hover:scale-105 transition flex-shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight truncate">
                QuizArena
              </h1>
              <p className="text-[10px] text-slate-500 leading-tight -mt-0.5 hidden xs:block sm:block">
                Learn · Collaborate · Grow
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/" className={linkClass(isActive("/"))}>
              Home
            </Link>
            <Link
              to="/teacher"
              className={linkClass(location.pathname.startsWith("/teacher"))}
            >
              Teacher
            </Link>
            <Link
              to="/join"
              className={linkClass(
                location.pathname.startsWith("/join") ||
                  location.pathname.startsWith("/student"),
              )}
            >
              Join Quiz
            </Link>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <Link
              to="/join"
              className="btn-secondary text-xs sm:text-sm !px-3 sm:!px-4 !py-1.5 sm:!py-2 hidden sm:inline-flex"
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
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
              Join
            </Link>

            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="btn-secondary text-xs sm:text-sm !px-3 sm:!px-4 !py-1.5 sm:!py-2"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/teacher/login"
                className="btn-primary text-xs sm:text-sm !px-3 sm:!px-4 !py-1.5 sm:!py-2"
              >
                Teacher Login
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
            >
              {mobileOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <nav className="md:hidden pb-3 pt-1 border-t border-slate-100 animate-fade-in">
            <div className="flex flex-col gap-1">
              <Link to="/" className={linkClass(isActive("/"))}>
                🏠 Home
              </Link>
              <Link
                to="/teacher"
                className={linkClass(location.pathname.startsWith("/teacher"))}
              >
                👨‍🏫 Teacher Dashboard
              </Link>
              <Link
                to="/join"
                className={linkClass(
                  location.pathname.startsWith("/join") ||
                    location.pathname.startsWith("/student"),
                )}
              >
                🎓 Join Quiz
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
