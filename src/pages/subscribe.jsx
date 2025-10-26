import React, { useMemo, useState } from "react";
import "./../subscribestyles/subscribe.css";

const PLANS = [
  { id: "pack_10", dollars: 10, credits: 50, badge: "Starter" },
  { id: "pack_50", dollars: 50, credits: 270, badge: "Most popular" },
  { id: "pack_100", dollars: 100, credits: 600, badge: "Best value" },
];

export default function Subscribe() {
  const [selected, setSelected] = useState("pack_50");
  const [loading, setLoading] = useState(false);

  const selectedPlan = useMemo(
    () => PLANS.find((p) => p.id === selected),
    [selected]
  );

  const fmtMoney = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }),
    []
  );

  const pricePerCredit = (p) => p.dollars / p.credits;

  const handleCheckout = async () => {
    try {
      setLoading(true);

      const stored = JSON.parse(localStorage.getItem("user"));
const userId = stored?._id || stored?.user?._id || stored?.data?._id;

      console.log("🔹 Extracted userId:", userId);

      if (!userId) {
        alert("User not found — please log in again before purchasing credits.");
        setLoading(false);
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/stripe/create-checkout-session`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: selected,
            userId,
          }),
        }
      );

      const data = await res.json();
      console.log("🔹 Checkout session response:", data);

      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
      } else {
        alert("Failed to create checkout session.");
      }
    } catch (err) {
      console.error("❌ Checkout error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sub-page sub2 gradient-bg">
      <header className="sub2-header">
        <h1 className="brand-title">DigiStav | Validorix</h1>
        <h2 className="page-title">Choose a credit pack</h2>
        <p className="page-subtitle">
          Buy credits once — use them anytime across DigiStav | Validorix.
        </p>
      </header>

      <div className="sub2-shell">
        <section className="sub2-grid">
          {PLANS.map((p) => {
            const active = p.id === selected;
            return (
              <button
                key={p.id}
                className={`sub2-card ${active ? "is-active" : ""}`}
                onClick={() => setSelected(p.id)}
              >
                {p.badge && <span className="sub2-badge">{p.badge}</span>}

                <div className="sub2-topline">
                  <div className="sub2-price">
                    {fmtMoney.format(p.dollars)}
                    <span className="sub2-price-sub">one-time</span>
                  </div>
                  <div className="sub2-credits">
                    <span className="sub2-credits-num">{p.credits}</span>
                    <span className="sub2-credits-label">credits</span>
                  </div>
                </div>

                <ul className="sub2-features">
                  <li>~ {pricePerCredit(p).toFixed(2)} $ / credit</li>
                  <li>No expiry — use anytime</li>
                  <li>Includes priority processing</li>
                </ul>

                <div className="sub2-radio">
                  <span className={`dot ${active ? "on" : ""}`} />
                  <span>{active ? "Selected" : "Select"}</span>
                </div>
              </button>
            );
          })}
        </section>

        <footer className="sub2-cta">
          <div className="sub2-recap">
            <strong>{selectedPlan.credits} credits</strong> for{" "}
            <strong>{fmtMoney.format(selectedPlan.dollars)}</strong>
            <span className="muted">
              &nbsp;(~{pricePerCredit(selectedPlan).toFixed(2)} $/credit)
            </span>
          </div>
          <button
            className="sub2-btn"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? "Redirecting..." : "Continue to checkout"}
          </button>
        </footer>
      </div>
    </div>
  );
}
