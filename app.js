(() => {
  "use strict";

  const DEFAULT_CONFIG = {
    content: {
      label: "高評価ゴール",
      current: 0,
      goal: 100,
      message: ""
    },
    appearance: {
      theme: "sharp-blue",
      position: "top-left",
      size: "medium"
    }
  };

  const ALLOWED_THEMES = [
    "sharp-blue",
    "sharp-purple",
    "sharp-red"
  ];

  const ALLOWED_POSITIONS = [
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right"
  ];

  const ALLOWED_SIZES = [
    "small",
    "medium",
    "large"
  ];

  function getObject(value) {
    return value && typeof value === "object" ? value : {};
  }

  function getPreset(value, allowedValues, fallback) {
    return allowedValues.includes(value) ? value : fallback;
  }

  function getSafeInteger(value, fallback, minimum) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return fallback;
    }

    return Math.max(minimum, Math.trunc(number));
  }

  function getSafeText(value, fallback) {
    if (value === null || value === undefined) {
      return fallback;
    }

    return String(value);
  }

  function render() {
    const suppliedConfig = getObject(window.LIKE_GOAL_CONFIG);
    const content = getObject(suppliedConfig.content);
    const appearance = getObject(suppliedConfig.appearance);

    const theme = getPreset(
      appearance.theme,
      ALLOWED_THEMES,
      DEFAULT_CONFIG.appearance.theme
    );

    const position = getPreset(
      appearance.position,
      ALLOWED_POSITIONS,
      DEFAULT_CONFIG.appearance.position
    );

    const size = getPreset(
      appearance.size,
      ALLOWED_SIZES,
      DEFAULT_CONFIG.appearance.size
    );

    document.body.classList.add(
      `theme-${theme}`,
      `pos-${position}`,
      `size-${size}`
    );

    const label = getSafeText(
      content.label,
      DEFAULT_CONFIG.content.label
    );

    const message = getSafeText(
      content.message,
      DEFAULT_CONFIG.content.message
    );

    const current = getSafeInteger(
      content.current,
      DEFAULT_CONFIG.content.current,
      0
    );

    const goal = getSafeInteger(
      content.goal,
      DEFAULT_CONFIG.content.goal,
      1
    );

    const percentage = Math.min(
      Math.max((current / goal) * 100, 0),
      100
    );

    document.getElementById("label").textContent = label;
    document.getElementById("current").textContent =
      current.toLocaleString("ja-JP");
    document.getElementById("goal").textContent =
      `/ ${goal.toLocaleString("ja-JP")}`;
    document.getElementById("message").textContent = message;
    document.getElementById("barFill").style.width =
      `${percentage}%`;
  }

  render();
})();