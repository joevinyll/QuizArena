import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useFirebase } from "../../context/FirebaseContext.jsx";
import { useRole } from "../../context/RoleContext.jsx";

export default function TeacherLogin() {
  const { user, login, loading, error } = useFirebase();
  const { setUserRole } = useRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState(null);

  const from = location.state?.from?.pathname || "/teacher";

  useEffect(() => {
    if (user) {
      setUserRole("teacher");
      navigate(from, { replace: true });
    }
  }, [user, from, navigate, setUserRole]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError("Please enter both email and password.");
      return;
    }

    try {
      await login(email, password);
      setUserRole("teacher");
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(err.message || "Unable to sign in.");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="card p-8 shadow-soft border">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            Teacher Login
          </h1>
          <p className="text-slate-600">
            Sign in with your teacher account to manage quizzes and host
            sessions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-brand-500 focus:outline-none"
              placeholder="teacher@school.edu"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-brand-500 focus:outline-none"
              placeholder="••••••••"
            />
          </label>

          {(formError || error) && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError || error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-slate-600 mt-6">
          Don't have an account?{" "}
          <Link
            to="/teacher/register"
            className="text-brand-600 hover:underline"
          >
            Register here
          </Link>
        </p>

        <p className="text-sm text-slate-600 mt-4">
          <Link to="/" className="text-brand-600 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
