import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Droplets,
  Wind,
  RotateCw,
  Zap,
  Target,
  Gauge,
  Ruler,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "理論解説 | ペルトン水車シミュレータ",
  description:
    "ペルトン水車の流体力学・発電理論：ベルヌーイの定理、オイラーの水車方程式、最適周速比、効率、比速度の導出を平易に解説。",
};

/* ----------------------------- math helpers ----------------------------- */
function Eq({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-border bg-secondary/40 px-5 py-4 text-center text-base">
      <span className="font-mono tracking-tight text-foreground">{children}</span>
    </div>
  );
}
function V({ children }: { children: React.ReactNode }) {
  // an italic variable symbol
  return <span className="italic text-primary">{children}</span>;
}

/* ------------------------------- sections ------------------------------- */
export default function TheoryPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        ダッシュボードに戻る
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          ペルトン水車の理論
        </h1>
        <p className="mt-2 text-muted-foreground">
          高い落差から噴き出す水の<strong className="text-foreground">運動量</strong>を、
          バケット（お椀状の羽根）で受け止めて回転に変える——その仕組みを、
          式の意味がわかるように順を追って解説します。数式は怖くありません。
        </p>
      </div>

      {/* energy chain */}
      <Section icon={Zap} title="0. エネルギー変換の流れ">
        <p>
          発電とは結局「水の持つエネルギーを電気に移し替える」ことです。ペルトン水車では
          次の4段階を通ります。各段階で少しずつロスが出ます。
        </p>
        <div className="my-4 grid gap-2 sm:grid-cols-4">
          <Stage icon={Droplets} title="位置E" sub="高い所の水" body="落差 H" />
          <Stage icon={Wind} title="運動E" sub="噴流の速さ" body="v₁ = Cv√(2gH)" />
          <Stage icon={RotateCw} title="機械E" sub="軸の回転" body="Pw, T, N" />
          <Stage icon={Zap} title="電気E" sub="発電機出力" body="P·η" />
        </div>
        <p className="text-sm text-muted-foreground">
          以降のセクションは、この矢印を1本ずつ式にしていく作業です。
        </p>
      </Section>

      {/* head */}
      <Section icon={Droplets} title="1. 落差と有効落差">
        <p>
          <V>Hg</V>（総落差）は取水口と水車の標高差です。しかし水が導水管を流れる間に
          摩擦でエネルギーの一部が失われるため、実際にノズルで使えるのは
          <strong className="text-foreground"> 有効落差 </strong>
          <V>H</V> だけです。
        </p>
        <Eq>
          <V>H</V> = <V>Hg</V> · (1 − <V>ζ</V>)
        </Eq>
        <p>
          <V>ζ</V>（ゼータ）は損失の割合。配管が細い・長い・流量が多いほど大きくなります。
          ここを小さく保つことが、地味ですが最も効く改善のひとつです。
        </p>
      </Section>

      {/* nozzle */}
      <Section icon={Wind} title="2. ノズル：落差が速さに変わる（ベルヌーイの定理）">
        <p>
          エネルギー保存則（ベルヌーイの定理）によれば、高さ <V>H</V> ぶんの位置エネルギーが
          すべて運動エネルギーに変わると、噴流速度は次式になります。
        </p>
        <Eq>
          ½ <V>v</V>² = <V>g</V><V>H</V> &nbsp;⇒&nbsp; <V>v</V> = √(2<V>g</V>
          <V>H</V>)
        </Eq>
        <p>
          実際のノズルには摩擦があるので、速度係数 <V>Cv</V>（0.96〜0.98）を掛けて補正します。
        </p>
        <Eq>
          <V>v₁</V> = <V>Cv</V> · √(2<V>g</V><V>H</V>)
        </Eq>
        <p className="text-sm text-muted-foreground">
          例：H=5m なら √(2·9.81·5)=9.9 m/s。Cv=0.97 で v₁≈9.6 m/s。約34km/hの水の矢です。
        </p>
      </Section>

      {/* euler */}
      <Section icon={Target} title="3. バケットでの運動量交換（オイラーの水車方程式）">
        <p>
          ここが心臓部です。速さ <V>v₁</V> の噴流が、周速 <V>u</V> で逃げていくバケットに
          追いつきます。バケットから見た水の<strong className="text-foreground">相対速度</strong>は
          (<V>v₁</V> − <V>u</V>)。バケットはこの水をほぼUターン（偏向角 <V>θ</V>）させ、
          反対向きに弾き返すことで反作用の力を受けます。
        </p>
        <p>
          運動量の変化から、噴流がバケットに与える力は次のようになります（<V>ρ</V>は水の密度、
          <V>Q</V>は流量、<V>k</V>はバケット表面摩擦による相対速度の減衰）。
        </p>
        <Eq>
          <V>F</V> = <V>ρ</V><V>Q</V>(<V>v₁</V> − <V>u</V>)(1 − <V>k</V>·cos
          <V>θ</V>)
        </Eq>
        <p>
          力 × 速度 = 仕事率（パワー）なので、バケットが受け取る水動力は力に <V>u</V> を掛けて：
        </p>
        <Eq>
          <V>Pw</V> = <V>F</V>·<V>u</V> = <V>ρ</V><V>Q</V><V>u</V>(<V>v₁</V> −{" "}
          <V>u</V>)(1 − <V>k</V>·cos<V>θ</V>)
        </Eq>
        <p className="text-sm text-muted-foreground">
          これが「オイラーの水車方程式」をペルトン水車に適用した形です。本シミュレータの出力計算の中核です。
        </p>
      </Section>

      {/* optimum */}
      <Section icon={Gauge} title="4. なぜ「周速＝噴流速度の半分」が最適なのか">
        <p>
          上の <V>Pw</V> を <V>u</V> の関数として見ると、<V>u</V>(<V>v₁</V>−<V>u</V>)
          という<strong className="text-foreground">上に凸の放物線</strong>です。
          バケットが止まっていれば(u=0)仕事をせず、噴流と同じ速さで逃げれば(u=v₁)水を捕まえられない。
          その中間に最大値があります。
        </p>
        <p>微分してゼロになる点を探すと：</p>
        <Eq>
          d<V>Pw</V>/d<V>u</V> = <V>ρ</V><V>Q</V>(1 − <V>k</V>cos<V>θ</V>)(<V>v₁</V>{" "}
          − 2<V>u</V>) = 0 &nbsp;⇒&nbsp; <V>u</V> = <V>v₁</V> / 2
        </Eq>
        <p>
          つまり理論上は周速比 <V>φ</V> = <V>u</V>/<V>v₁</V> = 0.5 で出力最大。
          実機では摩擦などの影響で <V>φ</V> ≈ 0.45〜0.48 が最適になります。
          ダッシュボードのグラフの「山の頂上」がまさにこの点です。
        </p>
      </Section>

      {/* theta & k */}
      <Section icon={Target} title="5. 偏向角 θ とバケット係数 k">
        <p>
          係数 (1 − <V>k</V>·cos<V>θ</V>) は「水をどれだけ綺麗に弾き返せるか」を表します。
        </p>
        <ul className="my-3 space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>
              <strong className="text-foreground">θ = 180°</strong>（完全反転）なら
              cosθ = −1 で係数は (1+k)。理論上の最大ですが、出た水が次に入る水と衝突するため実現不可。
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>
              実機は <strong className="text-foreground">θ ≈ 165°</strong> 程度に抑えます。
              cos165°≈−0.97 なので係数 ≈ 1+0.97k。
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>
              <strong className="text-foreground">k</strong>（0.85〜0.90）はバケット表面の摩擦。
              鏡面に磨くほど 1 に近づき、出力が増えます。
            </span>
          </li>
        </ul>
      </Section>

      {/* torque & speed */}
      <Section icon={RotateCw} title="6. 回転数とトルク">
        <p>
          周速 <V>u</V>（バケットの接線速度）と回転数 <V>N</V>[rpm] は、ピッチ円直径 <V>D</V> を介して結びつきます。
        </p>
        <Eq>
          <V>u</V> = π<V>D</V><V>N</V>/60 &nbsp;⇒&nbsp; <V>N</V> = 60<V>u</V> / (π
          <V>D</V>)
        </Eq>
        <p>
          同じ <V>u</V> でも直径 <V>D</V> が大きいほどゆっくり回り（低回転）、そのぶんトルクが大きくなります。
          トルク <V>T</V> は出力を角速度 <V>ω</V>=2π<V>N</V>/60 で割って求めます。
        </p>
        <Eq>
          <V>T</V> = <V>Pw</V> / <V>ω</V> = 60·<V>Pw</V> / (2π<V>N</V>)
        </Eq>
      </Section>

      {/* efficiency */}
      <Section icon={Zap} title="7. 効率の階層と電気出力">
        <p>
          入口で水が持っていたエネルギー <V>ρgQH</V> から、各段階の効率を掛けていくと最終的な電気出力になります。
        </p>
        <Eq>
          <V>P_elec</V> = <V>Pw</V> · <V>η</V>
          <sub>gen</sub> · <V>η</V>
          <sub>mech</sub>
        </Eq>
        <Eq>
          総合効率 <V>η</V> = <V>P_elec</V> / (<V>ρ</V><V>g</V><V>Q</V>
          <V>Hg</V>)
        </Eq>
        <p className="text-sm text-muted-foreground">
          η_gen は発電機の変換効率、η_mech は軸受やベルトの機械損失。総合効率は総落差を基準にとり、
          管路損失も含めた「最終的に何%電気になったか」を示します。良い小水力で70〜85%程度です。
        </p>
      </Section>

      {/* specific speed */}
      <Section icon={Gauge} title="8. 比速度 Ns ：水車形式を選ぶ指標">
        <p>
          比速度は「その落差・出力にどんな形の水車が向くか」を1つの数字で表す設計指標です。
        </p>
        <Eq>
          <V>Ns</V> = <V>N</V>·√<V>P</V> / <V>H</V>
          <sup>5/4</sup>
        </Eq>
        <p>
          ペルトン水車は<strong className="text-foreground">高落差・小流量</strong>向きで、比速度は小さい領域
          （概ね Ns ≲ 35、1ノズルあたり）。これより大きくなると、ノズルを増やすか、
          フランシス水車やクロスフロー水車のほうが適します。ダッシュボードの「設計診断」がこれを自動判定します。
        </p>
      </Section>

      {/* geometry */}
      <Section icon={Ruler} title="9. ノズル比・バケット枚数の設計指針">
        <p>
          噴流の太さ <V>d</V> は流量と速度から決まります（zₙ はノズル本数）。
        </p>
        <Eq>
          <V>d</V> = √( 4<V>Q</V> / (<V>zₙ</V> π <V>v₁</V>) )
        </Eq>
        <ul className="my-3 space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>
              <strong className="text-foreground">ノズル比 D/d</strong>：10〜14が目安。小さい（噴流が太い）と
              バケットに収まりきらず効率低下。直径を上げるかノズルを増やします。
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>
              <strong className="text-foreground">バケット枚数</strong> Z ≈ 15 + D/(2d)。
              水を取りこぼさず、かつ隣のバケットの影にならない枚数です。
            </span>
          </li>
        </ul>
      </Section>

      {/* incidence angle & multi-nozzle */}
      <Section icon={Target} title="10. 入射角 α と複数ノズル">
        <p>
          理想的には噴流はピッチ円に<strong className="text-foreground">接線方向</strong>に当たり、
          速度のすべてがバケットの回転方向を向きます。しかし噴流が接線から角度
          <V>α</V> だけ傾いて当たると、回転に効くのは速度の接線成分
          <V>v₁</V>·cos<V>α</V> だけになります。
        </p>
        <Eq>
          <V>Pw</V> = <V>ρ</V><V>Q</V><V>u</V>(<V>v₁</V>·cos<V>α</V> − <V>u</V>)(1
          − <V>k</V>·cos<V>θ</V>)
        </Eq>
        <p>
          α=0°なら従来式に一致し、α が増えるほど cos<V>α</V> が 1 より小さくなって出力が落ちます
          （例：α=20°で約6%減）。このため最適周速比も <V>φ</V> = cos<V>α</V>/2 へと小さい側に移動します。
        </p>
        <p className="mt-3">
          複数ノズル（<V>zₙ</V> 本）では、各ノズルが同じランナを回すので出力は単純に足し合わさります。
          ノズルごとに入射角や流量配分が違ってもよく、本シミュレータは次のように総和をとります。
        </p>
        <Eq>
          <V>Pw</V> = Σᵢ <V>ρ</V><V>Qᵢ</V><V>u</V>(<V>v₁</V>·cos<V>αᵢ</V> −{" "}
          <V>u</V>)(1 − <V>k</V>·cos<V>θ</V>)
        </Eq>
        <p className="text-sm text-muted-foreground">
          ダッシュボードの「ノズル個別設定」で、各ノズルの α と流量配分を別々に動かして影響を確かめられます。
          流量を複数本に分けると1本あたりの噴流が細くなり（ノズル比が改善し）、同じランナをより高速に回せます。
        </p>
      </Section>

      {/* symbol table */}
      <Section icon={Ruler} title="11. 記号一覧">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">記号</th>
                <th className="py-2 pr-4 font-medium">意味</th>
                <th className="py-2 font-medium">単位</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {SYMBOLS.map((s) => (
                <tr key={s.sym} className="border-b border-border/50">
                  <td className="py-1.5 pr-4 text-primary">{s.sym}</td>
                  <td className="py-1.5 pr-4 font-sans text-foreground">{s.desc}</td>
                  <td className="py-1.5 text-muted-foreground">{s.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="mt-10 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-5 py-4">
        <div>
          <div className="font-medium">実際に数字を動かしてみましょう</div>
          <div className="text-sm text-muted-foreground">
            各式がリアルタイムでグラフに反映されます。
          </div>
        </div>
        <Link
          href="/"
          className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          シミュレータへ →
        </Link>
      </div>
    </main>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mb-5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 leading-relaxed text-foreground/90 [&_p]:text-foreground/90">
        {children}
      </CardContent>
    </Card>
  );
}

function Stage({
  icon: Icon,
  title,
  sub,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3 text-center">
      <Icon className="mx-auto h-5 w-5 text-primary" />
      <div className="mt-1.5 text-sm font-semibold">{title}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
      <div className="mt-1 font-mono text-[11px] text-primary">{body}</div>
    </div>
  );
}

const SYMBOLS = [
  { sym: "Hg, H", desc: "総落差・有効落差", unit: "m" },
  { sym: "ζ", desc: "管路損失率", unit: "%" },
  { sym: "Q", desc: "流量", unit: "m³/s" },
  { sym: "ρ", desc: "水の密度", unit: "kg/m³" },
  { sym: "g", desc: "重力加速度 (9.81)", unit: "m/s²" },
  { sym: "Cv", desc: "ノズル速度係数", unit: "—" },
  { sym: "v₁", desc: "噴流速度", unit: "m/s" },
  { sym: "u", desc: "バケット周速", unit: "m/s" },
  { sym: "φ", desc: "周速比 u/v₁", unit: "—" },
  { sym: "D", desc: "ピッチ円直径", unit: "m" },
  { sym: "θ", desc: "偏向角", unit: "°" },
  { sym: "k", desc: "バケット速度係数", unit: "—" },
  { sym: "N", desc: "回転数", unit: "rpm" },
  { sym: "T", desc: "トルク", unit: "N·m" },
  { sym: "Pw", desc: "ランナ水動力", unit: "W" },
  { sym: "η", desc: "効率", unit: "—" },
  { sym: "Ns", desc: "比速度", unit: "—" },
];
