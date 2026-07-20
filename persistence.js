(() => {
  "use strict";

  window.LIKE_GOAL = window.LIKE_GOAL || {};
  window.LIKE_GOAL.internal = window.LIKE_GOAL.internal || {};

  const VERSION = 1;
  const MAX_VALUE = Number.MAX_SAFE_INTEGER;

  function isObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  function hasProperty(object, property) {
    return Object.prototype.hasOwnProperty.call(object, property);
  }

  function isValidCurrent(value) {
    return Number.isSafeInteger(value) && value >= 0 && value <= MAX_VALUE;
  }

  function isValidGoal(value) {
    return Number.isSafeInteger(value) && value >= 1 && value <= MAX_VALUE;
  }

  function createStatePersistence(options) {
    const key = isObject(options) && typeof options.key === "string" && options.key
      ? options.key
      : null;
    let storage = null;
    let storageAvailable = false;

    if (!key) {
      console.error("永続化の保存キーが不正です。");
    } else {
      try {
        storage = window.localStorage;
        storageAvailable = Boolean(storage);
      } catch (error) {
        console.error(error);
      }
    }

    function disableStorage(error) {
      storageAvailable = false;
      console.error(error);
    }

    function clear() {
      if (!storageAvailable || !storage) {
        return false;
      }

      try {
        storage.removeItem(key);
        return true;
      } catch (error) {
        disableStorage(error);
        return false;
      }
    }

    function load() {
      if (!storageAvailable || !storage) {
        return null;
      }

      let rawValue;

      try {
        rawValue = storage.getItem(key);
      } catch (error) {
        disableStorage(error);
        return null;
      }

      if (rawValue === null) {
        return null;
      }

      let savedValue;

      try {
        savedValue = JSON.parse(rawValue);
      } catch (error) {
        console.error(error);
        clear();
        return null;
      }

      if (
        !isObject(savedValue) ||
        !hasProperty(savedValue, "version") ||
        !hasProperty(savedValue, "current") ||
        !hasProperty(savedValue, "goal") ||
        savedValue.version !== VERSION ||
        !isValidCurrent(savedValue.current) ||
        !isValidGoal(savedValue.goal)
      ) {
        console.error("保存データの形式が不正です。");
        clear();
        return null;
      }

      return {
        current: savedValue.current,
        goal: savedValue.goal
      };
    }

    function save(state) {
      if (!storageAvailable || !storage || !isObject(state)) {
        return false;
      }

      if (!isValidCurrent(state.current) || !isValidGoal(state.goal)) {
        console.error("保存対象の状態が不正です。");
        return false;
      }

      let serializedValue;

      try {
        serializedValue = JSON.stringify({
          version: VERSION,
          current: state.current,
          goal: state.goal
        });
      } catch (error) {
        console.error(error);
        return false;
      }

      try {
        storage.setItem(key, serializedValue);
        return true;
      } catch (error) {
        disableStorage(error);
        return false;
      }
    }

    return {
      get available() {
        return storageAvailable;
      },
      load,
      save,
      clear
    };
  }

  window.LIKE_GOAL.internal.createStatePersistence = createStatePersistence;
})();
