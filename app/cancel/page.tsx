export default function CancelPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#020617",
        color: "white",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          maxWidth: "420px",
          width: "100%",
          textAlign: "center",
          backgroundColor: "#020817",
          borderRadius: "1.5rem",
          padding: "2rem",
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
        }}
      >
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.75rem" }}>
          Payment canceled
        </h1>
        <p style={{ opacity: 0.8, fontSize: "0.95rem", marginBottom: "1.5rem" }}>
          You canceled the payment. No money was charged.
        </p>

        <a
          href="/tip"
          style={{
            display: "inline-block",
            marginTop: "0.5rem",
            padding: "0.75rem 1.5rem",
            borderRadius: "999px",
            border: "none",
            backgroundColor: "#22c55e",
            color: "white",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Try again
        </a>

        <p
          style={{
            marginTop: "1.25rem",
            fontSize: "0.8rem",
            opacity: 0.6,
          }}
        >
          Powered by PayTapper & Stripe.
        </p>
      </div>
    </div>
  );
}

