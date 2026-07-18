(() => {
  "use strict";

  const CHANNEL_NAME = "obs-like-goal-widget-v1";
  const ACTION_TYPES = [
    "increment",
    "decrement",
    "set-current",
    "set-goal",
    "reset-counter",
    "reset-all"
  ];

  function isObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  function hasProperty(object, property) {
    return Object.prototype.hasOwnProperty.call(object, property);
  }

  function isValidAction(action) {
    if (
      !isObject(action) ||
      !hasProperty(action, "type") ||
      !ACTION_TYPES.includes(action.type)
    ) {
      return false;
    }

    if (action.type === "increment" || action.type === "decrement") {
      return hasProperty(action, "amount");
    }

    if (action.type === "set-current" || action.type === "set-goal") {
      return hasProperty(action, "value");
    }

    return true;
  }

  function initializeInputChannel() {
    const application = window.LIKE_GOAL;

    if (
      !application ||
      typeof application.getState !== "function" ||
      typeof application.dispatch !== "function" ||
      typeof application.subscribe !== "function" ||
      !application.internal ||
      typeof application.internal.createChannelTransport !== "function"
    ) {
      console.error("状態APIまたは通信APIを初期化できませんでした。");
      return;
    }

    const transport = application.internal.createChannelTransport(CHANNEL_NAME);

    if (!transport.available) {
      return;
    }

    function sendCurrentState() {
      transport.post({
        kind: "state",
        state: application.getState()
      });
    }

    const unsubscribeTransport = transport.subscribe((message) => {
      if (!isObject(message)) {
        return;
      }

      if (hasProperty(message, "kind") && message.kind === "sync-request") {
        sendCurrentState();
        return;
      }

      if (
        hasProperty(message, "kind") &&
        message.kind === "action" &&
        hasProperty(message, "action") &&
        isValidAction(message.action)
      ) {
        try {
          application.dispatch(message.action);
        } catch (error) {
          console.error(error);
        }
      }
    });

    const unsubscribeState = application.subscribe(() => {
      sendCurrentState();
    });

    sendCurrentState();

    window.addEventListener("beforeunload", () => {
      unsubscribeTransport();
      unsubscribeState();
      transport.close();
    });
  }

  initializeInputChannel();
})();
