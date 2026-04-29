import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import CreateQuiz from "./pages/teacher/CreateQuiz";
import HostSession from "./pages/teacher/HostSession";
import ResultsDashboard from "./pages/teacher/ResultsDashboard";
import JoinSession from "./pages/student/JoinSession";
import StudentLobby from "./pages/student/StudentLobby";
import QuizPlay from "./pages/student/QuizPlay";
import StudentResults from "./pages/student/StudentResults";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Teacher routes */}
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/teacher/create" element={<CreateQuiz />} />
          <Route path="/teacher/host/:code" element={<HostSession />} />
          <Route path="/teacher/results/:code" element={<ResultsDashboard />} />

          {/* Student routes */}
          <Route path="/join" element={<JoinSession />} />
          <Route path="/student/lobby/:code" element={<StudentLobby />} />
          <Route path="/student/play/:code" element={<QuizPlay />} />
          <Route path="/student/results/:code" element={<StudentResults />} />

          {/* Fallback */}
          <Route
            path="*"
            element={
              <div className="max-w-2xl mx-auto text-center py-24 px-4">
                <h1 className="text-6xl font-extrabold text-brand-600 mb-3">
                  404
                </h1>
                <p className="text-slate-600 mb-6">Page not found.</p>
                <a href="/" className="btn-primary">
                  Back to Home
                </a>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
