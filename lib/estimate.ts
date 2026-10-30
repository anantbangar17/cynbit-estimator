import pricing from "./pricing.json";

export type EstimateInput = { projectType: string; features: string[]; timeline: string };
export type Estimate = {
  priceMin: number; priceMax: number; daysMin: number; daysMax: number;
  lines: { label: string; price: number }[];
};

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/** Pure function: same input always gives the same output. Throws on unknown ids. */
export function calculateEstimate(input: EstimateInput, config = pricing): Estimate {
  const type = config.projectTypes.find((t) => t.id === input.projectType);
  if (!type) throw new Error(`Unknown project type: ${input.projectType}`);
  const timeline = config.timelines.find((t) => t.id === input.timeline);
  if (!timeline) throw new Error(`Unknown timeline: ${input.timeline}`);

  const unique = Array.from(new Set(input.features));
  const chosen = unique.map((id) => {
    const f = config.features.find((x) => x.id === id);
    if (!f) throw new Error(`Unknown feature: ${id}`);
    return f;
  });

  const basePrice = type.price + chosen.reduce((s, f) => s + f.price, 0);
  const baseDays = type.days + chosen.reduce((s, f) => s + f.days, 0);
  const price = basePrice * timeline.priceFactor;
  const days = baseDays * timeline.daysFactor;

  const lines = [
    { label: type.label, price: type.price },
    ...chosen.map((f) => ({ label: f.label, price: f.price })),
  ];
  if (timeline.priceFactor !== 1) {
    lines.push({ label: `${timeline.label} timeline adjustment`, price: Math.round(price - basePrice) });
  }

  const s = config.rangeSpread;
  return {
    priceMin: roundTo(price * (1 - s), 1000),
    priceMax: roundTo(price * (1 + s), 1000),
    daysMin: Math.max(1, Math.round(days * (1 - s))),
    daysMax: Math.max(1, Math.round(days * (1 + s))),
    lines,
  };
}

export const formatINR = (n: number) => "₹" + n.toLocaleString("en-IN");
