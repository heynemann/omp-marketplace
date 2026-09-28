import { describe, expect, it } from "vitest";
import { pickMonthUsage } from "../../extensions/openrouter-usage.js";

describe("pickMonthUsage", () => {
  it("prefers the calendar-month field over reset-window fields", () => {
    expect(
      pickMonthUsage({
        usage_month_calendar: 11,
        usage_monthly_calendar: 22,
        usage_month: 33,
        usage_monthly: 44,
      }),
    ).toBe(11);
  });

  it("falls back to usage_monthly_calendar, then usage_month, then usage_monthly, in order", () => {
    expect(pickMonthUsage({ usage_monthly_calendar: 22, usage_month: 33, usage_monthly: 44 })).toBe(22);
    expect(pickMonthUsage({ usage_month: 33, usage_monthly: 44 })).toBe(33);
    expect(pickMonthUsage({ usage_monthly: 44 })).toBe(44);
  });

  it("skips non-finite candidates instead of surfacing them", () => {
    expect(pickMonthUsage({ usage_month_calendar: Number.NaN, usage_month: 33 })).toBe(33);
    expect(pickMonthUsage({ usage_month_calendar: Number.POSITIVE_INFINITY, usage_month: 33 })).toBe(33);
    expect(pickMonthUsage({ usage_month: Number.NaN, usage_monthly: 44 })).toBe(44);
  });

  it("returns null when nothing usable is reported", () => {
    expect(pickMonthUsage({})).toBe(null);
    expect(pickMonthUsage({ usage_monthly: Number.NaN })).toBe(null);
    expect(pickMonthUsage({ usage_month_calendar: "12" })).toBe(null);
  });
});
