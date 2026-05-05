export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid md:grid-cols-3 gap-6 text-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <img
              src="/quizarena-logo-title.png"
              alt=""
              className="w-8 h-8 rounded-lg object-contain"
            />
            <span className="font-bold text-slate-900">QuizArena</span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            A collaborative learning & assessment platform for teachers and
            students. Focused on participation, feedback, and progress.
          </p>
        </div>
        <div>
          <h4 className="text-slate-900 font-semibold mb-2">Core Principles</h4>
          <ul className="space-y-1 text-slate-500">
            <li>• Immediate Feedback</li>
            <li>• Consistent UI</li>
            <li>• Simple Join Flow</li>
            <li>• Teacher Control</li>
          </ul>
        </div>
        <div>
          <h4 className="text-slate-900 font-semibold mb-2">
            Built For Learning
          </h4>
          <p className="text-slate-500">
            Formative assessments, class reviews, group activities, and
            interactive discussions.
          </p>
          <p className="text-xs text-slate-400 mt-3">
            © {new Date().getFullYear()} QuizArena · Educational Project
          </p>
        </div>
      </div>
    </footer>
  );
}
