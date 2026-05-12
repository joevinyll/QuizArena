// Generate a 6-character uppercase alphanumeric session code
export function generateSessionCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // omit confusing chars (I, O, 0, 1)
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Generate a unique ID
export function generateId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Calculate score percentage
export function calculatePercent(correct, total) {
  if (!total) return 0;
  return Math.round((correct / total) * 100);
}

// Format timestamp
export function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Difficulty label based on % of students who got it right
export function difficultyLabel(accuracy) {
  if (accuracy >= 80) return { label: "Easy", color: "emerald" };
  if (accuracy >= 50) return { label: "Moderate", color: "amber" };
  return { label: "Difficult", color: "rose" };
}

// Clamp
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export function getUserFirstName(user) {
  const displayName = user?.displayName?.trim();
  if (displayName) {
    return displayName.split(/\s+/)[0];
  }

  const emailName = user?.email?.split("@")[0]?.trim();
  if (!emailName) return "Teacher";

  return emailName
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function detectInAppBrowser(userAgent) {
  const ua =
    userAgent ||
    (typeof navigator !== "undefined" ? navigator.userAgent || "" : "");
  const normalized = ua.toLowerCase();

  const isMessenger =
    normalized.includes("fb_iab") ||
    normalized.includes("fbav") ||
    normalized.includes("messenger");
  const isInstagram = normalized.includes("instagram");
  const isLine = normalized.includes("line/");
  const isTiktok = normalized.includes("musical_ly") || normalized.includes("tiktok");
  const isWebView =
    normalized.includes("wv") ||
    (/android/.test(normalized) &&
      normalized.includes("version/") &&
      !normalized.includes("chrome/"));

  const isInApp = isMessenger || isInstagram || isLine || isTiktok || isWebView;

  return {
    isInApp,
    isMessenger,
    browserName: isMessenger
      ? "Messenger"
      : isInstagram
        ? "Instagram"
        : isLine
          ? "LINE"
          : isTiktok
            ? "TikTok"
            : isWebView
              ? "in-app browser"
              : null,
  };
}
