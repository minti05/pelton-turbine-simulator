/* ==================================================================
 * Pelton turbine hydraulic & generation model
 * ------------------------------------------------------------------
 * Pure, dependency-free physics. Shared by the dashboard and the
 * theory page so the numbers and the explanations never drift apart.
 * ================================================================== */

export const G = 9.81; // 重力加速度 [m/s^2]

/* ------------------------------------------------------------------ */
/* Parameter groups                                                    */
/* ------------------------------------------------------------------ */
export type GroupId = "water" | "nozzle" | "runner" | "generation";

export interface GroupMeta {
  id: GroupId;
  label: string;
  /** Tailwind text color used both in the sidebar and the diagram. */
  color: string;
  /** Tailwind bg tint for chips/badges. */
  tint: string;
  hsl: string; // raw color for SVG/recharts
}

export const GROUPS: Record<GroupId, GroupMeta> = {
  water: {
    id: "water",
    label: "水資源・流れ",
    color: "text-cyan-400",
    tint: "bg-cyan-500/10",
    hsl: "#22d3ee",
  },
  nozzle: {
    id: "nozzle",
    label: "ノズル・噴流",
    color: "text-sky-400",
    tint: "bg-sky-500/10",
    hsl: "#38bdf8",
  },
  runner: {
    id: "runner",
    label: "ランナ（水車本体）",
    color: "text-violet-400",
    tint: "bg-violet-500/10",
    hsl: "#a78bfa",
  },
  generation: {
    id: "generation",
    label: "発電・経済性",
    color: "text-amber-400",
    tint: "bg-amber-500/10",
    hsl: "#fbbf24",
  },
};

/* ------------------------------------------------------------------ */
/* Parameter definitions                                               */
/* ------------------------------------------------------------------ */
export type ParamKey =
  | "Hg"
  | "zeta"
  | "Q"
  | "Tw"
  | "Cv"
  | "zn"
  | "D"
  | "theta"
  | "k"
  | "phi"
  | "Z"
  | "etaGen"
  | "etaMech"
  | "f"
  | "cf"
  | "price";

export interface ParamMeta {
  key: ParamKey;
  group: GroupId;
  label: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  default: number;
  /** One-line gloss shown under the control. */
  short: string;
  /** Plain-language explanation for non-experts. */
  detail: string;
  /** Practical guidance / typical range. */
  guide: string;
}

