const FEEDBACK_EMAIL = "nalinbhardwaj@gmail.com";

/** Small, quiet credit line. Shown outside gameplay so it never gets in the way. */
export function About() {
  return (
    <footer className="about" aria-label="About this game">
      <p>
        Made by <strong>Nalin Bhardwaj</strong> · an AI/ML frontend project
      </p>
      <p>
        Feedback welcome:{" "}
        <a href={`mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent("Feedback: Who In The Room")}`}>{FEEDBACK_EMAIL}</a>
      </p>
    </footer>
  );
}
