import type { MenuCategory, Promotion } from "./menu-data";

export type MenuContentDocument = {
  version: 1;
  promotions: Promotion[];
  categories: MenuCategory[];
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isMenuLine = (value: unknown) => {
  if (!value || typeof value !== "object") return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.name === "string" &&
    (line.price === undefined || typeof line.price === "string") &&
    (line.details === undefined || isStringArray(line.details))
  );
};

const isMenuCategory = (value: unknown): value is MenuCategory => {
  if (!value || typeof value !== "object") return false;
  const category = value as Record<string, unknown>;
  if (
    typeof category.id !== "string" ||
    typeof category.title !== "string" ||
    typeof category.navLabel !== "string" ||
    typeof category.icon !== "string" ||
    typeof category.fromPrice !== "string" ||
    !isStringArray(category.images) ||
    !Array.isArray(category.items) ||
    !category.items.every(isMenuLine)
  ) {
    return false;
  }

  if (category.subsections !== undefined) {
    if (!Array.isArray(category.subsections)) return false;
    for (const subsectionValue of category.subsections) {
      if (!subsectionValue || typeof subsectionValue !== "object") return false;
      const subsection = subsectionValue as Record<string, unknown>;
      if (
        typeof subsection.title !== "string" ||
        !isStringArray(subsection.images) ||
        !Array.isArray(subsection.items) ||
        !subsection.items.every(isMenuLine)
      ) {
        return false;
      }
    }
  }

  return true;
};

const isPromotion = (value: unknown): value is Promotion => {
  if (!value || typeof value !== "object") return false;
  const promotion = value as Record<string, unknown>;
  return (
    typeof promotion.id === "string" &&
    typeof promotion.image === "string" &&
    typeof promotion.alt === "string" &&
    typeof promotion.eyebrow === "string" &&
    typeof promotion.title === "string" &&
    (promotion.variant === "weekday" || promotion.variant === "one-plus-one")
  );
};

export function isMenuContentDocument(value: unknown): value is MenuContentDocument {
  if (!value || typeof value !== "object") return false;
  const document = value as Record<string, unknown>;
  if (
    document.version !== 1 ||
    !Array.isArray(document.promotions) ||
    !document.promotions.every(isPromotion) ||
    !Array.isArray(document.categories) ||
    !document.categories.every(isMenuCategory)
  ) {
    return false;
  }

  const categoryIds = document.categories.map((category) => category.id);
  const promotionIds = document.promotions.map((promotion) => promotion.id);
  return (
    categoryIds.length === new Set(categoryIds).size &&
    promotionIds.length === new Set(promotionIds).size
  );
}

export function readCachedMenuContent(storageKey: string): MenuContentDocument | null {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    return isMenuContentDocument(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCachedMenuContent(storageKey: string, content: MenuContentDocument) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(content));
  } catch {
    // Storage may be unavailable in private mode. The in-memory document remains valid.
  }
}

export async function fetchMenuContent(endpoint: string, signal: AbortSignal) {
  const response = await fetch(endpoint, { cache: "no-store", signal });
  if (!response.ok) throw new Error(`Menu content request failed: ${response.status}`);
  const parsed: unknown = await response.json();
  if (!isMenuContentDocument(parsed)) throw new Error("Menu content document is invalid");
  return parsed;
}
