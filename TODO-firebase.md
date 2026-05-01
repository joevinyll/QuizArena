# Firebase Integration — Step-by-Step Plan

## Phase 1: Setup & Configuration

- [ ] Add Firebase deps (`firebase`, `@firebase/app-types`)
- [ ] Create firebase.js config (user needs Firebase project details)
- [ ] Add FirebaseAuthProvider to App.jsx

## Phase 2: Teacher Authentication

- [ ] Teacher login/register (email/password)
- [ ] Protect teacher routes (/teacher/\*)
- [ ] Add logout button to Navbar

## Phase 3: Data Migration — Firestore Schema

```
firestore:
  quizzes/{teacherId}/{quizId}
    - title, subject, questions[], createdAt
  sessions/{sessionCode}
    - quizId, teacherId, status, teamMode, timerSettings, participants[], answers[]
```

## Phase 4: QuizContext → FirebaseContext

- [ ] Replace mockData with Firestore queries
- [ ] Quizzes list (TeacherDashboard)
- [ ] Quiz creation (CreateQuiz → Firestore)
- [ ] Session lifecycle (HostSession)

## Phase 5: Realtime Sync — Realtime Database

```
realtime:
  sessions/{sessionCode}
    - status
    - currentQuestionIndex
    - participants/{participantId}
      - name, team, score, answers[]
```

## Phase 6: Student Flow

- [ ] Anonymous session join
- [ ] Realtime participant list (Lobby)
- [ ] Live question sync + answer submission
- [ ] Real-time score updates (QuizPlay)

## Phase 7: Results & Analytics

- [ ] Post-session aggregation (ResultsDashboard, StudentResults)
- [ ] Export/share results

## Phase 8: Testing & Deployment

- [ ] Test real-time sync multi-tab
- [ ] Test concurrent users
- [ ] Deploy to Firebase Hosting
- [ ] Update README with Firebase setup
