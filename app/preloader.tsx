"use client";

import { useEffect, useState } from "react";
import { categories, promotions } from "./menu-data";

const SESSION_KEY = "my-loft-preloader-seen";
const MINIMUM_VISIBLE_MS = 480;
const MAXIMUM_WAIT_MS = 5000;
const PROGRESS_FINISH_MS = 180;
const FADE_OUT_MS = 340;

const criticalImages = Array.from(
  new Set(
    [
      "/assets/logos/preloader-symbol.webp",
      "/assets/logos/mark.webp",
      "/assets/logos/wordmark.webp",
      promotions[0]?.image,
      ...categories.flatMap((category) => [
        category.images[0],
        ...(category.subsections?.map((subsection) => subsection.images[0]) ?? []),
      ]),
    ].filter((src): src is string => Boolean(src)),
  ),
);

const loadImage = (src: string) =>
  new Promise<void>((resolve) => {
    const image = new Image();
    image.fetchPriority = "high";
    image.decoding = "async";
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
    if (image.complete) resolve();
  });

export default function Preloader() {
  const [phase, setPhase] = useState<"loading" | "finishing" | "leaving">("loading");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let finishTimer = 0;
    let leaveTimer = 0;
    let hideTimer = 0;
    let completed = false;

    const unlockPage = () => document.documentElement.classList.remove("is-preloading");

    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) {
        void Promise.allSettled(criticalImages.map(loadImage));
        hideTimer = window.setTimeout(() => setVisible(false), 0);
        return () => window.clearTimeout(hideTimer);
      }
    } catch {
      // Continue without session persistence when browser storage is unavailable.
    }

    document.documentElement.classList.add("is-preloading");
    const startedAt = window.performance.now();

    const finish = () => {
      if (completed) return;
      completed = true;
      const remaining = Math.max(0, MINIMUM_VISIBLE_MS - (window.performance.now() - startedAt));
      finishTimer = window.setTimeout(() => {
        setPhase("finishing");
        try {
          window.sessionStorage.setItem(SESSION_KEY, "true");
        } catch {
          // The preloader still completes normally without session persistence.
        }
        leaveTimer = window.setTimeout(() => {
          setPhase("leaving");
          unlockPage();
          hideTimer = window.setTimeout(() => setVisible(false), FADE_OUT_MS);
        }, PROGRESS_FINISH_MS);
      }, remaining);
    };

    const maximumTimer = window.setTimeout(finish, MAXIMUM_WAIT_MS);
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    void Promise.allSettled([fontsReady, ...criticalImages.map(loadImage)]).then(finish);

    return () => {
      completed = true;
      window.clearTimeout(maximumTimer);
      window.clearTimeout(finishTimer);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
      unlockPage();
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`preloader is-${phase}`} role="status" aria-label="Загрузка меню MY Loft">
      <div className="preloader-content">
        <img src="/assets/logos/preloader-symbol.webp" alt="" />
        <div className="preloader-progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}
