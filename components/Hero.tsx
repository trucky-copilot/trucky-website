"use client";

import { useEffect, useRef } from "react";
import { Icon } from "./Icons";
import { I18N, type Lang } from "@/lib/i18n";

type Props = {
  lang: Lang;
  onOpenDemo: () => void;
};

export function Hero({ lang, onOpenDemo }: Props) {
  const t = I18N[lang].hero;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  return (
    <section className="hero-cinematic" id="top">
      <div className="hero-video-wrap">
        <video
          ref={videoRef}
          className="hero-video"
          src="/hero-video.mp4"
          poster="/hero-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        <div className="hero-vignette" />
        <div className="hero-gradient-overlay" />
      </div>

      <div className="hero-content">
        <div className="container-tr">
          <div className="hero-badge-top">
            <span className="live-dot" />
            {t.badge}
          </div>
          <h1 className="hero-title">
            {t.title_1}
            <span className="italic-serif">{t.title_2}</span>
            {t.title_3}
            <span className="hero-title-accent">{t.title_4}</span>
            {t.title_5}
          </h1>
          <p className="hero-sub">{t.subtitle}</p>
          <div className="hero-cta">
            <button className="btn btn-primary btn-lg" onClick={onOpenDemo}>
              {t.cta_primary}
              <Icon name="arrowRight" width={18} height={18} />
            </button>
            <a className="btn btn-ghost-light btn-lg" href="#how">
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  fontSize: 9,
                  paddingLeft: 2,
                }}
              >
                ▶
              </span>
              {t.cta_secondary}
            </a>
          </div>
          <div className="hero-microtrust">
            <div className="ht-avatars">
              <span style={{ background: "linear-gradient(135deg,#ffb74a,#ff7a45)" }}>M</span>
              <span style={{ background: "linear-gradient(135deg,#4ade80,#22c55e)" }}>A</span>
              <span style={{ background: "linear-gradient(135deg,#38bdf8,#6366f1)" }}>J</span>
              <span style={{ background: "linear-gradient(135deg,#f472b6,#ec4899)" }}>K</span>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{t.microtrust_title}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
                {t.microtrust_sub}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-stats-bar">
        <div className="container-tr">
          <div className="trust-bar">
            {t.stats.map((s, i) => (
              <div key={i} className="trust-stat">
                <div className="num">{s.num}</div>
                <div className="label">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="trust-footnote">{t.stats_footnote}</div>
        </div>
      </div>
    </section>
  );
}
