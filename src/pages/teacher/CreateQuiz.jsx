import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuiz } from "../../context/QuizContext";
import { generateId } from "../../utils/helpers";

const emptyQuestion = () => ({
  id: generateId("q"),
  text: "",
  choices: ["", "", "", ""],
  correctIndex: 0,
  explanation: "",
});

export default function CreateQuiz() {
  const { addQuiz } = useQuiz();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [error, setError] = useState("");

  const updateQuestion = (idx, patch) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)),
    );
  };

  const updateChoice = (qIdx, cIdx, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const choices = [...q.choices];
        choices[cIdx] = value;
        return { ...q, choices };
      }),
    );
  };

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);
  const removeQuestion = (idx) => {
    if (questions.length === 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = () => {
    if (!title.trim()) return "Quiz title is required.";
    if (!subject.trim()) return "Subject is required.";
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) return `Question ${i + 1}: text is required.`;
      for (let j = 0; j < q.choices.length; j++) {
        if (!q.choices[j].trim())
          return `Question ${i + 1}: choice ${String.fromCharCode(65 + j)} is empty.`;
      }
    }
    return "";
  };

  const handleSave = (e) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError("");
    addQuiz({ title, subject, description, questions });
    navigate("/teacher");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link
          to="/teacher"
          className="text-sm text-brand-700 font-semibold inline-flex items-center gap-1 hover:underline"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-2">
          Create a New Quiz
        </h1>
        <p className="text-slate-600 mt-1">
          Add multiple-choice questions. Include explanations for richer
          feedback.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium animate-fade-in">
          ⚠ {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Quiz info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-slate-900">Quiz Info</h2>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Title *
            </label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Algebra Review"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Subject *
              </label>
              <input
                className="input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Mathematics"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Description
              </label>
              <input
                className="input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short summary (optional)"
              />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((q, qIdx) => (
            <div key={q.id} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="badge-brand">Question {qIdx + 1}</span>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIdx)}
                    className="text-sm text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-1"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"
                      />
                    </svg>
                    Remove
                  </button>
                )}
              </div>

              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Question text *
              </label>
              <textarea
                className="input mb-4"
                rows="2"
                value={q.text}
                onChange={(e) => updateQuestion(qIdx, { text: e.target.value })}
                placeholder="Type the question..."
              />

              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Choices (select the correct one) *
              </label>
              <div className="space-y-2 mb-4">
                {q.choices.map((choice, cIdx) => (
                  <label
                    key={cIdx}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                      q.correctIndex === cIdx
                        ? "border-success-500 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-brand-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={q.correctIndex === cIdx}
                      onChange={() =>
                        updateQuestion(qIdx, { correctIndex: cIdx })
                      }
                      className="w-4 h-4 accent-emerald-600"
                    />
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        q.correctIndex === cIdx
                          ? "bg-success-500 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {String.fromCharCode(65 + cIdx)}
                    </span>
                    <input
                      type="text"
                      className="flex-1 bg-transparent border-0 focus:outline-none text-slate-800 placeholder:text-slate-400"
                      value={choice}
                      onChange={(e) => updateChoice(qIdx, cIdx, e.target.value)}
                      placeholder={`Choice ${String.fromCharCode(65 + cIdx)}`}
                    />
                  </label>
                ))}
              </div>

              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Explanation{" "}
                <span className="text-slate-400 font-normal">
                  (shown after answering — encourages reflection)
                </span>
              </label>
              <textarea
                className="input"
                rows="2"
                value={q.explanation}
                onChange={(e) =>
                  updateQuestion(qIdx, { explanation: e.target.value })
                }
                placeholder="Explain why the correct answer is correct..."
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addQuestion}
          className="btn-secondary w-full border-dashed"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Another Question
        </button>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
          <Link to="/teacher" className="btn-ghost flex-1 sm:flex-none">
            Cancel
          </Link>
          <button type="submit" className="btn-primary flex-1">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Save Quiz
          </button>
        </div>
      </form>
    </div>
  );
}
