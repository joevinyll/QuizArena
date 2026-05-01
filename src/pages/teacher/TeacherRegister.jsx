import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useFirebase } from "../../context/FirebaseContext.jsx";
import { useRole } from "../../context/RoleContext.jsx";

export default function TeacherRegister() {
  const { user, register, loading, error } = useFirebase();
  const { setUserRole } = useRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    if (!email || !password || !confirmPassword) {
      setFormError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    try {
      await register(email, password);
      setUserRole("teacher");
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(err.message || "Unable to register.");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="card p-8 shadow-soft border">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            Teacher Registration
          </h1>
          <p className="text-slate-600">
            Create a teacher account to manage quizzes and track student
            performance.
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

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Confirm Password
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
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
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-slate-600 mt-6">
          Already have an account?{" "}
          <Link to="/teacher/login" className="text-brand-600 hover:underline">
            Sign in
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
