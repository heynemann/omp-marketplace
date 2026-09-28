import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdirSync, mkdtempSync, copyFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// base-doctor.js reads LOCKFILE/PLUGINS_NM from $HOME at import time, so every
// test stubs HOME and re-imports the module fresh. doctor() hangs off the
// default-exported extension factory's return value.
async function importWithHome(home) {
  vi.stubEnv("HOME", home);
  vi.resetModules();
  const mod = await import("../../extensions/base-doctor.js");
  return mod.default({ on: () => {}, registerCommand: () => {} });
}

const REQUIRED = ["@kryoz/caveman-plugin", "@dietrichgebert/ponytail", "@hypabolic/pi-hypa"];

function makeHome({ lock = true, pluginDirs = true, hypaShim = true } = {}) {
  const home = mkdtempSync(join(tmpdir(), "base-doctor-aggr-"));
  const pluginsDir = join(home, ".omp", "plugins");
  mkdirSync(pluginsDir, { recursive: true });
  if (lock) {
    const plugins = Object.fromEntries(REQUIRED.map((n) => [n, {}]));
    writeFileSync(join(pluginsDir, "omp-plugins.lock.json"), JSON.stringify({ plugins }));
  }
  if (pluginDirs) {
    for (const n of REQUIRED) mkdirSync(join(pluginsDir, "node_modules", n), { recursive: true });
  }
  if (hypaShim) {
    mkdirSync(join(pluginsDir, "node_modules", ".bin"), { recursive: true });
    writeFileSync(join(pluginsDir, "node_modules", ".bin", "hypa"), "#!/bin/sh\n");
  }
  return home;
}

function makeCtx() {
  const lines = [];
  return { lines, ui: { notify: (line) => lines.push(line) } };
}

const stubFetchOk = () =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, status: 200 })),
  );

function assertHealthy(lines) {
  const checks = lines.filter((l) => /^[✔✘]/.test(l));
  expect(checks.some((l) => l.startsWith("✔ OPENROUTER_API_KEY"))).toBe(true);
  expect(checks.some((l) => l.startsWith("✔ hypa binary"))).toBe(true);
  expect(checks.filter((l) => l.startsWith("✔ plugin ")).length).toBe(3);
  expect(checks.some((l) => l.startsWith("✔ bundled skills"))).toBe(true);
  expect(checks.some((l) => l.startsWith("✔ OpenRouter API"))).toBe(true);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("doctor() check aggregation", () => {
  it("runs every check and reports zero failures on a healthy setup", async () => {
    const { doctor } = await importWithHome(makeHome());
    vi.stubEnv("OPENROUTER_API_KEY", "k");
    stubFetchOk();
    const ctx = makeCtx();
    const { lines, failed } = await doctor(ctx);
    expect(failed).toBe(0);
    expect(ctx.lines.at(-1)).toBe("base-doctor: all checks passed.");
    assertHealthy(lines);
  });

  it("marks a missing API key as a failed check", async () => {
    const { doctor } = await importWithHome(makeHome());
    vi.stubEnv("OPENROUTER_API_KEY", "");
    stubFetchOk();
    const ctx = makeCtx();
    const { lines, failed } = await doctor(ctx);
    const envLine = lines.find((l) => l.startsWith("✘ OPENROUTER_API_KEY"));
    expect(envLine).toBeTruthy();
    expect(failed).toBe(1);
    expect(ctx.lines.at(-1)).toBe("base-doctor: 1 check(s) failed.");
  });

  it("marks a missing required plugin as failed and counts it", async () => {
    const { doctor } = await importWithHome(makeHome({ lock: false, pluginDirs: false }));
    vi.stubEnv("OPENROUTER_API_KEY", "k");
    stubFetchOk();
    const ctx = makeCtx();
    const { lines, failed } = await doctor(ctx);
    const missing = lines.filter((l) => l.startsWith("✘ plugin "));
    expect(missing.length).toBe(3);
    expect(failed).toBe(3);
    expect(ctx.lines.at(-1)).toBe("base-doctor: 3 check(s) failed.");
  });

  it("falls back to the bundled hypa shim when hypa is not on PATH", async () => {
    const { doctor } = await importWithHome(makeHome());
    vi.stubEnv("PATH", "");
    vi.stubEnv("OPENROUTER_API_KEY", "k");
    stubFetchOk();
    const { lines, failed } = await doctor(makeCtx());
    const hypaLine = lines.find((l) => l.startsWith("✔ hypa binary"));
    expect(hypaLine).toBeTruthy();
    expect(hypaLine).toContain(".bin/hypa");
    expect(failed).toBe(0);
  });

  it("reports hypa missing when neither PATH nor the shim has it", async () => {
    const { doctor } = await importWithHome(makeHome({ hypaShim: false }));
    vi.stubEnv("PATH", "");
    vi.stubEnv("OPENROUTER_API_KEY", "k");
    stubFetchOk();
    const ctx = makeCtx();
    const { lines, failed } = await doctor(ctx);
    const hypaLine = lines.find((l) => l.startsWith("✘ hypa binary"));
    expect(hypaLine).toBeTruthy();
    expect(hypaLine).toContain("not found");
    expect(failed).toBe(1);
  });

  it("counts two independent failures together", async () => {
    const { doctor } = await importWithHome(makeHome({ hypaShim: false }));
    vi.stubEnv("PATH", "");
    vi.stubEnv("OPENROUTER_API_KEY", "");
    stubFetchOk();
    const ctx = makeCtx();
    const { failed } = await doctor(ctx);
    expect(failed).toBe(2);
  });

  it("keeps the bundled-skills check green at exactly 79 skill dirs", async () => {
    // Copy the extension next to a fixture skills dir so the count is exactly
    // the documented threshold — the repo's real dir can drift above it.
    const fixture = mkdtempSync(join(tmpdir(), "base-doctor-skills-"));
    mkdirSync(join(fixture, "extensions"), { recursive: true });
    mkdirSync(join(fixture, "skills"), { recursive: true });
    for (let i = 0; i < 79; i++) mkdirSync(join(fixture, "skills", `skill-${i}`));
    copyFileSync(
      new URL("../../extensions/base-doctor.js", import.meta.url),
      join(fixture, "extensions", "base-doctor.js"),
    );
    vi.stubEnv("HOME", makeHome());
    vi.stubEnv("PATH", "");
    vi.stubEnv("OPENROUTER_API_KEY", "");
    vi.resetModules();
    const mod = await import(`${fixture}/extensions/base-doctor.js`);
    const { doctor } = mod.default({ on: () => {}, registerCommand: () => {} });
    const { lines, failed } = await doctor(makeCtx());
    const skillsLine = lines.find((l) => l.includes("bundled skills"));
    expect(skillsLine).toMatch(/^✔ bundled skills — 79 skill dirs$/);
    expect(failed).toBe(1); // only the env check fails here
    vi.stubEnv("HOME", process.env.HOME);
  });
});
