(() => {
  "use strict";

  window.LIKE_GOAL = window.LIKE_GOAL || {};
  window.LIKE_GOAL.internal = window.LIKE_GOAL.internal || {};

  function getDisplayInteger(value, minimum) {
    return typeof value === "number" && Number.isFinite(value)
      ? Math.max(Math.trunc(value), minimum)
      : minimum;
  }

  function renderWidget(state) {
    const labelElement = document.getElementById("label");
    const currentElement = document.getElementById("current");
    const goalElement = document.getElementById("goal");
    const messageElement = document.getElementById("message");
    const barFillElement = document.getElementById("barFill");

    if (
      !labelElement ||
      !currentElement ||
      !goalElement ||
      !messageElement ||
      !barFillElement
    ) {
      return;
    }

    const safeState = state && typeof state === "object" ? state : {};
    const current = getDisplayInteger(safeState.current, 0);
    const goal = getDisplayInteger(safeState.goal, 1);
    const percentage = Math.min(
      Math.max((current / goal) * 100, 0),
      100
    );

    labelElement.textContent = safeState.label == null
      ? ""
      : String(safeState.label);
    currentElement.textContent = current.toLocaleString("ja-JP");
    goalElement.textContent = `/ ${goal.toLocaleString("ja-JP")}`;
    messageElement.textContent = safeState.message == null
      ? ""
      : String(safeState.message);
    barFillElement.style.width = `${percentage}%`;
  }

  window.LIKE_GOAL.internal.renderWidget = renderWidget;
})();
