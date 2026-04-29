# QuizArena 🎓

A Collaborative Learning & Assessment Platform — built with React + Vite + Tailwind CSS.

> **Focus:** Participation, Feedback, and Learning Progress — not just competition.

---

## ✨ Features (Phase 1 — UI)

- 🔑 **Session Code System** — Students join with a short 6-character code
- 🧠 **Learning Mode** — Questions one-at-a-time with immediate feedback + explanations
- 🤝 **Team Play Option** — Optional team mode for group participation
- ⏱️ **Optional Question Timer** — Teachers decide when speed matters
- 📈 **Progress Tracking** — Students see their score, accuracy & rank
- 📊 **Teacher Dashboard** — Class accuracy, hardest questions, per-student breakdown
- 💬 **Review & Feedback Section** — Students review answers with explanations

## 🧭 User Flows

### Teacher

1. Go to **Teacher Dashboard** → browse or create a quiz
2. Click **Host Live Session** → a session code is generated
3. Configure options (team mode, timer) in the lobby
4. Click **Start Quiz** → view live answer stats + leaderboard
5. Click **Next Question** → repeat until finished
6. View **Results Dashboard** with full class analytics

### Student

1. Go to **Join Quiz** → enter session code
2. Enter name (and team, if enabled)
3. Wait in **lobby** until teacher starts
4. Answer questions with immediate feedback
5. View **personal results** with review section & explanations

## 🧱 Tech Stack

- **React 18** + **Vite 5**
- **React Router 6**
- **Tailwind CSS 3**
- **Context API** (mock state layer — ready for Firebase swap)

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Then open http://localhost:5173

### Build

```bash
npm run build
npm run preview
```

## 🗂️ Project Structure

```
src/
├── components/         # Reusable UI (Navbar, ProgressBar, QuestionCard, ...)
├── context/            # QuizContext — global state (mock layer)
├── data/               # mockData.js — sample quizzes
├── pages/
│   ├── Home.jsx
│   ├── teacher/        # Dashboard, CreateQuiz, HostSession, ResultsDashboard
│   └── student/        # JoinSession, Lobby, QuizPlay, StudentResults
├── utils/              # helpers (session code generator, etc.)
├── App.jsx             # Router
└── main.jsx            # Entry
```

## 🎨 HCI / UX Principles Applied

| Principle        | How                                                         |
| ---------------- | ----------------------------------------------------------- |
| **Feedback**     | Instant ✓/✗ + explanations after each answer                |
| **Consistency**  | Shared layout, badges, button styles across pages           |
| **Visibility**   | Progress bar, score, timer always visible                   |
| **Simplicity**   | Two-step join (code → name), minimal inputs                 |
| **User Control** | Teachers control timer, team mode, session flow             |
| **Engagement**   | Animations, live leaderboard, team mode, reflection prompts |

## 🔮 Phase 2 (Database — Planned)

The state layer in `src/context/QuizContext.jsx` is structured so it can be swapped with Firebase:

- **Firebase Auth** → Teacher accounts
- **Firestore** → `quizzes` & persistent `results` collections
- **Realtime Database** → live `sessions/{code}` for real-time sync
- **Firebase Hosting** or **Vercel** → deployment

## 📝 Scope & Limitations (per proposal)

- V1 supports multiple-choice questions only
- Requires stable internet (Phase 2)
- Basic analytics only
- Simple animations — no sound effects yet

---

© QuizArena · Educational Project · Built with ❤️ for learners and teachers.
