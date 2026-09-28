import { describe, expect, it } from "vitest";
import { fmtUsd } from "../../extensions/openrouter-usage.js";

describe("fmtUsd", () => {
  it('renders non-finite values as "?"', () => {
    expect(fmtUsd(Number.NaN)).toBe("?");
    expect(fmtUsd(Number.POSITIVE_INFINITY)).toBe("?");
    expect(fmtUsd(Number.NEGATIVE_INFINITY)).toBe("?");
    expect(fmtUsd(undefined)).toBe("?");
  });

  it("formats thousands with one decimal and a k suffix", () => {
    expect(fmtUsd(1000)).toBe("$1.0k");
    expect(fmtUsd(1234.5)).toBe("$1.2k");
    expect(fmtUsd(123456)).toBe("$123.5k");
  });

  it("rounds the hundreds band to whole dollars", () => {
    expect(fmtUsd(100)).toBe("$100");
    expect(fmtUsd(123.4)).toBe("$123");
    expect(fmtUsd(999)).toBe("$999");
  });

  it("formats amounts below 100 with two decimals", () => {
    expect(fmtUsd(0)).toBe("$0.00");
    expect(fmtUsd(42.5)).toBe("$42.50");
    expect(fmtUsd(99.99)).toBe("$99.99");
  });
});
