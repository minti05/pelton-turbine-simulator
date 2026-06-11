"use client";

import * as React from "react";
import { GROUPS, type NozzleConfig } from "@/lib/pelton";

interface Props {
  D: number;
  theta: number; // degrees
  Z: number;
  N: number; // rpm
  v1: number; // m/s (label)
  u: number; // m/s (label)
  nozzles: NozzleConfig[];
  nozSep: number; // spacing between the 2 nozzles, in bucket pitches
  running: boolean; // animate?
}

const RUNNER = GROUPS.runner.hsl; // violet
const JET = GROUPS.nozzle.hsl; // sky
const WATER = GROUPS.water.hsl; // cyan
const SPIN = "#818cf8"; // indigo (rotation / peripheral speed)

/**
 * Animated, parameter-linked schematic of a Pelton wheel.
 * The jets enter tangent to the pitch circle (incidence angle α tilts them
 * off the tangent). The runner spins at a speed derived from N, and the jets
 * flow, so the energy transfer is visible.
 */
export default function TurbineDiagram({
  D,
  theta,
  Z,
  N,
  v1,
  u,
  nozzles,
  nozSep,
  running,
}: Props) {
  const cx = 165;
  const cy = 175;
  const R = 92;

  // buckets evenly spaced around the rim
  const buckets = Array.from({ length: Z }, (_, i) => {
    const a = (i / Z) * 2 * Math.PI - Math.PI / 2;
    return { deg: (a * 180) / Math.PI + 90, a };
  });

  // visible rotation period: faster N → shorter period, clamped to stay watchable
  const spinDur = Math.min(10, Math.max(0.5, 600 / Math.max(N, 1)));

  // ---- jets: tangential entry, optional incidence tilt ----
  const sepDeg = (nozSep * 360) / Z;
  const jets = nozzles.map((n, i) => {
    const thetaDeg = 90 + (i === 0 ? 0 : sepDeg); // #1 at bottom (6 o'clock)
    const th = (thetaDeg * Math.PI) / 180;
    const P = { x: cx + R * Math.cos(th), y: cy + R * Math.sin(th) };
    // CCW peripheral (tangent) direction at the impact point
    const tx = Math.sin(th);
    const ty = -Math.cos(th);
    // tilt the jet off the tangent by the incidence angle α
    const a = (n.alpha * Math.PI) / 180;
    const jdx = tx * Math.cos(a) - ty * Math.sin(a);
    const jdy = tx * Math.sin(a) + ty * Math.cos(a);
    const L = 78;
    const S = { x: P.x - L * jdx, y: P.y - L * jdy };
    const angDeg = (Math.atan2(jdy, jdx) * 180) / Math.PI;
    return { P, S, tx, ty, jdx, jdy, angDeg, alpha: n.alpha, idx: i };
  });

  const u0 = jets[0];

  return (
    <svg
      viewBox="0 0 440 360"
      className="h-full w-full"
      role="img"
      aria-label="ペルトン水車の模式図（回転アニメーション）"
    >
      <defs>
        <marker id="aJet" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={JET} />
        </marker>
        <marker id="aWater" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
          <path d="M0,0 L5,3 L0,6 Z" fill={WATER} />
        </marker>
        <marker id="aSpin" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={SPIN} />
        </marker>
        <marker id="aRun" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={RUNNER} />
        </marker>
        <linearGradient id="jetGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={WATER} stopOpacity="0.25" />
          <stop offset="100%" stopColor={JET} stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* ====================== rotating runner ====================== */}
      <g>
        {running && (
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from={`0 ${cx} ${cy}`}
            to={`-360 ${cx} ${cy}`}
            dur={`${spinDur}s`}
            repeatCount="indefinite"
          />
        )}

        {/* pitch circle */}
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke={RUNNER}
          strokeWidth={1.5}
          strokeDasharray="5 4"
          opacity={0.65}
        />
        {/* spokes */}
        {buckets.map((b, i) => (
          <line
            key={`s-${i}`}
            x1={cx}
            y1={cy}
            x2={cx + R * Math.cos(b.a)}
            y2={cy + R * Math.sin(b.a)}
            stroke="#334155"
            strokeWidth={1}
          />
        ))}
        {/* buckets */}
        {buckets.map((b, i) => (
          <g
            key={`b-${i}`}
            transform={`translate(${cx + R * Math.cos(b.a)} ${cy + R * Math.sin(b.a)}) rotate(${b.deg})`}
          >
            <path d="M -7 -4 C -7 5, 7 5, 7 -4" fill="#0f172a" stroke={RUNNER} strokeWidth={1.6} />
            <line x1={0} y1={-4} x2={0} y2={4} stroke={RUNNER} strokeWidth={1} opacity={0.55} />
          </g>
        ))}
        {/* hub */}
        <circle cx={cx} cy={cy} r={24} fill="#1e293b" stroke={RUNNER} strokeWidth={1.5} />
        <circle cx={cx} cy={cy} r={6} fill={RUNNER} />
        {/* a marker spoke so rotation is visible */}
        <line x1={cx} y1={cy} x2={cx} y2={cy - R} stroke={SPIN} strokeWidth={2} opacity={0.8} />
      </g>

      {/* rotation indicator (static) */}
      <g>
        <path
          d={`M ${cx + 30} ${cy - R - 18} A 50 50 0 0 0 ${cx - 30} ${cy - R - 18}`}
          fill="none"
          stroke={SPIN}
          strokeWidth={2}
          markerEnd="url(#aSpin)"
          opacity={0.9}
        />
        <text x={cx} y={cy - R - 26} fill={SPIN} fontSize="11" fontFamily="monospace" textAnchor="middle">
          N = {N.toFixed(0)} rpm
        </text>
      </g>

      {/* ---- diameter D (horizontal, through centre) ---- */}
      <g>
        <line
          x1={cx - R}
          y1={cy}
          x2={cx + R}
          y2={cy}
          stroke={RUNNER}
          strokeWidth={1.2}
          markerStart="url(#aRun)"
          markerEnd="url(#aRun)"
          opacity={0.85}
        />
        <rect x={cx - 64} y={cy - 20} width={128} height={17} rx={4} fill="#0b1220" opacity={0.9} />
        <text x={cx} y={cy - 8} fill={RUNNER} fontSize="11" fontFamily="monospace" textAnchor="middle">
          ピッチ円直径 D = {D.toFixed(2)} m
        </text>
      </g>

      {/* ====================== nozzles & jets ====================== */}
      {jets.map((j) => {
        const t = 6 / Math.hypot(j.P.x - j.S.x, j.P.y - j.S.y);
        const jx = j.S.x + (j.P.x - j.S.x) * t;
        const jy = j.S.y + (j.P.y - j.S.y) * t;
        return (
          <g key={j.idx}>
            {/* nozzle body, aligned with the jet */}
            <g transform={`translate(${j.S.x} ${j.S.y}) rotate(${j.angDeg})`}>
              <rect x={-20} y={-8} width={8} height={16} rx={2} fill="#334155" />
              <path d="M -13 -7 L 4 -4 L 4 4 L -13 7 Z" fill="#1e293b" stroke={JET} strokeWidth={1.4} />
            </g>
            {/* jet stream */}
            <line
              x1={jx}
              y1={jy}
              x2={j.P.x}
              y2={j.P.y}
              stroke="url(#jetGrad)"
              strokeWidth={5}
              markerEnd="url(#aJet)"
              strokeLinecap="round"
            />
            {/* flowing water particles along the jet */}
            <line
              x1={jx}
              y1={jy}
              x2={j.P.x}
              y2={j.P.y}
              stroke="#e0f2fe"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="3 9"
              opacity={0.9}
            >
              {running && (
                <animate
                  attributeName="stroke-dashoffset"
                  from="12"
                  to="0"
                  dur="0.35s"
                  repeatCount="indefinite"
                />
              )}
            </line>
            {/* splash droplets at impact */}
            {running &&
              [0, 1, 2].map((d) => (
                <circle key={d} r={1.8} fill={WATER} opacity={0}>
                  <animateMotion
                    dur="0.6s"
                    begin={`${d * 0.2}s`}
                    repeatCount="indefinite"
                    path={`M ${j.P.x} ${j.P.y} q ${-j.jdy * 16 + j.jdx * 6} ${j.jdx * 16 + j.jdy * 6} ${-j.jdy * 22} ${j.jdx * 22 + 10}`}
                  />
                  <animate attributeName="opacity" values="0;0.9;0" dur="0.6s" begin={`${d * 0.2}s`} repeatCount="indefinite" />
                </circle>
              ))}
            {/* per-nozzle label */}
            <text
              x={j.S.x}
              y={j.S.y - 11}
              fill={JET}
              fontSize="10"
              fontFamily="monospace"
              textAnchor="middle"
            >
              #{j.idx + 1}
              {j.alpha > 0 ? ` α${j.alpha.toFixed(0)}°` : ""}
            </text>
          </g>
        );
      })}

      {/* peripheral speed u at nozzle #1 impact */}
      {u0 && (
        <g>
          <line
            x1={u0.P.x}
            y1={u0.P.y}
            x2={u0.P.x + u0.tx * 34}
            y2={u0.P.y + u0.ty * 34}
            stroke={SPIN}
            strokeWidth={2}
            markerEnd="url(#aSpin)"
          />
          <text
            x={u0.P.x + u0.tx * 40}
            y={u0.P.y + u0.ty * 34 + 4}
            fill={SPIN}
            fontSize="10"
            fontFamily="monospace"
          >
            u = {u.toFixed(1)} m/s
          </text>
        </g>
      )}

      {/* jet speed label */}
      <text x={12} y={26} fill={JET} fontSize="11" fontFamily="monospace">
        噴流 v₁ = {v1.toFixed(1)} m/s
      </text>
      {nozzles.length === 2 && (
        <text x={12} y={42} fill={JET} fontSize="10" fontFamily="monospace">
          ノズル間隔 {nozSep} 個 ({sepDeg.toFixed(0)}°)
        </text>
      )}

      {/* ====================== bucket detail inset (θ) ====================== */}
      <BucketDetail theta={theta} />
    </svg>
  );
}

