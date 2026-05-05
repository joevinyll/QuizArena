export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  selectedIndex = null,
  answered = false,
  showCorrectAnswer = false,
  correctIndex = null,
  disabled = false,
}) {
  const statusLabel = showCorrectAnswer
    ? selectedIndex === null
      ? { text: "Time's Up", className: "badge-danger" }
      : selectedIndex === correctIndex
        ? { text: "✓ Correct", className: "badge-success" }
        : { text: "✗ Incorrect", className: "badge-danger" }
    : answered
      ? { text: "Answer Locked", className: "badge-brand" }
      : null;

  return (
    <div className="card p-5 sm:p-8 animate-slide-up">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <span className="badge-brand">
          Question {questionNumber} of {totalQuestions}
        </span>
        {statusLabel && (
          <span className={statusLabel.className}>{statusLabel.text}</span>
        )}
      </div>

      <h2 className="text-lg sm:text-2xl font-bold text-slate-900 mb-5 sm:mb-6 leading-snug break-words">
        {question.text}
      </h2>

      <div className="grid gap-2.5 sm:gap-3">
        {question.choices.map((choice, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrect = showCorrectAnswer && idx === correctIndex;
          const isWrongPick =
            showCorrectAnswer && isSelected && idx !== correctIndex;

          let style =
            "border-slate-200 bg-white hover:border-brand-400 hover:bg-brand-50";
          if (isSelected && !showCorrectAnswer)
            style = "border-brand-500 bg-brand-50 ring-4 ring-brand-100";
          if (isCorrect)
            style = "border-success-500 bg-emerald-50 ring-4 ring-emerald-100";
          if (isWrongPick)
            style = "border-danger-500 bg-rose-50 ring-4 ring-rose-100";

          return (
            <button
              key={idx}
              disabled={disabled}
              onClick={() => !disabled && onAnswer(idx)}
              className={`flex items-center gap-3 sm:gap-4 text-left p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all duration-200 ${style} disabled:cursor-not-allowed`}
            >
              <span
                className={`flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl font-bold flex items-center justify-center text-sm sm:text-base ${
                  isCorrect
                    ? "bg-success-500 text-white"
                    : isWrongPick
                      ? "bg-danger-500 text-white"
                      : isSelected
                        ? "bg-brand-600 text-white"
                        : "bg-slate-100 text-slate-600"
                }`}
              >
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1 text-sm sm:text-lg font-medium text-slate-800 break-words min-w-0">
                {choice}
              </span>
              {isCorrect && (
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-success-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              {isWrongPick && (
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-danger-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {showCorrectAnswer && question.explanation && (
        <div className="mt-6 p-4 rounded-xl bg-brand-50 border border-brand-100 animate-fade-in">
          <p className="text-sm font-bold text-brand-700 mb-1 flex items-center gap-1">
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Explanation
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
