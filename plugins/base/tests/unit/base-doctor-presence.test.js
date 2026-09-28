import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// PLUGINS_NM and LOCKFILE are computed from $HOME at module import time, so
// every test stubs HOME first and re-imports the module fresh.
async function importWithHome(home) {
  vi.stubEnv("HOME", home);
  vi.resetModules();
  return import("../../extensions/base-doctor.js");
}

const tmp = mkdtempSync(join(tmpdir(), "base-doctor-test-"));

function makeHome(lockJson) {
  const home = join(tmp, `home-${Math.random().toString(36).slice(2)}`);
  mkdirSync(join(home, ".omp", "plugins"), { recursive: true });
  if (lockJson !== undefined) {
    writeFileSync(join(home, ".omp", "plugins", "omp-plugins.lock.json"), lockJson);
  }
  return home;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("readLockfile", () => {
  it("returns the parsed lockfile when present", async () => {
    const home = makeHome(JSON.stringify({ plugins: { "some-plugin": {} } }));
    const { readLockfile } = await importWithHome(home);
    expect(await readLockfile()).toEqual({ plugins: { "some-plugin": {} } });
  });

  it("returns an empty plugin map for a missing lockfile", async () => {
    const home = makeHome(undefined);
    const { readLockfile } = await importWithHome(home);
    expect(await readLockfile()).toEqual({ plugins: {} });
  });

  it("returns an empty plugin map for a corrupt lockfile", async () => {
    const home = makeHome("{not json");
    const { readLockfile } = await importWithHome(home);
    expect(await readLockfile()).toEqual({ plugins: {} });
  });
});

describe("pluginPresent", () => {
  it("is false when the lockfile lacks the entry", async () => {
    const home = makeHome(JSON.stringify({ plugins: {} }));
    const { pluginPresent } = await importWithHome(home);
    expect(pluginPresent("pkg-a", { plugins: {} })).toBe(false);
  });

  it("is false when the lockfile has the entry but node_modules does not", async () => {
    const home = makeHome(JSON.stringify({ plugins: { "pkg-a": {} } }));
    const { pluginPresent } = await importWithHome(home);
    expect(pluginPresent("pkg-a", { plugins: { "pkg-a": {} } })).toBe(false);
  });

  it("is false when node_modules has the dir but the lockfile lacks the entry", async () => {
    const home = makeHome(JSON.stringify({ plugins: {} }));
    mkdirSync(join(home, ".omp", "plugins", "node_modules", "pkg-a"), { recursive: true });
    const { pluginPresent } = await importWithHome(home);
    expect(pluginPresent("pkg-a", { plugins: {} })).toBe(false);
  });

  it("is true when both the lockfile entry and node_modules dir exist", async () => {
    const home = makeHome(JSON.stringify({ plugins: { "pkg-a": {} } }));
    mkdirSync(join(home, ".omp", "plugins", "node_modules", "pkg-a"), { recursive: true });
    const { pluginPresent } = await importWithHome(home);
    expect(pluginPresent("pkg-a", { plugins: { "pkg-a": {} } })).toBe(true);
  });
});
