import { afterEach, describe, expect, it, vi } from "vitest";
import openrouterUsageExtension from "../../extensions/openrouter-usage.js";

function makePi() {
  const handlers = {};
  const commands = {};
  return {
    handlers,
    commands,
    on: (name, fn) => {
      handlers[name] = fn;
    },
    registerCommand: (name, cmd) => {
      commands[name] = cmd;
    },
  };
}

function makeCtx() {
  const calls = [];
  return {
    calls,
    ui: {
      setStatus: (name, text) => calls.push([name, text]),
    },
    setInterval: () => 1,
  };
}

const creditsOk = (total_credits, total_usage) => ({
  ok: true,
  json: async () => ({ data: { total_credits, total_usage } }),
});
const keyOk = (data) => ({ ok: true, json: async () => ({ data }) });
const stubFetch = (credits, key) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url) => (String(url).includes("/credits") ? creditsOk(...credits) : keyOk(key))),
  );

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("refresh() status-text composition", () => {
  it("shows monthly spend and account balance when both are known", async () => {
    stubFetch([1000, 200], { usage_monthly: 44, limit_remaining: 60 });
    vi.stubEnv("OPENROUTER_API_KEY", "k");
    const pi = makePi();
    openrouterUsageExtension(pi);
    const ctx = makeCtx();
    await pi.handlers.session_start({}, ctx);
    // "left" is the account balance (1000 - 200 = 800), not the key's
    // limit_remaining (60) — the key quota resets and never reflects balance.
    expect(ctx.calls.at(-1)).toEqual(["openrouter", "⚡ $44.00 this month • $800 left"]);
  });

  it("falls back to the key limit remainder when the credits endpoint gives nothing", async () => {
    stubFetch([undefined, undefined], { usage_monthly: 44, limit_remaining: 30 });
    vi.stubEnv("OPENROUTER_API_KEY", "k");
    const pi = makePi();
    openrouterUsageExtension(pi);
    const ctx = makeCtx();
    await pi.handlers.session_start({}, ctx);
    expect(ctx.calls.at(-1)[1]).toBe("⚡ $44.00 this month • $30.00 left");
  });

  it("shows only the monthly figure when neither limit nor lifetime data exists", async () => {
    stubFetch([undefined, undefined], { usage_monthly: 44 });
    vi.stubEnv("OPENROUTER_API_KEY", "k");
    const pi = makePi();
    openrouterUsageExtension(pi);
    const ctx = makeCtx();
    await pi.handlers.session_start({}, ctx);
    expect(ctx.calls.at(-1)[1]).toBe("⚡ $44.00 this month");
  });

  it("shows lifetime spend and clamped remainder without monthly data", async () => {
    stubFetch([300, 500], {});
    vi.stubEnv("OPENROUTER_API_KEY", "k");
    const pi = makePi();
    openrouterUsageExtension(pi);
    const ctx = makeCtx();
    await pi.handlers.session_start({}, ctx);
    expect(ctx.calls.at(-1)[1]).toBe("⚡ $500 spent • $0.00 left");
  });

  it("clears the status when no API key is set", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    const pi = makePi();
    openrouterUsageExtension(pi);
    const ctx = makeCtx();
    await pi.handlers.session_start({}, ctx);
    expect(ctx.calls.at(-1)).toEqual(["openrouter", ""]);
  });

  it("keeps the last good status when the API call fails", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "k");
    const pi = makePi();
    openrouterUsageExtension(pi);
    const ctx = makeCtx();
    stubFetch([1000, 200], { usage_monthly: 44, limit_remaining: 60 });
    await pi.handlers.session_start({}, ctx);
    const afterGood = ctx.calls.length;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    await pi.handlers.session_start({}, ctx);
    expect(ctx.calls.length).toBe(afterGood);
  });
});
