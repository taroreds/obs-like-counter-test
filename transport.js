(() => {
  "use strict";

  window.LIKE_GOAL = window.LIKE_GOAL || {};
  window.LIKE_GOAL.internal = window.LIKE_GOAL.internal || {};

  function createChannelTransport(channelName) {
    let channel = null;
    let closed = false;
    let listeners = [];
    let available = false;

    function notifyListeners(message) {
      const notificationListeners = listeners.slice();

      notificationListeners.forEach((subscription) => {
        try {
          subscription.listener(message);
        } catch (error) {
          console.error(error);
        }
      });
    }

    function handleMessage(event) {
      try {
        notifyListeners(event.data);
      } catch (error) {
        console.error(error);
      }
    }

    if (typeof window.BroadcastChannel === "function") {
      try {
        channel = new BroadcastChannel(channelName);
        channel.addEventListener("message", handleMessage);
        available = true;
      } catch (error) {
        console.error(error);
      }
    } else {
      console.error("BroadcastChannelはこの環境で利用できません。");
    }

    function post(message) {
      if (!available || closed || !channel) {
        return false;
      }

      try {
        channel.postMessage(message);
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    }

    function subscribe(listener) {
      if (typeof listener !== "function") {
        return () => {};
      }

      const subscription = { listener };
      let subscribed = true;
      listeners.push(subscription);

      return () => {
        if (!subscribed) {
          return;
        }

        subscribed = false;
        listeners = listeners.filter((item) => item !== subscription);
      };
    }

    function close() {
      if (closed) {
        return;
      }

      closed = true;
      listeners = [];

      if (!channel) {
        return;
      }

      try {
        channel.removeEventListener("message", handleMessage);
        channel.close();
      } catch (error) {
        console.error(error);
      }
    }

    window.addEventListener("beforeunload", close);

    return {
      get available() {
        return available && !closed;
      },
      post,
      subscribe,
      close
    };
  }

  window.LIKE_GOAL.internal.createChannelTransport = createChannelTransport;
})();
