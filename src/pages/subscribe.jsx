import React, { useMemo, useState } from "react";
import "./../subscribestyles/subscribe.css";

const PLANS = [
  { id: "pack_10", dollars: 10, credits: 50, badge: "Starter" },
  { id: "pack_50", dollars: 50, credits: 270, badge: "Most popular" },
  { id: "pack_100", dollars: 100, credits: 600, badge: "Best value" },
];

export default function Subscribe() {
  const [selected, setSelected] = useState("pack_50");
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

  const handleCheckout = () => {
    const p = selectedPlan;
    alert(
      `Proceed to checkout:\n${p.credits} credits for ${fmtMoney.format(
        p.dollars
      )}\n(~${pricePerCredit(p).toFixed(2)} $/credit)`
    );
  };

  return (
    <div className="sub-page sub2 gradient-bg">
      {/* Top brand header */}
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
          <button className="sub2-btn" onClick={handleCheckout}>
            Continue to checkout
          </button>
        </footer>
      </div>
    </div>
  );
}
