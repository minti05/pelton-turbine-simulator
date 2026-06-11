"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CartesianGrid,
  Line,
  ComposedChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  RotateCw,
  Wrench,
  Zap,
  Waves,
  Gauge,
  Activity,
  Droplets,
  TrendingUp,
  Coins,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Settings2,
  CircleHelp,
  BookOpen,
  Crosshair,
  Play,
  Pause,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  PARAMS,
  GROUPS,
  DEFAULTS,
  computePelton,
  makeNozzles,
  syncNozzles,
  NOZZLE_ALPHA,
  NOZZLE_WEIGHT,
  type ParamKey,
  type Params,
  type GroupId,
  type DiagStatus,
  type NozzleConfig,
  type NozzleResult,
} from "@/lib/pelton";
import { ParameterControl } from "@/components/parameter-control";
import TurbineDiagram from "@/components/turbine-diagram";
import { Slider } from "@/components/ui/slider";

type Axis = "phi" | "u" | "n";

const GROUP_ORDER: GroupId[] = ["water", "nozzle", "runner", "generation"];

export default function PeltonSimulator() {
  const [params, setParams] = useState<Params>(DEFAULTS);
  const [nozzles, setNozzles] = useState<NozzleConfig[]>(() =>
    makeNozzles(DEFAULTS.zn)
  );
  const [nozSep, setNozSep] = useState(() => Math.round(DEFAULTS.Z / 2));
  const [running, setRunning] = useState(true);
  const [axis, setAxis] = useState<Axis>("phi");

  const update = (key: ParamKey, v: number) =>
    setParams((prev) => ({ ...prev, [key]: v }));
  const reset = () => {
    setParams(DEFAULTS);
    setNozzles(makeNozzles(DEFAULTS.zn));
    setNozSep(Math.round(DEFAULTS.Z / 2));
  };

  // keep the nozzle array length in sync with the ノズル本数 (zn) slider
  const activeNozzles = useMemo(
    () => syncNozzles(params.zn, nozzles),
    [params.zn, nozzles]
  );
  const updateNozzle = (i: number, patch: Partial<NozzleConfig>) =>
    setNozzles((cur) =>
      syncNozzles(params.zn, cur).map((n, idx) =>
        idx === i ? { ...n, ...patch } : n
      )
    );

  // nozzle spacing is capped at Z-1 buckets
  const sepMax = Math.max(1, params.Z - 1);
  const activeSep = Math.min(nozSep, sepMax);

  const r = useMemo(
    () => computePelton(params, activeNozzles, activeSep),
    [params, activeNozzles, activeSep]
  );

  // chart data in display units (kW, %)
  const chartData = useMemo(
    () =>
      r.curve.map((c) => ({
        phi: c.phi,
        u: c.u,
        n: c.n,
        pElec: c.pwElec / 1000,
        pRunner: c.pwRunner / 1000,
        eta: c.eta,
      })),
    [r.curve]
  );

  const xKey = axis;
  const optX =
    axis === "phi" ? (r.v1 > 0 ? r.uOpt / r.v1 : 0) : axis === "u" ? r.uOpt : r.nOpt;
  const opX = axis === "phi" ? params.phi : axis === "u" ? r.uOp : r.nOp;

  return (
    <main className="mx-auto grid max-w-[1500px] gap-6 px-6 py-6 lg:grid-cols-[380px_1fr]">
      {/* ============================ SIDEBAR ============================ */}
      <aside className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings2 className="h-4 w-4 text-primary" />
                入力パラメータ
              </CardTitle>
              <CardDescription className="mt-1">
                16項目。変更すると全結果が即時に再計算されます。
              </CardDescription>
            </div>
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              初期値
            </button>
          </CardHeader>
          <CardContent className="space-y-6">
            {GROUP_ORDER.map((gid) => {
              const g = GROUPS[gid];
              const items = PARAMS.filter((p) => p.group === gid);
              return (
                <div key={gid} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: g.hsl }}
                    />
                    <span className={cn("text-xs font-semibold uppercase tracking-wide", g.color)}>
                      {g.label}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  {items.map((meta) => (
                    <ParameterControl
                      key={meta.key}
                      meta={meta}
                      value={params[meta.key]}
                      onChange={(v) => update(meta.key, v)}
                    />
                  ))}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </aside>

      {/* ============================ MAIN ============================ */}
      <section className="space-y-6">
        {/* ---- KPI dashboard ---- */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          <Kpi icon={Waves} label="噴流速度 v₁" value={r.v1.toFixed(2)} unit="m/s" />
          <Kpi icon={RotateCw} label="運転回転数 N" value={r.nOp.toFixed(0)} unit="rpm" />
          <Kpi icon={Wrench} label="トルク T" value={r.torque.toFixed(1)} unit="N·m" />
          <Kpi icon={Zap} label="発電出力" value={(r.pElec / 1000).toFixed(2)} unit="kW" accent />
          <Kpi icon={Activity} label="ランナ出力" value={(r.pwRunner / 1000).toFixed(2)} unit="kW" />
          <Kpi icon={TrendingUp} label="総合効率" value={r.etaOverall.toFixed(1)} unit="%" />
          <Kpi icon={Droplets} label="有効落差 H" value={r.Heff.toFixed(2)} unit="m" />
          <Kpi icon={Coins} label="年間収益" value={fmtYen(r.revenueYen)} unit="¥/年" />
        </div>

        {/* ---- per-nozzle configuration ---- */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Crosshair className="h-4 w-4 text-sky-400" />
              ノズル個別設定（{activeNozzles.length}本）
            </CardTitle>
            <CardDescription>
              各ノズルの<strong className="text-foreground">入射角 α</strong>（接線方向からの傾き）と
              <strong className="text-foreground">流量配分</strong>を別々に設定できます。本数は左の「ノズル本数」で増減します。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {activeNozzles.map((n, i) => (
                <NozzleCard
                  key={i}
                  index={i}
                  config={n}
                  result={r.nozzles[i]}
                  onChange={(patch) => updateNozzle(i, patch)}
                />
              ))}
            </div>
            {activeNozzles.length === 2 && (
              <div className="space-y-1.5 rounded-lg border border-sky-500/20 bg-sky-500/5 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">
                    ノズル間隔（バケット何個分ずらすか）
                  </span>
                  <span className="font-mono tabular-nums text-foreground">
                    {activeSep} 個 ・ {((activeSep * 360) / params.Z).toFixed(0)}°
                  </span>
                </div>
                <Slider
                  value={[activeSep]}
                  min={1}
                  max={sepMax}
                  step={1}
                  onValueChange={(vals) => setNozSep(vals[0])}
                />
                <p className="text-[10px] text-muted-foreground">
                  2本のノズルを円周上で何バケット分離すか。半周（約{Math.round(params.Z / 2)}個・180°）で
                  ラジアル荷重が打ち消し合い、軸受に優しくなります。
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ---- diagram + diagnostics ---- */}
        <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CircleHelp className="h-4 w-4 text-primary" />
                  水車モデル図解
                </CardTitle>
                <CardDescription className="mt-1">
                  実際の回転・水流を再現。噴流は接線方向に入射し、ランナは N に応じた速さで回ります。
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setRunning((v) => !v)}
                className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {running ? "停止" : "再生"}
              </button>
            </CardHeader>
            <CardContent>
              <div className="mx-auto aspect-[400/360] w-full max-w-[460px]">
                <TurbineDiagram
                  D={params.D}
                  theta={params.theta}
                  Z={params.Z}
                  N={r.nOp}
                  v1={r.v1}
                  u={r.uOp}
                  nozzles={activeNozzles}
                  nozSep={activeSep}
                  running={running}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                <LegendDot color={GROUPS.runner.hsl} label="ランナ・直径D・偏向角θ" />
                <LegendDot color={GROUPS.nozzle.hsl} label="ノズル・噴流v₁" />
                <LegendDot color="#818cf8" label="周速u・回転N" />
                <LegendDot color={GROUPS.water.hsl} label="排出される水" />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* design diagnostics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">設計診断</CardTitle>
                <CardDescription>
                  経験則に基づく自動チェック。専門知識がなくても設計の妥当性がわかります。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {r.diagnostics.map((d) => (
                  <DiagRow key={d.label} status={d.status} label={d.label} message={d.message} />
                ))}
              </CardContent>
            </Card>

            {/* secondary derived values */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">幾何・電気の導出量</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-xs">
                <Mini
                  label="噴流径 d"
                  value={
                    r.dJetMax - r.dJetMin > 1e-4
                      ? `${(r.dJetMin * 1000).toFixed(0)}–${(r.dJetMax * 1000).toFixed(0)} mm`
                      : `${(r.dJetMax * 1000).toFixed(1)} mm`
                  }
                />
                <Mini label="ノズル比 D/d" value={r.jetRatio.toFixed(1)} />
                <Mini label="推奨バケット数" value={`${r.zRec.toFixed(0)} 枚`} />
                <Mini label="比速度 Ns" value={r.Ns.toFixed(1)} />
                <Mini label="入射効率 cosα" value={r.cosAlphaEff.toFixed(3)} />
                <Mini label="(1−k·cosθ)" value={r.bucketFactor.toFixed(3)} />
                <Mini label={`増速比→${params.f}Hz`} value={`${r.gearRatio.toFixed(2)} :1`} />
                <Mini label="年間発電量" value={`${r.annualMWh.toFixed(1)} MWh`} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ---- characteristic chart ---- */}
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
            <div>
              <CardTitle className="text-base">特性曲線（出力・効率 vs 周速）</CardTitle>
              <CardDescription>
                周速を 0 から v₁ まで変えたときの出力と効率。◯ 理論最適点（入射角に応じて移動）、● 現在の運転点。
              </CardDescription>
            </div>
            <div className="flex shrink-0 rounded-lg border border-border p-0.5">
              <AxisTab active={axis === "phi"} onClick={() => setAxis("phi")} label="周速比 φ" />
              <AxisTab active={axis === "u"} onClick={() => setAxis("u")} label="周速 u" />
              <AxisTab active={axis === "n"} onClick={() => setAxis("n")} label="回転数 N" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 16, right: 16, left: 8, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey={xKey}
                    type="number"
                    domain={[0, "dataMax"]}
                    tickCount={8}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: number) =>
                      axis === "phi" ? v.toFixed(2) : axis === "u" ? v.toFixed(1) : v.toFixed(0)
                    }
                    label={{
                      value:
                        axis === "phi"
                          ? "周速比 φ = u / v₁"
                          : axis === "u"
                          ? "周速 u [m/s]"
                          : "回転数 N [rpm]",
                      position: "insideBottom",
                      offset: -12,
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 12,
                    }}
                  />
                  <YAxis
                    yAxisId="power"
                    stroke={GROUPS.generation.hsl}
                    tick={{ fontSize: 11 }}
                    label={{
                      value: "出力 [kW]",
                      angle: -90,
                      position: "insideLeft",
                      fill: GROUPS.generation.hsl,
                      fontSize: 12,
                    }}
                  />
                  <YAxis
                    yAxisId="eta"
                    orientation="right"
                    stroke={GROUPS.water.hsl}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: number) => v.toFixed(0)}
                    label={{
                      value: "ランナ効率 [%]",
                      angle: 90,
                      position: "insideRight",
                      fill: GROUPS.water.hsl,
                      fontSize: 12,
                    }}
                  />
                  <Tooltip content={<ChartTooltip axis={axis} />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    yAxisId="power"
                    name="発電出力"
                    type="monotone"
                    dataKey="pElec"
                    stroke={GROUPS.generation.hsl}
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="power"
                    name="ランナ出力"
                    type="monotone"
                    dataKey="pRunner"
                    stroke={GROUPS.runner.hsl}
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="eta"
                    name="ランナ効率"
                    type="monotone"
                    dataKey="eta"
                    stroke={GROUPS.water.hsl}
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                  {/* theoretical optimum */}
                  <ReferenceDot
                    yAxisId="power"
                    x={optX}
                    y={r.pwMax / 1000}
                    r={5}
                    fill="none"
                    stroke={GROUPS.runner.hsl}
                    strokeWidth={2}
                    isFront
                  />
                  {/* operating point */}
                  <ReferenceDot
                    yAxisId="power"
                    x={opX}
                    y={r.pwRunner / 1000}
                    r={6}
                    fill={GROUPS.generation.hsl}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                    isFront
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* ---- formula footer ---- */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-sm">計算モデル（要約）</CardTitle>
              <CardDescription>各式の導出と意味は理論解説ページへ。</CardDescription>
            </div>
            <Link
              href="/theory"
              className="flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary ring-1 ring-primary/30 transition-colors hover:bg-primary/20"
            >
              <BookOpen className="h-3.5 w-3.5" />
              理論解説を読む
            </Link>
          </CardHeader>
          <CardContent className="grid gap-2 font-mono text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
            <Formula>H = Hg·(1 − ζ)</Formula>
            <Formula>v₁ = Cv·√(2gH)</Formula>
            <Formula>u = φ·v₁</Formula>
            <Formula>N = 60u / (πD)</Formula>
            <Formula>Pw = ρQu(v₁−u)(1−k·cosθ)</Formula>
            <Formula>T = Pw / ω = 60Pw/(2πN)</Formula>
            <Formula>P_elec = Pw·η_gen·η_mech</Formula>
            <Formula>η = P_elec / (ρgQHg)</Formula>
            <Formula>d = √(4Q/(zₙπv₁))</Formula>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

/* ============================ sub-components ============================ */
function Kpi({
  icon: Icon,
  label,
  value,
  unit,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
}) {
  return (
    <Card className={cn("transition-colors", accent && "border-primary/50 bg-primary/5")}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <Icon className={cn("h-4 w-4", accent ? "text-primary" : "text-muted-foreground")} />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span
            className={cn(
              "font-mono text-2xl font-semibold tabular-nums tracking-tight",
              accent ? "text-primary" : "text-foreground"
            )}
          >
            {value}
          </span>
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function DiagRow({
  status,
  label,
  message,
}: {
  status: DiagStatus;
  label: string;
  message: string;
}) {
  const cfg = {
    ok: { Icon: CheckCircle2, color: "text-emerald-400" },
    warn: { Icon: AlertTriangle, color: "text-amber-400" },
    bad: { Icon: XCircle, color: "text-rose-400" },
  }[status];
  const Icon = cfg.Icon;
  return (
    <div className="flex items-start gap-2.5">
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", cfg.color)} />
      <div className="min-w-0">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <p className="text-xs text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="truncate text-muted-foreground">{label}</span>
      <span className="shrink-0 text-foreground">{value}</span>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function Formula({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-secondary/60 px-3 py-2">{children}</code>;
}

function AxisTab({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}

function ChartTooltip({
  active,
  payload,
  axis,
}: {
  active?: boolean;
  payload?: { payload: { phi: number; u: number; n: number; pElec: number; pRunner: number; eta: number } }[];
  axis: Axis;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <div className="font-mono tabular-nums text-muted-foreground">
        φ={d.phi.toFixed(2)} · u={d.u.toFixed(2)} m/s · N={d.n.toFixed(0)} rpm
      </div>
      <div className="mt-1 font-mono tabular-nums" style={{ color: GROUPS.generation.hsl }}>
        発電出力 {d.pElec.toFixed(3)} kW
      </div>
      <div className="font-mono tabular-nums" style={{ color: GROUPS.runner.hsl }}>
        ランナ出力 {d.pRunner.toFixed(3)} kW
      </div>
      <div className="font-mono tabular-nums" style={{ color: GROUPS.water.hsl }}>
        ランナ効率 {d.eta.toFixed(1)} %
      </div>
      <div className="mt-0.5 text-[10px] text-muted-foreground">
        横軸: {axis === "phi" ? "周速比 φ" : axis === "u" ? "周速 u" : "回転数 N"}
      </div>
    </div>
  );
}

function NozzleCard({
  index,
  config,
  result,
  onChange,
}: {
  index: number;
  config: NozzleConfig;
  result?: NozzleResult;
  onChange: (patch: Partial<NozzleConfig>) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-secondary/20 p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <span className="h-2 w-2 rounded-full bg-sky-400" />
          ノズル {index + 1}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {result ? `${result.sharePct.toFixed(0)}% / ${(result.Qi * 1000).toFixed(1)} L/s` : ""}
        </span>
      </div>

      <NozzleSlider
        label="入射角 α"
        value={config.alpha}
        min={NOZZLE_ALPHA.min}
        max={NOZZLE_ALPHA.max}
        step={NOZZLE_ALPHA.step}
        display={`${config.alpha.toFixed(0)}°`}
        onChange={(v) => onChange({ alpha: v })}
      />
      <NozzleSlider
        label="流量配分"
        value={config.weight}
        min={NOZZLE_WEIGHT.min}
        max={NOZZLE_WEIGHT.max}
        step={NOZZLE_WEIGHT.step}
        display={`×${config.weight.toFixed(2)}`}
        onChange={(v) => onChange({ weight: v })}
      />

      <div className="flex justify-between border-t border-border/60 pt-2 font-mono text-[10px] text-muted-foreground">
        <span>噴流径 {result ? `${(result.di * 1000).toFixed(1)}mm` : "—"}</span>
        <span>D/d {result ? result.ratioI.toFixed(1) : "—"}</span>
      </div>
    </div>
  );
}

function NozzleSlider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums text-foreground">{display}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(vals) => onChange(vals[0])}
      />
    </div>
  );
}

function fmtYen(v: number): string {
  if (v >= 1e8) return `${(v / 1e8).toFixed(2)}億`;
  if (v >= 1e4) return `${(v / 1e4).toFixed(1)}万`;
  return v.toFixed(0);
}
