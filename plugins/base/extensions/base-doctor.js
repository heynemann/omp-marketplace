// Base plugin self-setup + doctor.
//
// - Auto-installs required omp plugins once per process when missing.
// - `/base-doctor` verifies envs, required plugins, the hypa binary, bundled
//   skills, and OpenRouter API reachability.

import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";

// npm packages omp must have. Installed via `omp plugin install <spec>` when
// missing from ~/.omp/plugins (lockfile + node_modules).
const REQUIRED_PLUGINS = [
  { name: "@kryoz/caveman-plugin", spec: "@kryoz/caveman-plugin" },
  { name: "@dietrichgebert/ponytail", spec: "@dietrichgebert/ponytail" },
  { name: "@hypabolic/pi-hypa", spec: "npm:@hypabolic/pi-hypa" },
];

const LOCKFILE = `${process.env.HOME}/.omp/plugins/omp-plugins.lock.json`;
const PLUGINS_NM = `${process.env.HOME}/.omp/plugins/node_modules`;

async function readLockfile() {
  try {
    return JSON.parse(await readFile(LOCKFILE, "utf8"));
  } catch {
    return { plugins: {} };
  }
}

function pluginPresent(name, lock) {
  if (!lock?.plugins?.[name]) return false;
  try {
    statSync(`${PLUGINS_NM}/${name}`);
    return true;
  } catch {
    return false;
  }
}

function runOmp(spec) {
  return new Promise((resolve) => {
    execFile("omp", ["plugin", "install", spec], { timeout: 180_000 }, (err, stdout, stderr) => {
      resolve({ ok: !err, out: `${stdout}${stderr}`.trim() });
    });
  });
}

function which(cmd) {
  return new Promise((resolve) => {
    execFile("which", [cmd], { timeout: 5_000 }, (err, stdout) => resolve(err ? null : stdout.trim()));
  });
}

async function installMissingPlugins(pi, ctx) {
  const lock = await readLockfile();
  for (const req of REQUIRED_PLUGINS) {
    if (pluginPresent(req.name, lock)) continue;
    const res = await runOmp(req.spec);
    if (res.ok) {
      pi.logger?.info?.(`base: installed ${req.spec} — restart or /reload-plugins to activate`);
      ctx?.ui?.notify?.(`base: installed ${req.spec}. Restart omp (or /reload-plugins) to activate.`, "info");
    } else {
      pi.logger?.warn?.(`base: failed to install ${req.spec}: ${res.out}`);
      ctx?.ui?.notify?.(`base: failed to install ${req.spec}. Run: omp plugin install ${req.spec}`, "warning");
    }
  }
}

export default function baseDoctorExtension(pi) {
  let lastCtx = null;

  pi.on("session_start", async (_event, ctx) => {
    if (ctx) lastCtx = ctx;
    // Process-level guard: several sessions may rebind this factory.
    const G = globalThis;
    if (G.__ompBaseSetupDone) return;
    G.__ompBaseSetupDone = true;
    // Fire-and-forget: never block or crash session start.
    installMissingPlugins(pi, ctx).catch((e) => pi.logger?.warn?.(`base: setup error: ${e?.message || e}`));
  });

  async function doctor(ctx) {
    const lines = [];
    const push = (ok, label, detail = "") =>
      lines.push(`${ok ? "✔" : "✘"} ${label}${detail ? ` — ${detail}` : ""}`);

    // 1) envs
    push(Boolean(process.env.OPENROUTER_API_KEY), "OPENROUTER_API_KEY",
      process.env.OPENROUTER_API_KEY ? "set" : "missing — toolbar stays hidden");

    // 2) required plugins
    const lock = await readLockfile();
    for (const req of REQUIRED_PLUGINS) {
      const ok = pluginPresent(req.name, lock);
      push(ok, `plugin ${req.name}`, ok ? "installed" : `missing — run: omp plugin install ${req.spec}`);
    }

    // 3) hypa binary — PATH first, then the shim pi-hypa installs under the
    // omp plugins dir (works, but a real `hypa init` install is preferable)
    let hypaPath = await which("hypa");
    if (!hypaPath) {
      try {
        const shim = `${PLUGINS_NM}/.bin/hypa`;
        statSync(shim);
        hypaPath = shim;
      } catch {}
    }
    push(Boolean(hypaPath), "hypa binary", hypaPath || "not found — run: hypa init --agent omp");

    // 4) bundled skills
    let skillCount = 0;
    try {
      const skillsDir = fileURLToPath(new URL("../skills/", import.meta.url));
      skillCount = (await readdir(skillsDir)).length;
    } catch {}
    push(skillCount >= 79, "bundled skills", `${skillCount} skill dirs`);

    // 5) OpenRouter API reachability (only with a key)
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/credits", {
          headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
          signal: AbortSignal.timeout(8_000),
        });
        push(res.ok, "OpenRouter API", res.ok ? "reachable" : `HTTP ${res.status}`);
      } catch (e) {
        push(false, "OpenRouter API", String(e?.message || e));
      }
    }

    const failed = lines.filter((l) => l.startsWith("✘")).length;
    for (const line of lines) ctx?.ui?.notify?.(line, "info");
    ctx?.ui?.notify?.(
      failed === 0 ? "base-doctor: all checks passed." : `base-doctor: ${failed} check(s) failed.`,
      failed === 0 ? "info" : "warning",
    );
    return { lines, failed };
  }

  pi.registerCommand("base-doctor", {
    description: "Verify base plugin envs, plugins, binaries, and API reachability",
    handler: async (_args, ctx) => {
      await doctor(ctx);
    },
  });

  return { doctor };
}
