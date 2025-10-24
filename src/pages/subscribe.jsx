// src/pages/Subscribe.jsx
import React, { useMemo, useState } from "react";
import "./../subscribestyles/subscribe.css";

export default function Subscribe() {
  // ----- Step state -----
  const [step, setStep] = useState(1); // 1..3

  // ----- Step 1: Plan controls -----
  const [months, setMonths] = useState(8);               // plan term
  const [amount, setAmount] = useState(179.08);          // monthly price
  const [payDay, setPayDay] = useState("Last day");      // dropdown

  // Slider bounds for the monthly amount
  const MIN = 29, MAX = 299;

  // Formatters
  const fmt = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }),
    []
  );

  // ----- Step 2: Payment method -----
  const [method, setMethod] = useState({
    type: "bank",
    id: "bank-1",
    label: "Chase Checking •1234",
    sub: "Balance: $4,218.70",
  });

  const banks = [
    { id: "bank-1", type: "bank", label: "Chase Checking •1234", sub: "Balance: $4,218.70" },
  ];
  const cards = [
    { id: "visa-5678", type: "card", label: "Visa •5678", sub: "Expires 09/28" },
    { id: "mc-9123", type: "card", label: "Mastercard •9123", sub: "Expires 06/29" },
  ];

  // ----- Step 3: Derived review info -----
  const firstPayment = useMemo(() => fmt.format(amount), [amount, fmt]);
  const planEndsOn = useMemo(() => {
    const now = new Date();
    // end date ≈ now + months
    const end = new Date(now.getFullYear(), now.getMonth() + months, 0);
    return end.toLocaleDateString();
  }, [months]);

  const handleContinue = () => setStep((s) => Math.min(3, s + 1));
  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  // (You will wire this to Stripe Checkout later)
  const handleConfirm = () => {
    // Placeholder submit
    alert(
      `Confirming subscription:\n$${amount.toFixed(2)}/mo • ${months} months\n` +
      `Pay on: ${payDay}\nMethod: ${method.label}`
    );
  };

  return (
    <div className="sub-page">
      <div className="sub-shell">
        {/* Top brand bar (optional) */}
        <div className="sub-brand">
          <div className="sub-logo" />
          <span className="sub-brand-name">MountainBase</span>
        </div>

        {/* Mobile card frame */}
        <div className="sub-card">
          {/* card header */}
          <div className="sub-card-head">
            <div className="sub-step">STEP {step} OF 3</div>
            <button className="sub-menu" aria-label="menu">⋯</button>
          </div>

          {step === 1 && (
            <>
              <h2 className="sub-title">How much would you like to pay each month?</h2>

              <div className="price-readout">
                <div className="price">{fmt.format(amount)}</div>
                <div className="price-sub">PER MONTH FOR {months} MONTHS</div>
              </div>

              <div className="control-row">
                <label className="ctrl-label">Term</label>
                <div className="term-pill">
                  <button
                    className={`pill ${months === 6 ? "on" : ""}`}
                    onClick={() => setMonths(6)}
                    type="button"
                  >
                    6 mo
                  </button>
                  <button
                    className={`pill ${months === 8 ? "on" : ""}`}
                    onClick={() => setMonths(8)}
                    type="button"
                  >
                    8 mo
                  </button>
                  <button
                    className={`pill ${months === 12 ? "on" : ""}`}
                    onClick={() => setMonths(12)}
                    type="button"
                  >
                    12 mo
                  </button>
                </div>
              </div>

              <div className="slider-wrap">
                <input
                  type="range"
                  min={MIN}
                  max={MAX}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
                <div className="slider-scale">
                  <span>MIN</span>
                  <span>MAX</span>
                </div>
              </div>

              <div className="control-row">
                <label className="ctrl-label">When would you like to pay each month?</label>
                <div className="select-wrap">
                  <select
                    value={payDay}
                    onChange={(e) => setPayDay(e.target.value)}
                    aria-label="Billing day"
                  >
                    <option>1st</option>
                    <option>15th</option>
                    <option>Last day</option>
                  </select>
                </div>
              </div>

              <p className="meta-note">
                Your final payment will be on&nbsp;
                <strong>{planEndsOn}</strong>.
              </p>

              <div className="cta-row">
                <button className="btn-primary" onClick={handleContinue}>Continue</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="sub-title">How would you like to pay?</h2>

              <div className="list-head">
                <span>Saved banks</span>
                <button className="link-btn" type="button">Add new</button>
              </div>
              <div className="method-list">
                {banks.map((b) => (
                  <label key={b.id} className="method-item">
                    <input
                      type="radio"
                      name="method"
                      checked={method.id === b.id}
                      onChange={() => setMethod(b)}
                    />
                    <div className="method-icon bank" />
                    <div className="method-meta">
                      <div className="m-title">{b.label}</div>
                      <div className="m-sub">{b.sub}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="list-head">
                <span>Saved cards</span>
                <button className="link-btn" type="button">Add new</button>
              </div>
              <div className="method-list">
                {cards.map((c) => (
                  <label key={c.id} className="method-item">
                    <input
                      type="radio"
                      name="method"
                      checked={method.id === c.id}
                      onChange={() => setMethod(c)}
                    />
                    <div className={`method-icon card ${c.id.startsWith("visa") ? "visa" : "mc"}`} />
                    <div className="method-meta">
                      <div className="m-title">{c.label}</div>
                      <div className="m-sub">{c.sub}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="cta-row split">
                <button className="btn-ghost" onClick={handleBack}>Back</button>
                <button className="btn-primary" onClick={handleContinue}>Continue</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="sub-title">Review your plan details</h2>

              <div className="review-block">
                <div className="review-row">
                  <div className="r-head">Plan terms</div>
                  <button className="link-btn sm" onClick={() => setStep(1)}>Edit ▸</button>
                </div>
                <div className="review-grid">
                  <div className="r-k">Term</div>
                  <div className="r-v">{months} months</div>
                  <div className="r-k">Payment</div>
                  <div className="r-v">{fmt.format(amount)}/mo</div>
                  <div className="r-k">Payment date</div>
                  <div className="r-v">{payDay} of each month</div>
                </div>

                <div className="review-row space">
                  <div className="r-head">Payment method</div>
                  <button className="link-btn sm" onClick={() => setStep(2)}>Edit ▸</button>
                </div>
                <div className="method-inline">
                  <div className={`method-icon sm ${method.type === "bank" ? "bank" : "card"}`} />
                  <div className="m-title">{method.label}</div>
                </div>
              </div>

              <p className="confirm-note">
                By confirming, you agree to make your first payment of <strong>{firstPayment}</strong> today.
                Your next payment will be on the last day of every month thereafter for the duration
                of your selected term. Your final payment will be on <strong>{planEndsOn}</strong>.
              </p>

              <div className="cta-row split">
                <button className="btn-ghost" onClick={handleBack}>Back</button>
                <button className="btn-primary" onClick={handleConfirm}>Confirm &amp; pay</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