export const PARAMS: ParamMeta[] = [
  /* ---- water ---- */
  {
    key: "Hg",
    group: "water",
    label: "総落差",
    symbol: "Hg",
    unit: "m",
    min: 1,
    max: 200,
    step: 0.5,
    default: 5,
    short: "取水口と水車ノズルの標高差",
    detail:
      "水が落ちる高さそのもの。位置エネルギーの源で、これが大きいほど噴流が速くなり出力が増えます。地図上の標高差で決まる『その場所のポテンシャル』です。",
    guide: "マイクロ水力では数m〜数十m。10m以上あると小型でも有利。",
  },
  {
    key: "zeta",
    group: "water",
    label: "管路損失率",
    symbol: "ζ",
    unit: "%",
    min: 0,
    max: 40,
    step: 1,
    default: 8,
    short: "配管の摩擦で失う落差の割合",
    detail:
      "導水管（ペンストック）の中を水が流れるときの摩擦で、落差の一部が熱として失われます。実際にノズルで使える『有効落差 H = Hg(1−ζ)』はこのぶん目減りします。管が細い・長い・流量が多いほど大きくなります。",
    guide: "適切な配管で5〜10%程度。20%を超えるなら配管見直しのサイン。",
  },
  {
    key: "Q",
    group: "water",
    label: "流量",
    symbol: "Q",
    unit: "m³/s",
    min: 0.001,
    max: 0.5,
    step: 0.001,
    default: 0.05,
    short: "1秒あたりに流れる水の体積",
    detail:
      "毎秒どれだけの量の水を水車に通すか。出力は流量に比例するため落差と並ぶ最重要パラメータです。1 m³/s = 1秒あたり1000リットル。0.05なら毎秒50リットルです。",
    guide: "渇水期でも確保できる流量で設計するのが安全。河川流量の調査が必要。",
  },
  {
    key: "Tw",
    group: "water",
    label: "水温",
    symbol: "Tw",
    unit: "°C",
    min: 0,
    max: 40,
    step: 1,
    default: 15,
    short: "水の密度をわずかに変える",
    detail:
      "水温で密度 ρ がわずかに変わります（冷たいほど重い）。出力は密度に比例しますが影響は0.3%程度とごく小さく、教育目的の項目です。",
    guide: "効果は微小。山間の冷水でほんの少しだけ有利、という程度。",
  },
  /* ---- nozzle ---- */
  {
    key: "Cv",
    group: "nozzle",
    label: "ノズル速度係数",
    symbol: "Cv",
    unit: "",
    min: 0.9,
    max: 1,
    step: 0.001,
    default: 0.97,
    short: "ノズルの噴出効率（1に近いほど良い）",
    detail:
      "理想的なノズルなら落差のエネルギーが100%噴流速度に変わりますが、実際は摩擦で少し落ちます。Cv はその割合。v₁ = Cv·√(2gH) のように噴流速度に直接掛かります。",
    guide: "よく設計されたノズルで0.96〜0.98。",
  },
  {
    key: "zn",
    group: "nozzle",
    label: "ノズル本数",
    symbol: "zₙ",
    unit: "本",
    min: 1,
    max: 2,
    step: 1,
    default: 1,
    short: "噴流を吹き付けるノズルの数（1〜2本）",
    detail:
      "同じ流量を2本のノズルに分けると、1本あたりの噴流が細くなり、同じランナをより速く回せます。総流量は変わらないので総出力はほぼ同じですが、噴流径を細く保て効率（ノズル比）が上がります。横軸型の小水力では1〜2本が一般的です。",
    guide: "1本が基本。流量が多く噴流が太くなる場合は2本に分割。",
  },
  /* ---- runner ---- */
  {
    key: "D",
    group: "runner",
    label: "ピッチ円直径",
    symbol: "D",
    unit: "m",
    min: 0.1,
    max: 2,
    step: 0.01,
    default: 0.3,
    short: "バケット中心を通る円の直径",
    detail:
      "水車の『大きさ』。噴流が当たるバケットの中心が描く円の直径です。回転数 N = 60u/(πD) のように、同じ周速でも D が大きいほど回転はゆっくりになります（トルクは増える）。",
    guide: "噴流径の10〜14倍が目安（ノズル比）。小さすぎると効率低下。",
  },
  {
    key: "theta",
    group: "runner",
    label: "偏向角",
    symbol: "θ",
    unit: "°",
    min: 150,
    max: 180,
    step: 1,
    default: 165,
    short: "バケットが噴流を曲げる角度",
    detail:
      "バケットは噴流をほぼUターンさせて運動量を奪います。180°なら完全反転（理論最大）。実際は出ていく水が戻ってくる水とぶつからないよう165°前後にします。出力は (1 − k·cosθ) に比例します。",
    guide: "実機で160〜170°。180°は理想値で実現不可。",
  },
  {
    key: "k",
    group: "runner",
    label: "バケット速度係数",
    symbol: "k",
    unit: "",
    min: 0.7,
    max: 1,
    step: 0.01,
    default: 0.88,
    short: "バケット表面摩擦で出口相対速度がk倍に",
    detail:
      "水がバケット表面を滑る間の摩擦で、出ていく相対速度が入口の k 倍に減ります（k=1なら摩擦なしの理想）。出力の (1 − k·cosθ) の係数に効きます。表面が滑らかなほど1に近づきます。",
    guide: "実機で0.85〜0.90。鏡面研磨で改善。",
  },
  {
    key: "phi",
    group: "runner",
    label: "周速比",
    symbol: "φ",
    unit: "",
    min: 0.4,
    max: 0.5,
    step: 0.005,
    default: 0.46,
    short: "噴流速度に対する周速の比 u/v₁",
    detail:
      "バケットの周速 u が噴流速度 v₁ の何倍で回っているか。理論上は φ=0.5（u=v₁/2）で出力最大ですが、実機では摩擦などで0.46前後が最適になります。運転点をこの値で指定します。",
    guide: "実機の最適は0.45〜0.48。0.5は摩擦ゼロの理想値。",
  },
  {
    key: "Z",
    group: "runner",
    label: "バケット枚数",
    symbol: "Z",
    unit: "枚",
    min: 14,
    max: 30,
    step: 1,
    default: 20,
    short: "ランナ外周のバケットの数",
    detail:
      "噴流の水が1滴も取りこぼされず、かつ干渉しないために必要な数。少なすぎると水が抜け、多すぎると隣のバケットの影になります。推奨値 Z ≈ 15 + D/(2d) と比較して診断します。",
    guide: "一般に18〜26枚。直径と噴流径から最適枚数が決まる。",
  },
  /* ---- generation ---- */
  {
    key: "etaGen",
    group: "generation",
    label: "発電機効率",
    symbol: "η_gen",
    unit: "",
    min: 0.7,
    max: 0.98,
    step: 0.01,
    default: 0.9,
    short: "回転を電気に変える効率",
    detail:
      "ランナの機械的な回転エネルギーを発電機が電力に変換する効率。銅損・鉄損などで失われます。最終的な電気出力 = ランナ出力 × η_gen × η_mech。",
    guide: "小型永久磁石発電機で0.85〜0.93。",
  },
  {
    key: "etaMech",
    group: "generation",
    label: "伝達効率",
    symbol: "η_mech",
    unit: "",
    min: 0.8,
    max: 1,
    step: 0.01,
    default: 0.95,
    short: "軸受・ベルト等の機械損失",
    detail:
      "軸受の摩擦やベルト／増速機での損失。直結なら1に近く、増速ベルトを介すると下がります。",
    guide: "直結で0.97〜0.99、ベルト増速で0.92〜0.96。",
  },
  {
    key: "f",
    group: "generation",
    label: "系統周波数",
    symbol: "f",
    unit: "Hz",
    min: 50,
    max: 60,
    step: 10,
    default: 50,
    short: "接続先の電力周波数（東日本50/西日本60）",
    detail:
      "系統に同期させる発電機の周波数。同期回転数 Nₛ = 120f/極数 を決め、水車回転数との差から必要な増速比（プーリ比）がわかります。",
    guide: "東日本50Hz・西日本60Hz。独立運転なら任意。",
  },
  {
    key: "cf",
    group: "generation",
    label: "設備利用率",
    symbol: "CF",
    unit: "%",
    min: 10,
    max: 95,
    step: 1,
    default: 60,
    short: "年間で定格出力に対して実際に出る割合",
    detail:
      "1年を通して平均でどれだけ発電できるか。渇水・メンテ停止・流量変動を含めた稼働の指標。年間発電量 = 出力 × 8760時間 × CF。",
    guide: "流れ込み式の小水力で50〜70%と高め（太陽光は15%前後）。",
  },
  {
    key: "price",
    group: "generation",
    label: "電力単価",
    symbol: "p",
    unit: "¥/kWh",
    min: 5,
    max: 60,
    step: 1,
    default: 20,
    short: "売電・自家消費の価値",
    detail:
      "発電1kWhあたりの金銭価値。FIT売電単価や、買電を減らす自家消費の節約額として年間収益を試算します。",
    guide: "小水力FITは設備規模で変動。自家消費なら買電単価。",
  },
];

