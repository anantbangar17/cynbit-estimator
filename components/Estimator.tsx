"use client";
import { useMemo, useState } from "react";
import pricing from "@/lib/pricing.json";
import { calculateEstimate, formatINR } from "@/lib/estimate";

type Errors = Record<string, string[] | undefined>;
type Status = "idle" | "loading" | "success" | "error";

export default function Estimator() {
  const [projectType, setProjectType] = useState("website");
  const [features, setFeatures] = useState<string[]>([]);
  const [timeline, setTimeline] = useState("standard");
  const [form, setForm] = useState({ name: "", email: "", phone: "", website: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const est = useMemo(() => calculateEstimate({ projectType, features, timeline }), [projectType, features, timeline]);

  const toggle = (id: string) =>
    setFeatures((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading"); setErrors({}); setMessage("");
    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectType, features, timeline, ...form }),
      });
      const data = await res.json();
      if (res.ok) { setStatus("success"); return; }
      if (data.errors) setErrors(data.errors);
      setMessage(data.error ?? "Please fix the highlighted fields.");
      setStatus("error");
    } catch {
      setMessage("Network problem. Check your connection and try again.");
      setStatus("error");
    }
  }

  const err = (k: string) => errors[k]?.[0];

  return (
    <div className="grid">
      <div className="steps">
        <fieldset>
          <legend>What are you building?</legend>
          <div className="choices">
            {pricing.projectTypes.map((t) => (
              <label key={t.id} className={"choice" + (projectType === t.id ? " on" : "")}>
                <input type="radio" name="type" checked={projectType === t.id} onChange={() => setProjectType(t.id)} />
                <span className="c-title">{t.label}</span>
                <span className="c-hint">{t.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>What should it do?</legend>
          <div className="choices">
            {pricing.features.map((f) => (
              <label key={f.id} className={"choice" + (features.includes(f.id) ? " on" : "")}>
                <input type="checkbox" checked={features.includes(f.id)} onChange={() => toggle(f.id)} />
                <span className="c-title">{f.label}</span>
                <span className="c-hint">+{formatINR(f.price)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>How soon do you need it?</legend>
          <div className="choices">
            {pricing.timelines.map((t) => (
              <label key={t.id} className={"choice" + (timeline === t.id ? " on" : "")}>
                <input type="radio" name="timeline" checked={timeline === t.id} onChange={() => setTimeline(t.id)} />
                <span className="c-title">{t.label}</span>
                <span className="c-hint">{t.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <aside className="sheet" aria-live="polite">
        <h2>Your estimate</h2>
        <ul className="lines">
          {est.lines.map((l) => (
            <li key={l.label}>
              <span>{l.label}</span>
              <span>{l.price < 0 ? "−" : ""}{formatINR(Math.abs(l.price))}</span>
            </li>
          ))}
        </ul>
        <div className="total">
          <div className="range">{formatINR(est.priceMin)} to {formatINR(est.priceMax)}</div>
          <div className="days">About {est.daysMin} to {est.daysMax} working days</div>
        </div>

        {status === "success" ? (
          <div className="done" role="status">
            <strong>Request received.</strong>
            <p>We saved this estimate and will contact you within 24 hours to confirm details.</p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <p className="ask">Want this sent to you? Leave your details and a Cynbit engineer will follow up.</p>
            <label>Name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-invalid={!!err("name")} autoComplete="name" />
              {err("name") && <em>{err("name")}</em>}
            </label>
            <label>Email
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-invalid={!!err("email")} autoComplete="email" />
              {err("email") && <em>{err("email")}</em>}
            </label>
            <label>Mobile (optional)
              <input inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} aria-invalid={!!err("phone")} autoComplete="tel-national" />
              {err("phone") && <em>{err("phone")}</em>}
            </label>
            <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            {status === "error" && message && <p className="fail" role="alert">{message}</p>}
            <button disabled={status === "loading"}>{status === "loading" ? "Sending…" : "Send me this quote"}</button>
            <p className="fine">Indicative range only. The final quote follows a discovery call.</p>
          </form>
        )}
      </aside>
    </div>
  );
}
