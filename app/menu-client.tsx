"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  categories as fallbackCategories,
  type MenuCategory,
  type MenuLine,
  type Promotion,
  promotions as fallbackPromotions,
  settings,
} from "./menu-data";
import {
  fetchMenuContent,
  readCachedMenuContent,
  type MenuContentDocument,
  writeCachedMenuContent,
} from "./content-runtime";

const fallbackContent: MenuContentDocument = {
  version: 1,
  promotions: fallbackPromotions,
  categories: fallbackCategories,
};

const SLOW_IMAGE_THRESHOLD_MS = 850;
const DESCRIPTION_CLOSE_MS = 300;

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

function usePageVisibility() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const update = () => setVisible(document.visibilityState === "visible");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  return visible;
}

function useMenuContent() {
  const [content, setContent] = useState<MenuContentDocument>(fallbackContent);

  useEffect(() => {
    if (!settings.contentEndpoint) return;

    const cached = readCachedMenuContent(settings.contentCacheKey);
    const cachedTimer = cached ? window.setTimeout(() => setContent(cached), 0) : 0;

    const controller = new AbortController();
    void fetchMenuContent(settings.contentEndpoint, controller.signal)
      .then((nextContent) => {
        setContent(nextContent);
        writeCachedMenuContent(settings.contentCacheKey, nextContent);
      })
      .catch(() => {
        // Keep the complete cached or bundled fallback document without mixing partial data.
      });

    return () => {
      if (cachedTimer) window.clearTimeout(cachedTimer);
      controller.abort();
    };
  }, []);

  return content;
}

function ResilientImage({
  src,
  alt,
  className,
  loading = "lazy",
}: {
  src: string;
  alt: string;
  className: string;
  loading?: "eager" | "lazy";
}) {
  const [status, setStatus] =
    useState<"loading" | "slow" | "loaded" | "error">("loading");
  const imageRef = useCallback((image: HTMLImageElement | null) => {
    if (!image?.complete) return;
    const nextStatus = image.naturalWidth > 0 ? "loaded" : "error";
    window.setTimeout(() => setStatus(nextStatus), 0);
  }, []);

  useEffect(() => {
    const slowTimer = window.setTimeout(
      () => setStatus((current) => (current === "loading" ? "slow" : current)),
      SLOW_IMAGE_THRESHOLD_MS,
    );
    return () => window.clearTimeout(slowTimer);
  }, [src]);

  return (
    <img
      ref={imageRef}
      src={src}
      alt={alt}
      className={`${className} image-${status}`}
      loading={loading}
      decoding="async"
      onLoad={() => setStatus("loaded")}
      onError={() => setStatus("error")}
    />
  );
}

