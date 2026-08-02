(() => {
  "use strict";

  window.LIKE_GOAL = window.LIKE_GOAL || {};
  window.LIKE_GOAL.internal = window.LIKE_GOAL.internal || {};

  window.LIKE_GOAL.internal.protocol = Object.freeze({
    channelName: "obs-like-goal-widget-v1",
    kinds: Object.freeze({
      state: "state",
      action: "action",
      syncRequest: "sync-request"
    })
  });
})();
