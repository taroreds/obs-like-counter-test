(() => {
  "use strict";

  window.LIKE_GOAL = window.LIKE_GOAL || {};
  window.LIKE_GOAL.internal = window.LIKE_GOAL.internal || {};

  const DEFAULT_APPEARANCE = {
    theme: "sharp-blue",
    position: "top-left",
    size: "medium"
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
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  }

  function getPreset(value, allowedValues, fallback) {
    return allowedValues.includes(value) ? value : fallback;
  }

  function applyAppearance(appearance) {
    const theme = getPreset(
      appearance.theme,
      ALLOWED_THEMES,
      DEFAULT_APPEARANCE.theme
    );

    const position = getPreset(
      appearance.position,
      ALLOWED_POSITIONS,
      DEFAULT_APPEARANCE.position
    );

    const size = getPreset(
      appearance.size,
      ALLOWED_SIZES,
      DEFAULT_APPEARANCE.size
    );

    document.body.classList.remove(
      ...ALLOWED_THEMES.map((value) => `theme-${value}`),
      ...ALLOWED_POSITIONS.map((value) => `pos-${value}`),
      ...ALLOWED_SIZES.map((value) => `size-${value}`)
    );

    document.body.classList.add(
      `theme-${theme}`,
      `pos-${position}`,
      `size-${size}`
    );
  }

  const suppliedConfig = getObject(window.LIKE_GOAL_CONFIG);
  const content = getObject(suppliedConfig.content);
  const appearance = getObject(suppliedConfig.appearance);
  const store = window.LIKE_GOAL.internal.createStateStore(content);
  const renderWidget = window.LIKE_GOAL.internal.renderWidget;

  applyAppearance(appearance);

  window.LIKE_GOAL.getState = store.getState;
  window.LIKE_GOAL.dispatch = store.dispatch;
  window.LIKE_GOAL.subscribe = store.subscribe;

  renderWidget(store.getState());
  store.subscribe(renderWidget);
})();
