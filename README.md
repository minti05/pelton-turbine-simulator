# ペルトン水車 流体・発電最適化シミュレータ

マイクロ水力発電向けに、ペルトン水車の流体力学・発電性能をリアルタイムに可視化・最適化するWebアプリケーションWebアプリです。落差・流量・水車形状などのパラメータを入力すると、オイラーの水車方程式に基づく理論値（回転数・トルク・出力）と特性曲線が即座に更新されます。

🔗 **公開サイト: https://pelton-turbine-sim.web.app**

## 主な機能

- **16項目のパラメータ入力** — 水資源/ノズル/ランナ/発電の4グループに整理。各項目に非専門家向けの解説付き
- **アニメーション付き水車モデル図解** — 実際の回転・水流をSVGで再現し、各パラメータが機械のどこに対応するかを色分け表示
- **ノズル個別設定（1〜2本）** — ノズルごとの入射角・流量配分、2本の間隔（バケット数）を設定可能
- **リアルタイム特性曲線** — 出力・効率 vs 周速のグラフ（Recharts）。理論最適点と運転点をハイライト
- **設計診断** — ノズル比・周速比・比速度などを経験則で自動チェック
- **経済性試算** — 年間発電量・年間収益
- **理論解説ページ** — ベルヌーイの定理〜オイラーの水車方程式〜比速度までを平易に解説

## 技術スタック

- [Next.js 14](https://nextjs.org/)（App Router, TypeScript, 静的エクスポート）
- [Tailwind CSS](https://tailwindcss.com/) + shadcn/ui スタイルのコンポーネント
- [Recharts](https://recharts.org/)（グラフ）
- [lucide-react](https://lucide.dev/)（アイコン）
- [Firebase Hosting](https://firebase.google.com/docs/hosting)（ホスティング）

## ローカル開発

```bash
npm install
npm run dev      # http://localhost:3000
```

## ビルド

```bash
npm run build    # 静的サイトを ./out に出力
```

## デプロイ

`main` ブランチに push すると、GitHub Actions が自動でビルドして Firebase Hosting にデプロイします
（[.github/workflows/firebase-hosting-merge.yml](.github/workflows/firebase-hosting-merge.yml)）。

手動デプロイ:

```bash
npm run build
firebase deploy --only hosting
```
