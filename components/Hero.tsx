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
          <h1 className="hero-title">
            {t.title_1}
            <span className="italic-serif">{t.title_2}</span>
            {t.title_3}
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
            <div style={{ fontSize: 14 }}>{t.microtrust}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
