(() => {
  "use strict";

  window.LIKE_GOAL = window.LIKE_GOAL || {};
  window.LIKE_GOAL.internal = window.LIKE_GOAL.internal || {};

  const DEFAULT_CONTENT = {
    label: "高評価ゴール",
    current: 0,
    goal: 100,
    message: ""
  };

  const MAX_VALUE = Number.MAX_SAFE_INTEGER;

  function getObject(value) {
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  }

  function getFiniteNumber(value) {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === "string") {
      const trimmedValue = value.trim();

      if (trimmedValue === "") {
        return null;
      }

      const number = Number(trimmedValue);
      return Number.isFinite(number) ? number : null;
    }

    return null;
  }

  function getInitialInteger(value, fallback, minimum) {
    const number = getFiniteNumber(value);

    if (number === null) {
      return fallback;
    }

    return Math.min(
      Math.max(Math.trunc(number), minimum),
      MAX_VALUE
    );
  }

  function getActionInteger(value, minimum) {
    const number = getFiniteNumber(value);

    if (number === null) {
      return null;
    }

    return Math.min(
      Math.max(Math.trunc(number), minimum),
      MAX_VALUE
    );
  }

  function getPositiveAmount(value) {
    const number = getFiniteNumber(value);

    if (number === null) {
      return null;
    }

    const amount = Math.trunc(number);

    if (amount < 1) {
      return null;
    }

    return Math.min(amount, MAX_VALUE);
  }

  function getSafeText(value, fallback) {
    return value === null || value === undefined
      ? fallback
      : String(value);
  }

  function createContentState(value) {
    const content = getObject(value);

    return {
      label: getSafeText(content.label, DEFAULT_CONTENT.label),
      current: getInitialInteger(
        content.current,
        DEFAULT_CONTENT.current,
        0
      ),
      goal: getInitialInteger(
        content.goal,
        DEFAULT_CONTENT.goal,
        1
      ),
      message: getSafeText(content.message, DEFAULT_CONTENT.message)
    };
  }

  function createSnapshot(state) {
    return Object.freeze({
      label: state.label,
      current: state.current,
      goal: state.goal,
      message: state.message,
      achieved: state.current >= state.goal
    });
  }

  function hasChanged(previousState, nextState) {
    return previousState.label !== nextState.label ||
      previousState.current !== nextState.current ||
      previousState.goal !== nextState.goal ||
      previousState.message !== nextState.message;
  }

  function createStateStore(initialContent) {
    const initialState = Object.freeze(createContentState(initialContent));
    let currentState = initialState;
    let listeners = [];

    function notifyListeners(snapshot) {
      const notificationListeners = listeners.slice();

      notificationListeners.forEach((subscription) => {
        try {
          subscription.listener(snapshot);
        } catch (error) {
          console.error(error);
        }
      });
    }

    function updateState(nextState) {
      if (!hasChanged(currentState, nextState)) {
        return false;
      }

      currentState = Object.freeze(nextState);
      notifyListeners(createSnapshot(currentState));
      return true;
    }

    function getState() {
      return createSnapshot(currentState);
    }

    function dispatch(action) {
      if (!action || typeof action !== "object" || Array.isArray(action)) {
        return false;
      }

      switch (action.type) {
        case "increment": {
          const amount = getPositiveAmount(action.amount);

          if (amount === null) {
            return false;
          }

          return updateState({
            ...currentState,
            current: Math.min(currentState.current + amount, MAX_VALUE)
          });
        }

        case "decrement": {
          const amount = getPositiveAmount(action.amount);

          if (amount === null) {
            return false;
          }

          return updateState({
            ...currentState,
            current: Math.max(currentState.current - amount, 0)
          });
        }

        case "set-current": {
          const current = getActionInteger(action.value, 0);

          if (current === null) {
            return false;
          }

          return updateState({
            ...currentState,
            current
          });
        }

        case "set-goal": {
          const goal = getActionInteger(action.value, 1);

          if (goal === null) {
            return false;
          }

          return updateState({
            ...currentState,
            goal
          });
        }

        case "reset-counter":
          return updateState({
            ...currentState,
            current: 0
          });

        case "reset-all":
          return updateState({ ...initialState });

        default:
          return false;
      }
    }

    function subscribe(listener) {
      if (typeof listener !== "function") {
        return () => {};
      }

      const subscription = { listener };
      let isSubscribed = true;
      listeners.push(subscription);

      return () => {
        if (!isSubscribed) {
          return;
        }

        isSubscribed = false;
        listeners = listeners.filter((item) => item !== subscription);
      };
    }

    return {
      getState,
      dispatch,
      subscribe
    };
  }

  window.LIKE_GOAL.internal.createStateStore = createStateStore;
})();
