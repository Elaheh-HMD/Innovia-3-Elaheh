import { useState } from "react";
import styles from "./css/AiAssistant.module.css";

const API_URL = import.meta.env.VITE_API_URL;

const examples = [
  "Hur bokar jag ett mötesrum?",
  "Vilka resurser kan jag boka?",
  "Jag behöver ett mötesrum. Vad ska jag göra?"
];

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function askAi(value: string) {
    const trimmed = value.trim();

    if (!trimmed || loading) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Du måste vara inloggad för att använda AI-guiden.");
      return;
    }

    setQuestion(trimmed);
    setAnswer("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/ai/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(trimmed)
      });

      if (response.status === 401) {
        throw new Error("Din inloggning har gått ut. Logga in igen.");
      }

      if (!response.ok) {
        throw new Error("AI-guiden kunde inte svara just nu.");
      }

      const data = await response.json();
      setAnswer(data.answer ?? "Jag kunde inte hitta ett svar.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ett okänt fel uppstod.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void askAi(question);
  }

  return (
    <>
      {open && (
        <section className={styles.panel} aria-label="AI-guide">
          <div className={styles.header}>
            <div>
              <strong>Innovia AI-guide</strong>
              <p>Fråga om hur Innovia Hub fungerar.</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Stäng">
              ×
            </button>
          </div>

          {!answer && !loading && !error && (
            <div className={styles.examples}>
              <p>Exempel:</p>
              {examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => void askAi(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          )}

          {loading && <p className={styles.status}>AI-guiden skriver ett svar...</p>}
          {error && <p className={styles.error}>{error}</p>}
          {answer && <div className={styles.answer}>{answer}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Skriv din fråga..."
              maxLength={1000}
              aria-label="Fråga AI-guiden"
            />
            <button type="submit" disabled={loading || !question.trim()}>
              Fråga
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className={styles.floatingButton}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        {open ? "Stäng AI" : "AI-hjälp"}
      </button>
    </>
  );
}
