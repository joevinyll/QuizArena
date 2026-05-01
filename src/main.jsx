import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { QuizProvider } from "./context/QuizContext.jsx";
import { FirebaseProvider } from "./context/FirebaseContext.jsx";
import { RoleProvider } from "./context/RoleContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <RoleProvider>
        <FirebaseProvider>
          <QuizProvider>
            <App />
          </QuizProvider>
        </FirebaseProvider>
      </RoleProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