export type Params = Record<ParamKey, number>;

export const DEFAULTS: Params = PARAMS.reduce((acc, p) => {
  acc[p.key] = p.default;
  return acc;
}, {} as Params);

export function paramMeta(key: ParamKey): ParamMeta {
  return PARAMS.find((p) => p.key === key)!;
}

/* ------------------------------------------------------------------ */
/* Per-nozzle configuration                                            */
/* ------------------------------------------------------------------ */
export interface NozzleConfig {
  /** 入射角：噴流が接線方向からどれだけ傾いて当たるか [deg] (0 = 理想). */
  alpha: number;
  /** 流量配分の相対ウェイト（全ノズルの合計で正規化される）. */
  weight: number;
}

export const NOZZLE_ALPHA = { min: 0, max: 30, step: 1, default: 0 };
export const NOZZLE_WEIGHT = { min: 0.2, max: 2, step: 0.05, default: 1 };

export function makeNozzles(count: number): NozzleConfig[] {
  return Array.from({ length: Math.max(1, count) }, () => ({
    alpha: NOZZLE_ALPHA.default,
    weight: NOZZLE_WEIGHT.default,
  }));
}

/** Resize a nozzle array to `count`, preserving existing entries. */
export function syncNozzles(
  count: number,
  current: NozzleConfig[]
): NozzleConfig[] {
  const n = Math.max(1, count);
  if (current.length === n) return current;
  if (current.length > n) return current.slice(0, n);
  return [
    ...current,
    ...Array.from({ length: n - current.length }, () => ({
      alpha: NOZZLE_ALPHA.default,
      weight: NOZZLE_WEIGHT.default,
    })),
  ];
}

