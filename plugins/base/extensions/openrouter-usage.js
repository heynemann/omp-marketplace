// OpenRouter spend toolbar for omp.
// Shows month-to-date spend and remaining credits in the status bar.
//
// Sources (OpenRouter API, Bearer-keyed):
//   GET /api/v1/credits -> { data: { total_credits, total_usage } }
//   GET /api/v1/key     -> { data: { usage_monthly, limit_remaining, limit, limit_reset } }
//
// The /key "usage_monthly" figure is per-key and tracks the key's reset
// window, not the calendar month. When the key reports usage_monthly we show
// it as "this month"; "left" is always the account balance
// (total_credits - total_usage), falling back to limit_remaining only when
// the credits endpoint gave nothing usable.

const REFRESH_MS = 10 * 60 * 1000; // 10 min
const CREDITS_URL = "https://openrouter.ai/api/v1/credits";
const KEY_URL = "https://openrouter.ai/api/v1/key";

export function fmtUsd(v) {
  if (!Number.isFinite(v)) return "?";
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  if (v >= 100) return `$${Math.round(v)}`;
  return `$${v.toFixed(2)}`;
}

export function pickMonthUsage(data) {
  // Prefer an explicit calendar-month number when the API grows one; fall
  // back to the key's reset-window monthly usage.
  for (const k of ["usage_month_calendar", "usage_monthly_calendar", "usage_month"]) {
    if (Number.isFinite(data?.[k])) return data[k];
  }
  if (Number.isFinite(data?.usage_monthly)) return data.usage_monthly;
  return null;
}

export default function openrouterUsageExtension(pi) {
  let lastCtx = null;
  let timer = null;
  let inflight = false;

  async function refresh(ctx) {
    if (ctx) lastCtx = ctx;
    const c = ctx || lastCtx;
    if (!c?.ui?.setStatus || inflight) return;
    inflight = true;
    try {
      const key = process.env.OPENROUTER_API_KEY;
      if (!key) {
        c.ui.setStatus("openrouter", "");
        return;
      }
      const headers = { Authorization: `Bearer ${key}` };
      const [creditsRes, keyRes] = await Promise.all([
        fetch(CREDITS_URL, { headers, signal: AbortSignal.timeout(10_000) }),
        fetch(KEY_URL, { headers, signal: AbortSignal.timeout(10_000) }),
      ]);
      if (!creditsRes.ok) return;
      const credits = (await creditsRes.json())?.data ?? {};
      const keyData = keyRes.ok ? ((await keyRes.json())?.data ?? {}) : {};

      const totalCredits = Number(credits.total_credits);
      const totalUsage = Number(credits.total_usage);
      const monthly = pickMonthUsage(keyData);
      const limitRemaining = Number(keyData.limit_remaining);

      let text;
      if (Number.isFinite(monthly)) {
        // "left" is the account balance; the key's limit_remaining is only a
        // fallback when the credits endpoint gave nothing usable.
        const left =
          Number.isFinite(totalCredits) && Number.isFinite(totalUsage)
            ? Math.max(0, totalCredits - totalUsage)
            : Number.isFinite(limitRemaining)
              ? limitRemaining
              : null;
        text = `⚡ ${fmtUsd(monthly)} this month`;
        if (Number.isFinite(left)) text += ` • ${fmtUsd(left)} left`;
      } else if (Number.isFinite(totalCredits) && Number.isFinite(totalUsage)) {
        text = `⚡ ${fmtUsd(totalUsage)} spent • ${fmtUsd(Math.max(0, totalCredits - totalUsage))} left`;
      } else {
        return;
      }
      c.ui.setStatus("openrouter", text);
    } catch {
      // Network/auth errors: keep the last good status, retry on next tick.
    } finally {
      inflight = false;
    }
  }

  pi.on("session_start", async (_event, ctx) => {
    if (timer) return; // factories rebind per subagent; keep one timer per process surface
    timer = ctx.setInterval(() => refresh(), REFRESH_MS);
    await refresh(ctx);
  });

  pi.registerCommand("openrouter", {
    description: "Show OpenRouter spend and remaining credits now",
    handler: async (_args, ctx) => {
      await refresh(ctx);
      ctx?.ui?.notify?.("OpenRouter status refreshed.", "info");
    },
  });
}
