import React, { useState } from "react";
import Input from "./Input";
import { useNavigate } from "react-router-dom";
import styles from "./css/RegisterUser.module.css";

const API_URL = import.meta.env.VITE_API_URL;

export default function RegisterUser() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Du måste vara inloggad som admin.");
        return;
      }

      const response = await fetch(`${API_URL}/api/Auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        let errorMessage = responseText || "Användaren kunde inte skapas.";

        try {
          const payload = JSON.parse(responseText);
          if (Array.isArray(payload.errors) && payload.errors.length > 0) {
            errorMessage = payload.errors.join(" ");
          } else if (payload.message) {
            errorMessage = payload.message;
          }
        } catch {
          // The API may return a plain-text error.
        }

        setError(errorMessage);
        return;
      }

      setMessage("Användaren skapades. Personen kan nu logga in.");
      setEmail("");
      setPassword("");
    } catch {
      setError("Kunde inte ansluta till servern. Försök igen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <button
        className={styles.backButton}
        type="button"
        onClick={() => navigate("/")}
      >
        Tillbaka
      </button>
      <h2>Registrera användare</h2>

      <form onSubmit={handleSubmit}>
        <Input
          type="email"
          label="E-post"
          value={email}
          placeholder="dittnamn@innoviahub.se"
          onChange={setEmail}
        />
        <Input
          type="password"
          label="lösenord"
          value={password}
          placeholder="Abcd1234!"
          onChange={setPassword}
        />

        {error && <p role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Registrerar..." : "Registrera"}
        </button>
      </form>
    </section>
  );
}