/* ------------------------------------------------------------------ */
/* Water density as a function of temperature (approx, 0–40°C)         */
/* ------------------------------------------------------------------ */
export function waterDensity(tC: number): number {
  // Compact quadratic fit, accurate to ~0.1 kg/m³ over 0–40°C.
  return 1000 - 0.0148 * tC - 0.00396 * tC * tC;
}

/* ------------------------------------------------------------------ */
/* Result type                                                         */
/* ------------------------------------------------------------------ */
export interface CurvePoint {
  phi: number;
  u: number;
  n: number;
  pwRunner: number; // W
  pwElec: number; // W
  eta: number; // runner efficiency %
}

export type DiagStatus = "ok" | "warn" | "bad";
export interface Diagnostic {
  label: string;
  status: DiagStatus;
  message: string;
}

export interface NozzleResult {
  index: number;
  alpha: number; // deg
  sharePct: number; // % of total flow
  Qi: number; // m³/s
  di: number; // jet diameter [m]
  ratioI: number; // D / di
}

export interface Result {
  rho: number;
  Heff: number;
  zetaFrac: number;
  v1: number;
  dJet: number; // representative (largest) jet diameter [m]
  dJetMin: number;
  dJetMax: number;
  jetRatio: number; // m = D / dJet (worst case)
  bucketFactor: number; // (1 - k cosθ)
  cosAlphaEff: number; // flow-weighted mean cos(alpha)
  nozzles: NozzleResult[];

  // theoretical optimum (parabola vertex, φ = 0.5)
  uOpt: number;
  nOpt: number;
  pwMax: number; // W

  // operating point (at φ)
  uOp: number;
  nOp: number;
  pwRunner: number; // W
  torque: number; // N·m
  pElec: number; // W

  pWater: number; // ρgQH_eff available hydraulic power [W]
  pGross: number; // ρgQH_g [W]
  etaRunner: number; // %
  etaOverall: number; // %

  zRec: number; // recommended bucket count
  Ns: number; // power specific speed (per jet)
  polesDirect: number; // poles for direct sync at f
  syncSpeed4: number; // 4-pole sync speed at f
  gearRatio: number; // belt ratio to a 4-pole machine

  annualMWh: number;
  revenueYen: number;

  curve: CurvePoint[];
  diagnostics: Diagnostic[];
}

