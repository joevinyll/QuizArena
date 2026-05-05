// Sample quiz library (replace with Firestore later)
export const initialQuizzes = [
  {
    id: "quiz_sample_1",
    isSample: true,
    teacherName: "QuizArena",
    title: "Introduction to Photosynthesis",
    subject: "Biology",
    description: "A short review on how plants convert sunlight into energy.",
    createdAt: "2026-05-05",
    questions: [
      {
        id: "q1",
        text: "Which organelle is responsible for photosynthesis?",
        choices: ["Mitochondria", "Chloroplast", "Nucleus", "Ribosome"],
        correctIndex: 1,
        explanation:
          "Chloroplasts contain chlorophyll and are the site of photosynthesis.",
      },
      {
        id: "q2",
        text: "What gas do plants absorb during photosynthesis?",
        choices: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
        correctIndex: 2,
        explanation: "Plants absorb CO₂ and release oxygen as a by-product.",
      },
      {
        id: "q3",
        text: "Which pigment gives plants their green color?",
        choices: ["Carotene", "Xanthophyll", "Chlorophyll", "Anthocyanin"],
        correctIndex: 2,
        explanation:
          "Chlorophyll absorbs red and blue light and reflects green.",
      },
      {
        id: "q4",
        text: "Photosynthesis primarily occurs in which part of the plant?",
        choices: ["Roots", "Stems", "Leaves", "Flowers"],
        correctIndex: 2,
        explanation:
          "Leaves have the largest surface area exposed to sunlight.",
      },
    ],
  },
  {
    id: "quiz_sample_2",
    isSample: true,
    teacherName: "QuizArena",
    title: "World Capitals Review",
    subject: "Geography",
    description: "Test your knowledge of countries and their capital cities.",
    createdAt: "2026-05-05",
    questions: [
      {
        id: "q1",
        text: "What is the capital of Japan?",
        choices: ["Seoul", "Beijing", "Tokyo", "Bangkok"],
        correctIndex: 2,
        explanation: "Tokyo has been the capital of Japan since 1868.",
      },
      {
        id: "q2",
        text: "What is the capital of Australia?",
        choices: ["Sydney", "Melbourne", "Canberra", "Perth"],
        correctIndex: 2,
        explanation:
          "Canberra was chosen as a compromise between Sydney and Melbourne.",
      },
      {
        id: "q3",
        text: "What is the capital of Canada?",
        choices: ["Toronto", "Ottawa", "Vancouver", "Montreal"],
        correctIndex: 1,
        explanation:
          "Ottawa is the capital, though Toronto is the largest city.",
      },
    ],
  },
  {
    id: "quiz_sample_3",
    isSample: true,
    teacherName: "QuizArena",
    title: "Basic Algebra Warm-Up",
    subject: "Mathematics",
    description: "Quick review of linear equations and arithmetic.",
    createdAt: "2026-05-05",
    questions: [
      {
        id: "q1",
        text: "Solve for x: 2x + 6 = 14",
        choices: ["2", "4", "6", "8"],
        correctIndex: 1,
        explanation: "2x = 14 - 6 = 8, so x = 4.",
      },
      {
        id: "q2",
        text: "What is 7 × 8?",
        choices: ["48", "54", "56", "64"],
        correctIndex: 2,
        explanation: "7 × 8 = 56.",
      },
      {
        id: "q3",
        text: "If y = 3x and x = 5, what is y?",
        choices: ["8", "15", "20", "25"],
        correctIndex: 1,
        explanation: "y = 3 × 5 = 15.",
      },
      {
        id: "q4",
        text: "What is the value of √81?",
        choices: ["7", "8", "9", "10"],
        correctIndex: 2,
        explanation: "9 × 9 = 81.",
      },
    ],
  },
];

// Starting empty sessions (populated live when host starts)
export const initialSessions = {};
