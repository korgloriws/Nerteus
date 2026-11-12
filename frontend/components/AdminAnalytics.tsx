"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getApiUrl } from "../lib/api";

type Period = "day" | "week" | "month" | "year" | "custom";

type Overview = {
  period: string;
  start: string;
  end: string;
  totals: {
    views: number;
    unique_sessions: number;
    unique_posts: number;
    peak_hour: number | null;
    top_device: string | null;
    top_theme: string | null;
  };
  hourly: { hour: number; views: number }[];
  daily: { date: string; views: number }[];
  devices: { device: string; views: number }[];
  themes: { theme: string; views: number }[];
  surfaces: { surface: string; views: number }[];
  top_posts: {
    post_id: number;
    slug: string;
    title: string;
    weekday?: string | null;
    day_theme?: string | null;
    views: number;
  }[];
  top_posts_with_lifetime: {
    post_id: number;
    slug: string;
    title: string;
    views: number;
    lifetime_views: number;
  }[];
  theme_breakdown: {
    theme: string;
    views: number;
    posts: { post_id: number; slug: string; title: string; views: number }[];
  }[];
};

type Props = {
  token: string;
};

const PERIODS: { id: Period; label: string }[] = [
  { id: "day", label: "24h" },
  { id: "week", label: "7 dias" },
  { id: "month", label: "30 dias" },
  { id: "year", label: "1 ano" },
  { id: "custom", label: "Custom" },
];

const DEVICE_COLORS: Record<string, string> = {
  desktop: "#6366f1",
  mobile: "#22d3ee",
  tablet: "#a78bfa",
  unknown: "#64748b",
};

function formatHour(h: number) {
  return `${String(h).padStart(2, "0")}h`;
}