/* ------------------------------------------------------------------ */
/* The model                                                           */
/* ------------------------------------------------------------------ */
export function computePelton(
  p: Params,
  nozzlesIn?: NozzleConfig[],
  nozSep?: number
): Result {
  const rho = waterDensity(p.Tw);
  const zetaFrac = p.zeta / 100;
  const Heff = p.Hg * (1 - zetaFrac);

  const thetaRad = (p.theta * Math.PI) / 180;
  const bucketFactor = 1 - p.k * Math.cos(thetaRad); // (1 − k cosθ)

  const v1 = p.Cv * Math.sqrt(2 * G * Heff);

  // per-nozzle configuration (flow split + incidence angle)
  const noz =
    nozzlesIn && nozzlesIn.length ? nozzlesIn : makeNozzles(p.zn);
  const wSum = noz.reduce((s, n) => s + n.weight, 0) || 1;
  const nozzles: NozzleResult[] = noz.map((n, index) => {
    const Qi = (p.Q * n.weight) / wSum;
    const ai = v1 > 0 ? Qi / v1 : 0; // jet cross-section area
    const di = Math.sqrt((4 * ai) / Math.PI);
    return {
      index,
      alpha: n.alpha,
      sharePct: (n.weight / wSum) * 100,
      Qi,
      di,
      ratioI: di > 0 ? p.D / di : 0,
    };
  });

  const dJetMax = Math.max(...nozzles.map((n) => n.di));
  const dJetMin = Math.min(...nozzles.map((n) => n.di));
  const dJet = dJetMax; // worst case for clearance/ratio checks
  const jetRatio = dJetMax > 0 ? p.D / dJetMax : 0;

  // flow-weighted mean incidence factor: only the tangential velocity
  // component v1·cosα drives the wheel.
  const cosAlphaEff =
    nozzles.reduce((s, n) => s + n.Qi * Math.cos((n.alpha * Math.PI) / 180), 0) /
    (p.Q || 1);

  // runner power as a function of peripheral speed u, summed over nozzles:
  //   Pw = Σ ρ Qi u (v1·cosαi − u)(1 − k cosθ)
  const runnerPower = (u: number) =>
    nozzles.reduce(
      (s, n) =>
        s +
        rho *
          n.Qi *
          u *
          (v1 * Math.cos((n.alpha * Math.PI) / 180) - u) *
          bucketFactor,
      0
    );

  // theoretical optimum (weighted vertex of the parabola sum)
  const uOpt = 0.5 * v1 * cosAlphaEff;
  const nOpt = (60 * uOpt) / (Math.PI * p.D);
  const pwMax = runnerPower(uOpt);

  // operating point at the chosen speed ratio φ
  const uOp = p.phi * v1;
  const nOp = (60 * uOp) / (Math.PI * p.D);
  const pwRunner = runnerPower(uOp);
  const omega = (2 * Math.PI * nOp) / 60;
  const torque = omega > 0 ? pwRunner / omega : 0;
  const pElec = pwRunner * p.etaGen * p.etaMech;

  const pWater = rho * G * p.Q * Heff;
  const pGross = rho * G * p.Q * p.Hg;
  const etaRunner = pWater > 0 ? (pwRunner / pWater) * 100 : 0;
  const etaOverall = pGross > 0 ? (pElec / pGross) * 100 : 0;

  // recommended bucket count (Taygun)
  const zRec = dJet > 0 ? 15 + p.D / (2 * dJet) : 0;

  // power specific speed per jet (metric, kW & m)
  const pElecPerJetKW = pElec / nozzles.length / 1000;
  const Ns =
    Heff > 0 && pElecPerJetKW > 0
      ? (nOp * Math.sqrt(pElecPerJetKW)) / Math.pow(Heff, 1.25)
      : 0;

  // generator matching
  const polesDirect = nOp > 0 ? (120 * p.f) / nOp : 0;
  const syncSpeed4 = (120 * p.f) / 4; // 1500 (50Hz) / 1800 (60Hz)
  const gearRatio = nOp > 0 ? syncSpeed4 / nOp : 0;

  // economics
  const annualMWh = (pElec / 1000) * 8760 * (p.cf / 100) / 1000;
  const revenueYen = (pElec / 1000) * 8760 * (p.cf / 100) * p.price;

  // characteristic curve (φ from 0 to 1)
  const SAMPLES = 80;
  const curve: CurvePoint[] = Array.from({ length: SAMPLES + 1 }, (_, i) => {
    const phi = i / SAMPLES;
    const u = phi * v1;
    const n = (60 * u) / (Math.PI * p.D);
    const pr = runnerPower(u);
    return {
      phi,
      u,
      n,
      pwRunner: pr,
      pwElec: pr * p.etaGen * p.etaMech,
      eta: pWater > 0 ? (pr / pWater) * 100 : 0,
    };
  });

  // design diagnostics
  const diagnostics: Diagnostic[] = [];

  diagnostics.push(
    jetRatio >= 10
      ? {
          label: "ノズル比 D/d",
          status: jetRatio > 30 ? "warn" : "ok",
          message:
            jetRatio > 30
              ? `${jetRatio.toFixed(1)}：噴流が細すぎ。直径を小さくするか流量を増やせます。`
              : `${jetRatio.toFixed(1)}：良好（推奨 10〜14）。`,
        }
      : {
          label: "ノズル比 D/d",
          status: jetRatio >= 7 ? "warn" : "bad",
          message: `${jetRatio.toFixed(
            1
          )}：噴流が太すぎ効率低下。直径Dを大きく／ノズル本数を増やしてください。`,
        }
  );

  diagnostics.push(
    p.phi >= 0.45 && p.phi <= 0.48
      ? {
          label: "周速比 φ",
          status: "ok",
          message: `${p.phi.toFixed(3)}：実機の最適域（0.45〜0.48）。`,
        }
      : {
          label: "周速比 φ",
          status: "warn",
          message: `${p.phi.toFixed(
            3
          )}：最適域0.45〜0.48から外れています。回転数の見直しを。`,
        }
  );

  const zDiff = p.Z - zRec;
  diagnostics.push(
    Math.abs(zDiff) <= 2
      ? {
          label: "バケット枚数 Z",
          status: "ok",
          message: `${p.Z}枚：推奨 ${zRec.toFixed(0)}枚に適合。`,
        }
      : {
          label: "バケット枚数 Z",
          status: "warn",
          message: `${p.Z}枚：推奨は約${zRec.toFixed(0)}枚（${
            zDiff > 0 ? "多すぎ" : "少なすぎ"
          }）。`,
        }
  );

  diagnostics.push(
    Ns <= 35
      ? {
          label: "比速度 Ns",
          status: "ok",
          message: `${Ns.toFixed(1)}：ペルトン水車の適正域（〜35）。`,
        }
      : {
          label: "比速度 Ns",
          status: Ns <= 60 ? "warn" : "bad",
          message: `${Ns.toFixed(
            1
          )}：高め。ノズル本数を増やすか、フランシス/クロスフロー水車も検討を。`,
        }
  );

  diagnostics.push(
    zetaFrac <= 0.12
      ? {
          label: "管路損失 ζ",
          status: "ok",
          message: `${p.zeta}%：許容範囲。`,
        }
      : {
          label: "管路損失 ζ",
          status: zetaFrac <= 0.2 ? "warn" : "bad",
          message: `${p.zeta}%：損失過大。導水管を太く／短くすると出力が回復します。`,
        }
  );

  // nozzle spacing balance (only meaningful with 2 nozzles)
  if (nozzles.length === 2 && nozSep && nozSep > 0) {
    const sepDeg = (nozSep * 360) / p.Z;
    const ideal = p.Z / 2; // half the wheel = 180° = balanced loading
    diagnostics.push(
      Math.abs(nozSep - ideal) <= 1
        ? {
            label: "ノズル間隔",
            status: "ok",
            message: `${nozSep}バケット分(${sepDeg.toFixed(
              0
            )}°)：ほぼ180°でラジアル荷重が打ち消し合い軸受に優しい配置。`,
          }
        : {
            label: "ノズル間隔",
            status: "warn",
            message: `${nozSep}バケット分(${sepDeg.toFixed(
              0
            )}°)：2本なら約${ideal.toFixed(
              0
            )}バケット分(180°)が荷重バランス上は理想です。`,
          }
    );
  }

  // incidence-angle loss (per-nozzle)
  const maxAlpha = Math.max(...nozzles.map((n) => n.alpha));
  const incidenceLossPct = (1 - cosAlphaEff) * 100;
  diagnostics.push(
    maxAlpha <= 5
      ? {
          label: "入射角 α",
          status: "ok",
          message: `最大${maxAlpha.toFixed(
            0
          )}°：ほぼ接線入射で損失わずか（−${incidenceLossPct.toFixed(1)}%）。`,
        }
      : {
          label: "入射角 α",
          status: maxAlpha <= 15 ? "warn" : "bad",
          message: `最大${maxAlpha.toFixed(
            0
          )}°：接線からの傾きで有効速度が低下（−${incidenceLossPct.toFixed(
            1
          )}%）。ノズルを接線方向へ。`,
        }
  );

  return {
    rho,
    Heff,
    zetaFrac,
    v1,
    dJet,
    dJetMin,
    dJetMax,
    jetRatio,
    bucketFactor,
    cosAlphaEff,
    nozzles,
    uOpt,
    nOpt,
    pwMax,
    uOp,
    nOp,
    pwRunner,
    torque,
    pElec,
    pWater,
    pGross,
    etaRunner,
    etaOverall,
    zRec,
    Ns,
    polesDirect,
    syncSpeed4,
    gearRatio,
    annualMWh,
    revenueYen,
    curve,
    diagnostics,
  };
}
