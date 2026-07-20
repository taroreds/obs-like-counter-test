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

  const PERSISTENCE_KEY_PREFIX = "obs-like-goal-widget-state-v1";

  function getObject(value) {
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  }

  function getPreset(value, allowedValues, fallback) {
    return allowedValues.includes(value) ? value : fallback;
  }

  function getPersistenceKey() {
    let pathname = "default";

    try {
      if (typeof window.location.pathname === "string" && window.location.pathname) {
        pathname = window.location.pathname;
      }
    } catch (error) {
      console.error(error);
    }

    try {
      return `${PERSISTENCE_KEY_PREFIX}:${encodeURIComponent(pathname)}`;
    } catch (error) {
      console.error(error);
      return `${PERSISTENCE_KEY_PREFIX}:default`;
    }
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
  const persistence = window.LIKE_GOAL.internal.createStatePersistence({
    key: getPersistenceKey()
  });
  const savedState = persistence.load();
  let suppressPersistenceSave = false;

  if (savedState) {
    store.dispatch({ type: "set-current", value: savedState.current });
    store.dispatch({ type: "set-goal", value: savedState.goal });
  }

  applyAppearance(appearance);

  function isResetAllAction(action) {
    return action &&
      typeof action === "object" &&
      !Array.isArray(action) &&
      action.type === "reset-all";
  }

  function dispatch(action) {
    if (!isResetAllAction(action)) {
      return store.dispatch(action);
    }

    suppressPersistenceSave = true;

    try {
      return store.dispatch(action);
    } finally {
      persistence.clear();
      suppressPersistenceSave = false;
    }
  }

  window.LIKE_GOAL.getState = store.getState;
  window.LIKE_GOAL.dispatch = dispatch;
  window.LIKE_GOAL.subscribe = store.subscribe;

  renderWidget(store.getState());
  store.subscribe(renderWidget);
  store.subscribe((state) => {
    if (!suppressPersistenceSave) {
      persistence.save(state);
    }
  });
})();