function useCountUp(target: number, active: boolean, duration = 700) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    if (!Number.isFinite(target) || target <= 0) {
      setValue(target || 0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return value;
}

function EmptyHint() {
  return <p className="text-sm text-muted py-6 text-center">Sem dados no período.</p>;
}

function BarChart({
  items,
  labelKey,
  valueKey,
  maxBars = 12,
  accent = "indigo",
  chartKey,
}: {
  items: Record<string, string | number>[];
  labelKey: string;
  valueKey: string;
  maxBars?: number;
  accent?: "indigo" | "cyan" | "violet";
  chartKey: string;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [chartKey]);

  const slice = items.slice(0, maxBars);
  const max = Math.max(1, ...slice.map((i) => Number(i[valueKey]) || 0));
  if (!slice.length) return <EmptyHint />;

  const fill =
    accent === "cyan"
      ? "from-cyan-400 to-indigo-500"
      : accent === "violet"
        ? "from-violet-400 to-indigo-600"
        : "from-indigo-400 to-indigo-600";

  return (
    <div className="space-y-2.5" key={chartKey}>
      {slice.map((item, i) => {
        const label = String(item[labelKey] ?? "");
        const value = Number(item[valueKey]) || 0;
        const pct = Math.round((value / max) * 100);
        return (
          <div
            key={label}
            className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-center text-sm group"
            style={{ animationDelay: `${i * 45}ms` }}
          >
            <div className="min-w-0">
              <div className="flex justify-between gap-2 mb-1">
                <span className="truncate text-foreground/90" title={label}>
                  {label}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-[#1a1f2b] overflow-hidden ring-1 ring-white/5">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${fill} ax-bar shadow-[0_0_12px_rgba(99,102,241,0.35)] transition-[width] duration-700 ease-out group-hover:brightness-110`}
                  style={{ width: ready ? `${pct}%` : "0%" }}
                />
              </div>
            </div>
            <span className="tabular-nums text-muted w-10 text-right font-medium group-hover:text-indigo-300 transition-colors">
              {value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HourColumns({
  hourly,
  chartKey,
}: {
  hourly: { hour: number; views: number }[];
  chartKey: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [chartKey]);

  const max = Math.max(1, ...hourly.map((h) => h.views));
  if (!hourly.some((h) => h.views > 0)) return <EmptyHint />;

  return (
    <div className="relative pt-2">
      <div className="flex items-end gap-[3px] h-36 px-0.5">
        {hourly.map((h) => {
          const pct = (h.views / max) * 100;
          const active = hover === h.hour;
          return (
            <button
              key={h.hour}
              type="button"
              className="relative flex-1 h-full flex flex-col justify-end group outline-none"
              onMouseEnter={() => setHover(h.hour)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(h.hour)}
              onBlur={() => setHover(null)}
              aria-label={`${formatHour(h.hour)}: ${h.views} views`}
            >
              <div
                className={`w-full rounded-t-sm transition-all duration-500 ease-out ${
                  active
                    ? "bg-gradient-to-t from-indigo-600 to-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.35)]"
                    : "bg-gradient-to-t from-indigo-700/80 to-indigo-400/90"
                }`}
                style={{
                  height: ready ? `${Math.max(h.views ? 6 : 0, pct)}%` : "0%",
                  transitionDelay: `${h.hour * 18}ms`,
                }}
              />
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted mt-2 px-0.5">
        <span>00h</span>
        <span>06h</span>
        <span>12h</span>
        <span>18h</span>
        <span>23h</span>
      </div>
      {hover != null && (
        <div className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 rounded-md border border-indigo-400/30 bg-[#0f1219]/95 px-2.5 py-1 text-xs shadow-lg backdrop-blur ax-fade">
          <span className="text-indigo-300 font-medium">{formatHour(hover)}</span>
          <span className="text-muted mx-1.5">·</span>
          <span className="tabular-nums">{hourly[hover]?.views ?? 0} views</span>
        </div>
      )}
    </div>
  );
}

function LineChart({
  points,
  chartKey,
}: {
  points: { label: string; value: number }[];
  chartKey: string;
}) {
  const gid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    setDrawn(false);
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, [chartKey]);

  const geometry = useMemo(() => {
    if (!points.length) return null;
    const w = 560;
    const h = 160;
    const padX = 16;
    const padY = 18;
    const max = Math.max(1, ...points.map((p) => p.value));
    const step = points.length > 1 ? (w - padX * 2) / (points.length - 1) : 0;
    const pts = points.map((p, i) => {
      const x = padX + i * step;
      const y = h - padY - (p.value / max) * (h - padY * 2);
      return { x, y, ...p };
    });
    const line = pts.map((p) => `${p.x},${p.y}`).join(" ");
    const area = `${pts[0].x},${h - padY} ${line} ${pts[pts.length - 1].x},${h - padY}`;
    const length = pts.reduce((acc, p, i) => {
      if (i === 0) return 0;
      const prev = pts[i - 1];
      return acc + Math.hypot(p.x - prev.x, p.y - prev.y);
    }, 0);
    return { w, h, padY, pts, line, area, length, max };
  }, [points]);

  if (!geometry) return <EmptyHint />;
  const { w, h, pts, line, area, length } = geometry;

  return (
    <div className="relative overflow-x-auto" key={chartKey}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full min-w-[320px] h-40"
        role="img"
        aria-label="Views por dia"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`ax-fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`ax-stroke-${gid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="55%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
          <filter id={`ax-glow-${gid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1="16"
            x2={w - 16}
            y1={18 + (h - 36) * t}
            y2={18 + (h - 36) * t}
            stroke="rgba(148,163,184,0.12)"
            strokeDasharray="4 6"
          />
        ))}

        <polygon
          points={area}
          fill={`url(#ax-fill-${gid})`}
          className={`ax-area ${drawn ? "ax-area-on" : ""}`}
        />
        <polyline
          points={line}
          fill="none"
          stroke={`url(#ax-stroke-${gid})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#ax-glow-${gid})`}
          style={{
            strokeDasharray: length,
            strokeDashoffset: drawn ? 0 : length,
            transition: "stroke-dashoffset 900ms ease-out",
          }}
        />

        {pts.map((p, i) => (
          <g key={p.label}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hover === i ? 5.5 : 3.5}
              fill={hover === i ? "#22d3ee" : "#818cf8"}
              stroke="#0f1219"
              strokeWidth="2"
              className="transition-all duration-200"
              style={{
                opacity: drawn ? 1 : 0,
                transitionDelay: `${200 + i * 40}ms`,
              }}
              onMouseEnter={() => setHover(i)}
            />
            <rect
              x={p.x - Math.max(12, (w - 32) / Math.max(pts.length, 1) / 2)}
              y={0}
              width={Math.max(24, (w - 32) / Math.max(pts.length, 1))}
              height={h}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          </g>
        ))}

        {hover != null && pts[hover] && (
          <g>
            <line
              x1={pts[hover].x}
              x2={pts[hover].x}
              y1={12}
              y2={h - 12}
              stroke="rgba(34,211,238,0.35)"
              strokeDasharray="3 4"
            />
          </g>
        )}
      </svg>

      {hover != null && pts[hover] && (
        <div
          className="pointer-events-none absolute top-1 rounded-md border border-cyan-400/25 bg-[#0f1219]/95 px-2.5 py-1 text-xs shadow-lg backdrop-blur ax-fade"
          style={{
            left: `clamp(8px, ${(pts[hover].x / w) * 100}% - 48px, calc(100% - 110px))`,
          }}
        >
          <div className="text-muted">{pts[hover].label}</div>
          <div className="tabular-nums font-semibold text-cyan-300">{pts[hover].value} views</div>
        </div>
      )}

      <div className="flex justify-between text-[10px] text-muted px-1">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}

function DeviceDonut({
  devices,
  chartKey,
}: {
  devices: { device: string; views: number }[];
  chartKey: string;
}) {
  const gid = useId().replace(/:/g, "");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [chartKey]);

  const total = devices.reduce((s, d) => s + d.views, 0);
  if (!total) return <EmptyHint />;

  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const segments = devices.map((d) => {
    const len = (d.views / total) * c;
    const seg = {
      ...d,
      dash: ready ? `${len} ${c - len}` : `0 ${c}`,
      offset: -offset,
      color: DEVICE_COLORS[d.device] || DEVICE_COLORS.unknown,
    };
    offset += len;
    return seg;
  });

  return (
    <div className="flex items-center gap-5" key={chartKey}>
      <div className="relative shrink-0">
        <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#1a1f2b" strokeWidth="14" />
          {segments.map((s, i) => (
            <circle
              key={s.device}
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={s.dash}
              strokeDashoffset={s.offset}
              strokeLinecap="butt"
              className="transition-all duration-700 ease-out"
              style={{ transitionDelay: `${i * 80}ms` }}
              filter={`url(#ax-donut-glow-${gid})`}
            />
          ))}
          <defs>
            <filter id={`ax-donut-glow-${gid}`}>
              <feGaussianBlur stdDeviation="0.6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold tabular-nums">{total}</span>
          <span className="text-[10px] text-muted uppercase tracking-wide">views</span>
        </div>
      </div>
      <ul className="space-y-2 text-sm min-w-0 flex-1">
        {devices.map((d, i) => (
          <li
            key={d.device}
            className="flex items-center justify-between gap-2 ax-row"
            style={{ animationDelay: `${120 + i * 60}ms` }}
          >
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ background: DEVICE_COLORS[d.device] || DEVICE_COLORS.unknown }}
              />
              <span className="capitalize truncate">{d.device}</span>
            </span>
            <span className="tabular-nums text-muted">
              {d.views}
              <span className="text-[10px] ml-1 opacity-70">
                ({Math.round((d.views / total) * 100)}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Funnel({ intro, read, chartKey }: { intro: number; read: number; chartKey: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [chartKey]);

  const max = Math.max(1, intro, read);
  const rate = intro > 0 ? Math.round((read / intro) * 100) : 0;

  return (
    <div className="space-y-3" key={chartKey}>
      {[
        { label: "Intro", value: intro, color: "from-indigo-500 to-indigo-400" },
        { label: "Ler", value: read, color: "from-cyan-500 to-cyan-300" },
      ].map((row, i) => (
        <div key={row.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted">{row.label}</span>
            <span className="tabular-nums font-medium">{row.value}</span>
          </div>
          <div className="h-3 rounded-full bg-[#1a1f2b] overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${row.color} transition-all duration-700 ease-out`}
              style={{
                width: ready ? `${(row.value / max) * 100}%` : "0%",
                transitionDelay: `${i * 120}ms`,
              }}
            />
          </div>
        </div>
      ))}
      <p className="text-xs text-muted pt-1">
        Conversão intro → ler:{" "}
        <span className="text-cyan-300 font-semibold tabular-nums">{rate}%</span>
      </p>
    </div>
  );
}

export function AdminAnalytics({ token }: Props) {
  const [period, setPeriod] = useState<Period>("week");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animKey, setAnimKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ period });
      if (period === "custom") {
        if (dateFrom) params.set("date_from", dateFrom);
        if (dateTo) params.set("date_to", dateTo);
      }
      const res = await fetch(`${getApiUrl()}/analytics/overview?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(detail || `Erro ${res.status}`);
      }
      setData(await res.json());
      setAnimKey((k) => k + 1);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Falha ao carregar analytics");
    } finally {
      setLoading(false);
    }
  }, [token, period, dateFrom, dateTo]);

  useEffect(() => {
    if (period === "custom" && (!dateFrom || !dateTo)) return;
    void load();
  }, [load, period, dateFrom, dateTo]);

  const introViews = data?.surfaces.find((s) => s.surface === "intro")?.views ?? 0;
  const readViews = data?.surfaces.find((s) => s.surface === "read")?.views ?? 0;
  const chartKey = `${period}-${animKey}`;

  return (
    <section className="force-card rounded-xl p-6 space-y-6 text-foreground relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-cyan-500/5 blur-3xl" />

      <style>{`
        @keyframes ax-fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ax-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .ax-panel { animation: ax-fade-up 0.45s ease-out both; }
        .ax-row { animation: ax-fade-up 0.4s ease-out both; }
        .ax-fade { animation: ax-fade 0.2s ease-out both; }
        .ax-area { opacity: 0; transition: opacity 0.6s ease-out 0.15s; }
        .ax-area-on { opacity: 1; }
        @media (prefers-reduced-motion: reduce) {
          .ax-panel, .ax-row, .ax-fade, .ax-area, .ax-bar {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Analytics</h2>
          <p className="text-sm text-muted mt-1">
            Controle interno — só conta visitas a partir de agora. Home segue com Top 10 eterno e do mês.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-lg px-3 py-2 text-sm font-semibold bg-border text-foreground hover:bg-border/80 disabled:opacity-50 transition-transform active:scale-[0.98]"
        >
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      <div className="relative flex flex-wrap gap-2 items-center">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-200 ${
              period === p.id
                ? "bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.35)] scale-[1.02]"
                : "bg-border text-foreground hover:bg-border/80"
            }`}
          >
            {p.label}
          </button>
        ))}
        {period === "custom" && (
          <div className="flex flex-wrap gap-2 items-center ax-fade">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-[#1f2430] bg-transparent px-2 py-1 text-sm"
            />
            <span className="text-muted text-sm">até</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-[#1f2430] bg-transparent px-2 py-1 text-sm"
            />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {loading && !data && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-[#1f2430] bg-[#12151c] animate-pulse" />
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Views (período)" value={data.totals.views} active animDelay={0} />
            <Stat label="Sessões únicas" value={data.totals.unique_sessions} active animDelay={60} />
            <Stat label="Posts tocados" value={data.totals.unique_posts} active animDelay={120} />
            <Stat
              label="Pico horário (UTC)"
              value={data.totals.peak_hour == null ? "—" : formatHour(data.totals.peak_hour)}
              active
              animDelay={180}
              raw
            />
          </div>

          <div className="relative grid gap-3 sm:grid-cols-3 text-sm">
            <InfoChip label="Topo device" value={data.totals.top_device || "—"} delay={200} />
            <InfoChip label="Topo tema" value={data.totals.top_theme || "—"} delay={260} />
            <InfoChip label="Intro → Ler" value={`${introViews} → ${readViews}`} delay={320} />
          </div>

          <div className="relative grid gap-6 lg:grid-cols-2">
            <Panel title="Views por dia" delay={0}>
              <LineChart
                chartKey={chartKey}
                points={data.daily.map((d) => ({ label: d.date, value: d.views }))}
              />
            </Panel>
            <Panel title="Distribuição por hora (UTC)" delay={40}>
              <HourColumns chartKey={chartKey} hourly={data.hourly} />
            </Panel>
            <Panel title="Devices" delay={80}>
              <DeviceDonut chartKey={chartKey} devices={data.devices} />
            </Panel>
            <Panel title="Intro → Ler" delay={100}>
              <Funnel chartKey={chartKey} intro={introViews} read={readViews} />
            </Panel>
            <Panel title="Temas / weekday" delay={120}>
              <BarChart
                chartKey={chartKey}
                items={data.themes as any}
                labelKey="theme"
                valueKey="views"
                accent="violet"
              />
            </Panel>
            <Panel title="Top posts no período" delay={140}>
              {!data.top_posts.length ? (
                <EmptyHint />
              ) : (
                <ol className="space-y-2 text-sm">
                  {data.top_posts.slice(0, 10).map((p, i) => (
                    <li
                      key={p.post_id}
                      className="flex gap-2 justify-between border-b border-[#1f2430] pb-2 ax-row group"
                      style={{ animationDelay: `${i * 45}ms` }}
                    >
                      <span className="min-w-0 truncate">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-indigo-500/15 text-[11px] text-indigo-300 mr-2 tabular-nums">
                          {i + 1}
                        </span>
                        <span className="group-hover:text-indigo-200 transition-colors">{p.title}</span>
                      </span>
                      <span className="tabular-nums text-muted shrink-0 font-medium">{p.views}</span>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          </div>

          <div className="relative grid gap-6 lg:grid-cols-2">
            <Panel title="Período vs contador eterno (home)" delay={160}>
              <p className="text-xs text-muted mb-3">
                Compara views do filtro com o contador usado no Top 10 eterno — útil pra investigar ranking.
              </p>
              {!data.top_posts_with_lifetime.length ? (
                <EmptyHint />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted border-b border-[#1f2430]">
                        <th className="py-2 pr-2 font-medium">Post</th>
                        <th className="py-2 pr-2 font-medium text-right">Período</th>
                        <th className="py-2 font-medium text-right">Eterno</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_posts_with_lifetime.map((p, i) => (
                        <tr
                          key={p.post_id}
                          className="border-b border-[#1f2430]/40 hover:bg-indigo-500/5 transition-colors ax-row"
                          style={{ animationDelay: `${i * 40}ms` }}
                        >
                          <td className="py-2 pr-2 max-w-[220px] truncate" title={p.title}>
                            {p.title}
                          </td>
                          <td className="py-2 pr-2 text-right tabular-nums text-indigo-300">{p.views}</td>
                          <td className="py-2 text-right tabular-nums text-muted">{p.lifetime_views}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            <Panel title="Breakdown por tema" delay={180}>
              {!data.theme_breakdown.length ? (
                <EmptyHint />
              ) : (
                <div className="grid gap-3">
                  {data.theme_breakdown.map((block, i) => (
                    <div
                      key={block.theme}
                      className="rounded-xl border border-[#1f2430] bg-gradient-to-br from-indigo-500/[0.06] to-transparent p-3 ax-row hover:border-indigo-500/30 transition-colors"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex justify-between gap-2 mb-2">
                        <h4 className="font-medium truncate">{block.theme}</h4>
                        <span className="text-indigo-300 tabular-nums shrink-0 font-semibold">{block.views}</span>
                      </div>
                      <ul className="space-y-1 text-sm text-muted">
                        {block.posts.map((p) => (
                          <li key={p.post_id} className="flex justify-between gap-2">
                            <span className="truncate">{p.title}</span>
                            <span className="tabular-nums shrink-0">{p.views}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <p className="relative text-xs text-muted">
            Janela: {new Date(data.start).toLocaleString()} → {new Date(data.end).toLocaleString()}
          </p>
        </>
      )}

      {!data && !loading && !error && period === "custom" && (
        <p className="text-sm text-muted">Escolha data inicial e final.</p>
      )}

      {data && data.totals.views === 0 && (
        <p className="relative text-sm text-amber-300/90 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
          Zero views neste período. Abra um post no site (intro ou Ler), volte aqui e clique em Atualizar.
          Visitas antigas do contador eterno não entram neste painel.
        </p>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  active,
  animDelay = 0,
  raw = false,
}: {
  label: string;
  value: string | number;
  active: boolean;
  animDelay?: number;
  raw?: boolean;
}) {
  const numeric = typeof value === "number" ? value : 0;
  const counted = useCountUp(numeric, active && !raw);
  return (
    <div
      className="rounded-xl border border-[#1f2430] p-4 bg-gradient-to-br from-white/[0.03] to-transparent hover:border-indigo-500/25 transition-colors ax-panel"
      style={{ animationDelay: `${animDelay}ms` }}
    >
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className="text-2xl font-semibold tabular-nums tracking-tight">
        {raw ? value : counted}
      </div>
    </div>
  );
}

function InfoChip({ label, value, delay = 0 }: { label: string; value: string; delay?: number }) {
  return (
    <div
      className="rounded-xl border border-[#1f2430] px-3 py-2 bg-[#12151c]/60 ax-panel"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="text-muted">{label}: </span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  );
}

function Panel({ title, children, delay = 0 }: { title: string; children: ReactNode; delay?: number }) {
  return (
    <div
      className="rounded-xl border border-[#1f2430] p-4 space-y-3 bg-[#0f1219]/40 backdrop-blur-sm hover:border-[#2a3142] transition-colors ax-panel"
      style={{ animationDelay: `${delay}ms` }}
    >
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      {children}
    </div>
  );
}
