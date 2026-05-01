import { Navigate, useLocation, useParams } from "react-router-dom";

export default function RequireStudent({ children }) {
  const { code } = useParams();
  const location = useLocation();

  if (!code) {
    return <Navigate to="/join" replace />;
  }

  try {
    const participant = sessionStorage.getItem(`qa_participant_${code}`);
    if (!participant) {
      return <Navigate to="/join" state={{ from: location }} replace />;
    }
  } catch {
    return <Navigate to="/join" state={{ from: location }} replace />;
  }

  return children;
}
