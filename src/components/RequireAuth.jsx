import { Navigate, useLocation } from "react-router-dom";
import { useFirebase } from "../context/FirebaseContext.jsx";

export default function RequireAuth({ children }) {
  const { user, loading } = useFirebase();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-brand-100 text-brand-600 animate-spin">
            <span className="text-xl">⏳</span>
          </div>
          <p className="text-sm text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/teacher/login" state={{ from: location }} replace />;
  }

  return children;
}