/* Cross-section of one bucket showing the deflection angle θ. */
function BucketDetail({ theta }: { theta: number }) {
  const ox = 360;
  const oy = 292;
  const L = 30;
  const half = ((180 - theta) * Math.PI) / 180;
  const exitAng1 = Math.PI - half;
  const exitAng2 = -(Math.PI - half);
  const e1 = { x: ox + L * Math.cos(exitAng1), y: oy + L * Math.sin(exitAng1) };
  const e2 = { x: ox + L * Math.cos(exitAng2), y: oy + L * Math.sin(exitAng2) };

  return (
    <g>
      <rect x={300} y={236} width={132} height={108} rx={8} fill="#0b1220" stroke="#1e293b" strokeWidth={1} />
      <text x={366} y={252} fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
        バケット断面（偏向角 θ）
      </text>
      {/* bucket cup */}
      <path
        d={`M ${ox + 6} ${oy - 20} C ${ox - 24} ${oy - 20}, ${ox - 24} ${oy + 20}, ${ox + 6} ${oy + 20}`}
        fill="none"
        stroke={RUNNER}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <line x1={ox - 16} y1={oy} x2={ox + 6} y2={oy} stroke={RUNNER} strokeWidth={1} opacity={0.5} />
      {/* incoming jet */}
      <line x1={ox + 38} y1={oy} x2={ox + 4} y2={oy} stroke={JET} strokeWidth={3} markerEnd="url(#aJet)" strokeLinecap="round" />
      {/* split outgoing streams */}
      <line x1={ox - 6} y1={oy} x2={e1.x} y2={e1.y} stroke={WATER} strokeWidth={2} markerEnd="url(#aWater)" strokeLinecap="round" />
      <line x1={ox - 6} y1={oy} x2={e2.x} y2={e2.y} stroke={WATER} strokeWidth={2} markerEnd="url(#aWater)" strokeLinecap="round" />
      <text x={ox - 22} y={oy + 30} fill="#f8fafc" fontSize="11" fontFamily="monospace">
        θ = {theta.toFixed(0)}°
      </text>
    </g>
  );
}
