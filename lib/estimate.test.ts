import { describe, it, expect } from "vitest";
import { calculateEstimate } from "./estimate";

describe("calculateEstimate", () => {
  it("prices a plain website with no extras", () => {
    const e = calculateEstimate({ projectType: "website", features: [], timeline: "standard" });
    expect(e.priceMin).toBe(21000); // 25000 * 0.85
    expect(e.priceMax).toBe(29000); // 25000 * 1.15 = 28750 -> 29000
    expect(e.lines).toHaveLength(1);
  });
  it("adds feature prices", () => {
    const e = calculateEstimate({ projectType: "website", features: ["auth", "blog"], timeline: "standard" });
    expect(e.priceMin).toBe(43000); // 50000 * 0.85 = 42500 -> 43000
    expect(e.lines).toHaveLength(3);
  });
  it("fast track costs more and takes fewer days", () => {
    const std = calculateEstimate({ projectType: "webapp", features: ["admin"], timeline: "standard" });
    const fast = calculateEstimate({ projectType: "webapp", features: ["admin"], timeline: "fast" });
    expect(fast.priceMax).toBeGreaterThan(std.priceMax);
    expect(fast.daysMax).toBeLessThan(std.daysMax);
  });
  it("ignores duplicate features", () => {
    const a = calculateEstimate({ projectType: "website", features: ["seo", "seo"], timeline: "standard" });
    const b = calculateEstimate({ projectType: "website", features: ["seo"], timeline: "standard" });
    expect(a).toEqual(b);
  });
  it("rejects unknown ids", () => {
    expect(() => calculateEstimate({ projectType: "x", features: [], timeline: "standard" })).toThrow();
    expect(() => calculateEstimate({ projectType: "website", features: ["nope"], timeline: "standard" })).toThrow();
    expect(() => calculateEstimate({ projectType: "website", features: [], timeline: "nope" })).toThrow();
  });
});