function DecorativeCarousel({
  images,
  running = true,
  phaseOffsetMs = 0,
  intervalOffsetMs = 0,
}: {
  images: string[];
  running?: boolean;
  phaseOffsetMs?: number;
  intervalOffsetMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const reducedMotion = useReducedMotion();
  const pageVisible = usePageVisibility();

  const renderedIndexes = useMemo(() => {
    if (images.length < 2) return images.length ? [0] : [];
    return Array.from(
      new Set([
        (index - 1 + images.length) % images.length,
        index,
        (index + 1) % images.length,
      ]),
    );
  }, [images.length, index]);

  useEffect(() => {
    if (images.length < 2 || reducedMotion || !pageVisible || !running) return;
    let interval = 0;
    const advance = () => setIndex((current) => (current + 1) % images.length);
    const intervalMs = settings.bannerIntervalMs + intervalOffsetMs;
    const timeout = window.setTimeout(() => {
      advance();
      interval = window.setInterval(advance, intervalMs);
    }, intervalMs + phaseOffsetMs);

    return () => {
      window.clearTimeout(timeout);
      if (interval) window.clearInterval(interval);
    };
  }, [images.length, intervalOffsetMs, pageVisible, phaseOffsetMs, reducedMotion, running]);

  return (
    <div className="decorative-carousel" aria-hidden="true">
      {renderedIndexes.map((imageIndex) => (
        <ResilientImage
          key={images[imageIndex]}
          src={images[imageIndex]}
          alt=""
          className={imageIndex === index ? "is-visible" : ""}
          loading={imageIndex === index ? "eager" : "lazy"}
        />
      ))}
    </div>
  );
}

function PromoCarousel({ promotions }: { promotions: Promotion[] }) {
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const reducedMotion = useReducedMotion();
  const pageVisible = usePageVisibility();
  const currentIndex = promotions.length ? index % promotions.length : 0;

  useEffect(() => {
    if (promotions.length < 2 || reducedMotion || !pageVisible) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % promotions.length),
      settings.promoIntervalMs,
    );
    return () => window.clearInterval(timer);
  }, [pageVisible, promotions.length, reducedMotion]);

  useEffect(() => {
    if (promotions.length < 2) return;
    const nextImage = new Image();
    nextImage.src = promotions[(currentIndex + 1) % promotions.length].image;
  }, [currentIndex, promotions]);

  const finishSwipe = (x: number) => {
    if (startX.current === null || promotions.length < 2) return;
    const distance = x - startX.current;
    if (Math.abs(distance) > 42) {
      suppressClick.current = true;
      setIndex((current) =>
        distance < 0
          ? (current + 1) % promotions.length
          : (current - 1 + promotions.length) % promotions.length,
      );
    }
    startX.current = null;
  };

  if (!promotions.length) return null;

  return (
    <section className="promo" aria-label="Акции и предложения">
      <div
        className="promo-viewport"
        onTouchStart={(event) => (startX.current = event.touches[0]?.clientX ?? null)}
        onTouchEnd={(event) => finishSwipe(event.changedTouches[0]?.clientX ?? 0)}
      >
        <div
          className="promo-track"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          role="button"
          tabIndex={0}
          aria-label="Показать следующую акцию"
          onClick={() => {
            if (suppressClick.current) {
              suppressClick.current = false;
              return;
            }
            if (promotions.length > 1) {
              setIndex((current) => (current + 1) % promotions.length);
            }
          }}
          onKeyDown={(event) => {
            if (promotions.length > 1 && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              setIndex((current) => (current + 1) % promotions.length);
            }
          }}
        >
          {promotions.map((promotion, promotionIndex) => (
            <div
              className={`promo-slide promo-slide-${promotion.variant}`}
              key={`${promotion.id}-${promotion.image}`}
            >
              <ResilientImage
                className="promo-background"
                src={promotion.image}
                alt={promotion.alt}
                loading={promotionIndex === currentIndex ? "eager" : "lazy"}
              />
              <div className={`promo-copy promo-copy-${promotion.variant}`} aria-hidden="true">
                <img src="/assets/logos/mark.webp" alt="" />
                <div>
                  <span>{promotion.eyebrow}</span>
                  <strong>{promotion.title}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
        {promotions.length > 1 && (
          <div className="promo-dots" aria-label="Слайды акции">
            {promotions.map((promotion, dotIndex) => (
              <button
                key={promotion.id}
                className={dotIndex === currentIndex ? "is-active" : ""}
                onClick={() => setIndex(dotIndex)}
                aria-label={`Показать предложение ${dotIndex + 1}`}
                aria-current={dotIndex === currentIndex ? "true" : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

type DescriptionSelection = {
  item: MenuLine;
  volume?: string;
  price?: string;
  trigger: HTMLButtonElement;
};

function DescribedItemName({ name }: { name: string }) {
  const lastSpaceIndex = name.lastIndexOf(" ");
  const prefix = lastSpaceIndex >= 0 ? name.slice(0, lastSpaceIndex + 1) : "";
  const tail = lastSpaceIndex >= 0 ? name.slice(lastSpaceIndex + 1) : name;

  return (
    <span className="price-name">
      {prefix}
      <span className="price-name-tail">
        {tail}
        <span className="description-info" aria-hidden="true">i</span>
      </span>
    </span>
  );
}

function PriceList({
  items,
  volume,
  price,
  onDescribe,
}: {
  items: MenuLine[];
  volume?: string;
  price?: string;
  onDescribe: (selection: DescriptionSelection) => void;
}) {
  return (
    <div className="price-list">
      {items.map((item) => (
        <div className="price-entry" key={item.name}>
          {item.description ? (
            <button
              className="price-row price-row-button"
              type="button"
              aria-label={`${item.name}. Подробнее`}
              onClick={(event) =>
                onDescribe({
                  item,
                  volume,
                  price: item.price ?? price,
                  trigger: event.currentTarget,
                })
              }
            >
              <DescribedItemName name={item.name} />
              {item.price && <strong>{item.price}</strong>}
            </button>
          ) : (
            <div className="price-row">
              <span>{item.name}</span>
              {item.price && <strong>{item.price}</strong>}
            </div>
          )}
          {item.details && (
            <ul>
              {item.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function DescriptionSheet({
  selection,
  reducedMotion,
  onClose,
}: {
  selection: DescriptionSelection;
  reducedMotion: boolean;
  onClose: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dragStartYRef = useRef<number | null>(null);
  const dragOffsetRef = useRef(0);
  const dragMovedRef = useRef(false);
  const closeTimerRef = useRef(0);

  const requestClose = useCallback(() => {
    if (closing) return;
    if (reducedMotion) {
      onClose();
      return;
    }
    setClosing(true);
    closeTimerRef.current = window.setTimeout(onClose, DESCRIPTION_CLOSE_MS);
  }, [closing, onClose, reducedMotion]);

  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".page-shell");
    const body = document.body;
    const html = document.documentElement;
    const scrollY = window.scrollY;
    const previousBodyStyles = {
      overflow: body.style.overflow,
    };
    const previousHtmlStyles = {
      overflow: html.style.overflow,
      scrollBehavior: html.style.scrollBehavior,
    };
    const pageWasInert = page?.hasAttribute("inert") ?? false;

    page?.setAttribute("inert", "");
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    closeButtonRef.current?.focus({ preventScroll: true });

    return () => {
      window.clearTimeout(closeTimerRef.current);
      if (!pageWasInert) page?.removeAttribute("inert");
      body.style.overflow = previousBodyStyles.overflow;
      html.style.overflow = previousHtmlStyles.overflow;
      html.style.scrollBehavior = "auto";
      window.scrollTo(0, scrollY);
      window.requestAnimationFrame(() => {
        html.style.scrollBehavior = previousHtmlStyles.scrollBehavior;
        selection.trigger.focus({ preventScroll: true });
      });
    };
  }, [selection.trigger]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      requestClose();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleDragStart = (event: React.PointerEvent<HTMLButtonElement>) => {
    dragStartYRef.current = event.clientY;
    dragOffsetRef.current = 0;
    dragMovedRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDragMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragStartYRef.current === null) return;
    const nextOffset = Math.max(0, event.clientY - dragStartYRef.current);
    dragOffsetRef.current = nextOffset;
    if (nextOffset > 4) dragMovedRef.current = true;
    setDragOffset(nextOffset);
  };

  const handleDragEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStartYRef.current = null;
    if (dragOffsetRef.current > 64) {
      dragOffsetRef.current = 0;
      setDragOffset(0);
      requestClose();
    } else {
      dragOffsetRef.current = 0;
      setDragOffset(0);
    }
  };

  return (
    <div
      className={`description-backdrop ${closing ? "is-closing" : ""}`}
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <section
        ref={dialogRef}
        className={`description-sheet ${closing ? "is-closing" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="description-title"
        aria-describedby="description-copy"
        onKeyDown={handleKeyDown}
        style={dragOffset ? { transform: `translateY(${dragOffset}px)` } : undefined}
      >
        <button
          className="description-handle"
          type="button"
          aria-label="Закрыть описание"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          onClick={() => {
            if (!dragMovedRef.current) requestClose();
            dragMovedRef.current = false;
          }}
        >
          <span aria-hidden="true" />
        </button>
        <div className="description-sheet-header">
          <p>Подробнее о напитке</p>
          <button
            ref={closeButtonRef}
            className="description-close"
            type="button"
            aria-label="Закрыть описание"
            onClick={requestClose}
          >
            <span aria-hidden="true" />
          </button>
        </div>
        <h2 id="description-title">{selection.item.name}</h2>
        <p id="description-copy" className="description-copy">
          {selection.item.description}
        </p>
        {(selection.volume || selection.price) && (
          <div className="description-meta" aria-label="Объём и цена">
            {selection.volume && <span>{selection.volume}</span>}
            {selection.price && <strong>{selection.price}</strong>}
          </div>
        )}
      </section>
    </div>
  );
}

function useAnimatedPresence(open: boolean, durationMs = 320) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    let mountTimer = 0;
    let visibilityTimer = 0;
    let unmountTimer = 0;

    if (open) {
      mountTimer = window.setTimeout(() => setMounted(true), 0);
      visibilityTimer = window.setTimeout(() => setVisible(true), 24);
    } else {
      visibilityTimer = window.setTimeout(() => setVisible(false), 0);
      unmountTimer = window.setTimeout(() => setMounted(false), durationMs);
    }

    return () => {
      window.clearTimeout(mountTimer);
      window.clearTimeout(visibilityTimer);
      window.clearTimeout(unmountTimer);
    };
  }, [durationMs, open]);

  return { mounted, visible };
}

function CategoryCard({
  category,
  open,
  active,
  onToggle,
  carouselOffsetMs,
  carouselIntervalOffsetMs,
  onDescribe,
}: {
  category: MenuCategory;
  open: boolean;
  active: boolean;
  onToggle: () => void;
  carouselOffsetMs: number;
  carouselIntervalOffsetMs: number;
  onDescribe: (selection: DescriptionSelection) => void;
}) {
  const panel = useAnimatedPresence(open);

  return (
    <section
      id={`category-${category.id}`}
      data-category-id={category.id}
      className={`category-card ${open ? "is-open" : ""} ${active ? "is-active" : ""}`}
    >
      <button
        className="category-heading"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`panel-${category.id}`}
      >
        <span className="category-name">
          <img src={category.icon} alt="" />
          <span>{category.title}</span>
        </span>
        {!open && <span className="from-price">{category.fromPrice}</span>}
        <span className="chevron" aria-hidden="true" />
      </button>

      <div
        id={`panel-${category.id}`}
        className={`category-panel-shell ${panel.visible ? "is-visible" : ""}`}
        aria-hidden={!open}
      >
        <div className="category-panel-clip">
          {panel.mounted && (
            <div className="category-panel">
          <DecorativeCarousel
            images={category.images}
            running={open}
            phaseOffsetMs={carouselOffsetMs}
            intervalOffsetMs={carouselIntervalOffsetMs}
          />
          <div className="primary-menu-layout">
            <PriceList
              items={category.items}
              volume={category.sideLabel}
              price={category.sidePrice}
              onDescribe={onDescribe}
            />
            {(category.sideLabel || category.sidePrice) && (
              <div className="side-price">
                <span>{category.sideLabel}</span>
                <strong>{category.sidePrice}</strong>
              </div>
            )}
          </div>
          {category.note && <p className="menu-note">{category.note}</p>}

          {category.subsections?.map((subsection, subsectionIndex) => (
            <section className="menu-subsection" key={subsection.title}>
              <h3>{subsection.title}</h3>
              <DecorativeCarousel
                images={subsection.images}
                running={open}
                phaseOffsetMs={carouselOffsetMs + (subsectionIndex + 1) * 700}
                intervalOffsetMs={carouselIntervalOffsetMs + (subsectionIndex + 1) * 170}
              />
              <div className="subsection-layout">
                <PriceList
                  items={subsection.items}
                  volume={subsection.sideLabel}
                  price={subsection.sidePrice}
                  onDescribe={onDescribe}
                />
                {(subsection.sideLabel || subsection.sidePrice) && (
                  <div className="side-price">
                    <span>{subsection.sideLabel}</span>
                    <strong>{subsection.sidePrice}</strong>
                  </div>
                )}
              </div>
            </section>
          ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function MenuClient() {
  const { categories, promotions } = useMenuContent();
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const [activeId, setActiveId] = useState(categories[0]?.id ?? "");
  const [navStuck, setNavStuck] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [descriptionSelection, setDescriptionSelection] =
    useState<DescriptionSelection | null>(null);
  const reducedMotion = useReducedMotion();
  const navRef = useRef<HTMLElement>(null);
  const navigationTargetRef = useRef<string | null>(null);
  const navigationStartTimerRef = useRef(0);
  const navigationReleaseTimerRef = useRef(0);

  const categoryIds = useMemo(() => categories.map((category) => category.id), [categories]);

  const releaseNavigationLock = useCallback(() => {
    window.clearTimeout(navigationStartTimerRef.current);
    window.clearTimeout(navigationReleaseTimerRef.current);
    navigationTargetRef.current = null;
  }, []);

  useEffect(() => {
    const releaseOnManualScroll = () => releaseNavigationLock();
    window.addEventListener("wheel", releaseOnManualScroll, { passive: true });
    window.addEventListener("touchstart", releaseOnManualScroll, { passive: true });
    return () => {
      window.removeEventListener("wheel", releaseOnManualScroll);
      window.removeEventListener("touchstart", releaseOnManualScroll);
      releaseNavigationLock();
    };
  }, [releaseNavigationLock]);

  useEffect(() => {
    let frame = 0;
    const updateNavState = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const nav = navRef.current;
        const navRect = nav?.getBoundingClientRect();
        const stickyTop = nav ? Number.parseFloat(window.getComputedStyle(nav).top) || 0 : 0;
        setNavStuck(Boolean(navRect && navRect.top <= stickyTop + 0.5));
        setShowScrollTop(window.scrollY > 420);
      });
    };

    updateNavState();
    window.addEventListener("scroll", updateNavState, { passive: true });
    window.addEventListener("resize", updateNavState);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateNavState);
      window.removeEventListener("resize", updateNavState);
    };
  }, []);

  useEffect(() => {
    const elements = categoryIds
      .map((id) => document.getElementById(`category-${id}`))
      .filter((element): element is HTMLElement => Boolean(element));
    if (!elements.length || !window.IntersectionObserver) return;

    const navHeight = Math.ceil(navRef.current?.getBoundingClientRect().height ?? 76);
    const scores = new Map<string, number>();
    const thresholds = Array.from({ length: 21 }, (_, index) => index / 20);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.categoryId;
          if (id) scores.set(id, entry.isIntersecting ? entry.intersectionRect.height : 0);
        }

        let bestId = "";
        let bestScore = 0;
        for (const id of categoryIds) {
          const score = scores.get(id) ?? 0;
          if (score > bestScore) {
            bestId = id;
            bestScore = score;
          }
        }
        if (bestId && !navigationTargetRef.current) setActiveId(bestId);
      },
      {
        root: null,
        rootMargin: `-${navHeight}px 0px -45% 0px`,
        threshold: thresholds,
      },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [categoryIds, openIds]);

  const toggleCategory = useCallback((id: string) => {
    releaseNavigationLock();
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setActiveId(id);
  }, [releaseNavigationLock]);

  const navigateToCategory = useCallback((id: string) => {
    window.clearTimeout(navigationStartTimerRef.current);
    window.clearTimeout(navigationReleaseTimerRef.current);
    navigationTargetRef.current = id;
    const alreadyOpen = openIds.has(id);

    setOpenIds((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      return next;
    });
    setActiveId(id);

    navigationStartTimerRef.current = window.setTimeout(() => {
      const target = document.getElementById(`category-${id}`);
      const nav = navRef.current;
      if (!target || !nav) {
        releaseNavigationLock();
        return;
      }

      const stickyTop = Number.parseFloat(window.getComputedStyle(nav).top) || 0;
      const navHeight = nav.getBoundingClientRect().height;
      const targetTop = window.scrollY + target.getBoundingClientRect().top;
      const destination = Math.max(0, targetTop - stickyTop - navHeight - 12);

      window.scrollTo({
        top: destination,
        behavior: reducedMotion ? "auto" : "smooth",
      });

      navigationReleaseTimerRef.current = window.setTimeout(() => {
        if (navigationTargetRef.current === id) navigationTargetRef.current = null;
      }, reducedMotion ? 80 : 1100);
    }, alreadyOpen ? 30 : 360);
  }, [openIds, reducedMotion, releaseNavigationLock]);

  return (
    <>
      <main className="page-shell">
      <header className={`hero ${hoursOpen ? "hours-open" : ""}`}>
        <img className="hero-mark" src="/assets/logos/mark.webp" alt="" />
        <img className="hero-wordmark" src="/assets/logos/wordmark.webp" alt="MY Loft" />
        <p className="hero-address">ул. Большая Покровская, д. 68, 3 этаж</p>
        <button
          className="hours-toggle"
          type="button"
          aria-expanded={hoursOpen}
          aria-controls="working-hours"
          onClick={() => setHoursOpen((current) => !current)}
        >
          Время работы <span aria-hidden="true" />
        </button>
        <div
          id="working-hours"
          className={`hero-hours ${hoursOpen ? "is-visible" : ""}`}
          aria-hidden={!hoursOpen}
        >
          <div>
            <p><span>Пн–чт</span><strong>12:00–00:00</strong></p>
            <p><span>Пт</span><strong>12:00–02:00</strong></p>
            <p><span>Сб</span><strong>14:00–02:00</strong></p>
            <p><span>Вс</span><strong>14:00–00:00</strong></p>
          </div>
        </div>
        <h1>Меню</h1>
      </header>

      <nav
        className={`category-nav ${navStuck ? "is-stuck" : ""}`}
        ref={navRef}
        aria-label="Разделы меню"
      >
        <div className="category-nav-inner">
          {categories.map((category) => (
            <button
              key={category.id}
              className={activeId === category.id ? "is-active" : ""}
              onClick={() => navigateToCategory(category.id)}
            >
              {category.navLabel}
            </button>
          ))}
        </div>
      </nav>

      <PromoCarousel promotions={promotions} />

      <div className="categories" aria-label="Меню MY Loft">
        {categories.map((category, index) => (
          <div className="category-wrap" key={category.id}>
            {index > 0 && openIds.has(category.id) && openIds.has(categories[index - 1].id) && (
              <div className="open-divider" aria-hidden="true" />
            )}
            <CategoryCard
              category={category}
              open={openIds.has(category.id)}
              active={activeId === category.id}
              onToggle={() => toggleCategory(category.id)}
              carouselOffsetMs={index * 900}
              carouselIntervalOffsetMs={index * 280}
              onDescribe={setDescriptionSelection}
            />
          </div>
        ))}
      </div>

      <section className="footer-actions" aria-label="Дополнительные действия">
        <a href={settings.tipsUrl} target="_blank" rel="noreferrer">
          Оставить чаевые
          <img src="/assets/icons/tips.webp" alt="" />
        </a>
        <a href={settings.reviewUrl} target="_blank" rel="noreferrer">
          Оставить отзыв
          <img src="/assets/icons/review.svg" alt="" />
        </a>
      </section>

      <div className="footer-separator" />

      <footer className="footer">
        <div className="footer-logo-wrap">
          <img src="/assets/logos/footer.webp" alt="MY Loft" />
          <span className="age">18+</span>
        </div>
        <div className="footer-line" />
        <div className="footer-copy">
          <p>Курить строго запрещено -<br />Курите нежно!</p>
          <small>Цены и наличие позиций уточняйте у администратора</small>
          <small className="accent">Меню обновлено: июль 2026</small>
        </div>
      </footer>

      <button
        className={`scroll-to-top ${showScrollTop ? "is-visible" : ""}`}
        type="button"
        aria-label="Прокрутить наверх"
        aria-hidden={!showScrollTop}
        tabIndex={showScrollTop ? 0 : -1}
        onClick={() => window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" })}
      >
        <span aria-hidden="true" />
      </button>
      </main>
      {descriptionSelection && (
        <DescriptionSheet
          selection={descriptionSelection}
          reducedMotion={reducedMotion}
          onClose={() => setDescriptionSelection(null)}
        />
      )}
    </>
  );
}
