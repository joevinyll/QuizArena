import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useFirebase } from "../../context/FirebaseContext.jsx";
import { useRole } from "../../context/RoleContext.jsx";
import { detectInAppBrowser } from "../../utils/helpers.js";

export default function TeacherLogin() {
  const { user, login, loginWithGoogle, resetPassword, loading, error } =
    useFirebase();
  const { setUserRole } = useRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState(null);
  const [resetMessage, setResetMessage] = useState(null);
  const [browserContext, setBrowserContext] = useState({
    isInApp: false,
    isMessenger: false,
    browserName: null,
  });

  const from = location.state?.from?.pathname || "/teacher";

  useEffect(() => {
    setBrowserContext(detectInAppBrowser());
  }, []);

  useEffect(() => {
    if (user) {
      setUserRole("teacher");
      navigate(from, { replace: true });
    }
  }, [user, from, navigate, setUserRole]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    setResetMessage(null);

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

  const handleForgotPassword = async () => {
    setFormError(null);
    setResetMessage(null);

    if (!email) {
      setFormError("Enter your email first, then try reset password.");
      return;
    }

    try {
      await resetPassword(email);
      setResetMessage("Password reset email sent. Check your inbox.");
    } catch (err) {
      setFormError(err.message || "Unable to send password reset email.");
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);
    setResetMessage(null);

    try {
      await loginWithGoogle();
      setUserRole("teacher");
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(err.message || "Unable to sign in with Google.");
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

        {browserContext.isInApp && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Google sign-in may fail inside{" "}
            <span className="font-semibold">
              {browserContext.browserName || "this in-app browser"}
            </span>
            . Open this link in Chrome or Safari for the most reliable login
            experience.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-brand-500 focus:outline-none"
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
            />
          </label>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
              className="text-sm font-medium text-brand-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              Forgot password?
            </button>
          </div>

          {(formError || error) && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError || error}
            </div>
          )}

          {resetMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {resetMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || browserContext.isInApp}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {browserContext.isInApp
              ? "Open in browser for Google sign-in"
              : "Sign in with Google"}
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
