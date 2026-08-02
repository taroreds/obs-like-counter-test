(() => {
  "use strict";

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
      !application.internal.protocol ||
      typeof application.internal.createChannelTransport !== "function"
    ) {
      console.error("状態APIまたは通信APIを初期化できませんでした。");
      return;
    }

    const protocol = application.internal.protocol;
    const transport = application.internal.createChannelTransport(protocol.channelName);

    if (!transport.available) {
      return;
    }

    function sendCurrentState() {
      transport.post({
        kind: protocol.kinds.state,
        state: application.getState()
      });
    }

    const unsubscribeTransport = transport.subscribe((message) => {
      if (!isObject(message)) {
        return;
      }

      if (hasProperty(message, "kind") && message.kind === protocol.kinds.syncRequest) {
        sendCurrentState();
        return;
      }

      if (
        hasProperty(message, "kind") &&
        message.kind === protocol.kinds.action &&
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
