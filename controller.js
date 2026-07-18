(() => {
  "use strict";

  const CHANNEL_NAME = "obs-like-goal-widget-v1";
  const MAX_VALUE = Number.MAX_SAFE_INTEGER;
  let syncState = "waiting";
  let lastReceivedState = null;
  let transport = null;
  let unsubscribeTransport = () => {};

  const elements = {
    syncStatus: document.getElementById("syncStatus"),
    syncDescription: document.getElementById("syncDescription"),
    lastSync: document.getElementById("lastSync"),
    resyncButton: document.getElementById("resyncButton"),
    currentValue: document.getElementById("currentValue"),
    goalValue: document.getElementById("goalValue"),
    currentInput: document.getElementById("currentInput"),
    goalInput: document.getElementById("goalInput"),
    setCurrentButton: document.getElementById("setCurrentButton"),
    setGoalButton: document.getElementById("setGoalButton"),
    resetCounterButton: document.getElementById("resetCounterButton"),
    resetAllButton: document.getElementById("resetAllButton"),
    result: document.getElementById("result"),
    syncControls: Array.from(document.querySelectorAll("[data-requires-sync]")),
    adjustButtons: Array.from(document.querySelectorAll("[data-action]"))
  };

  function isObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  function isValidState(state) {
    return isObject(state) &&
      hasStateProperties(state) &&
      typeof state.label === "string" &&
      typeof state.message === "string" &&
      Number.isSafeInteger(state.current) &&
      state.current >= 0 &&
      state.current <= MAX_VALUE &&
      Number.isSafeInteger(state.goal) &&
      state.goal >= 1 &&
      state.goal <= MAX_VALUE &&
      typeof state.achieved === "boolean" &&
      state.achieved === (state.current >= state.goal);
  }

  function hasStateProperties(state) {
    return ["label", "current", "goal", "message", "achieved"].every(
      (property) => Object.prototype.hasOwnProperty.call(state, property)
    );
  }

  function isValidStateMessage(message) {
    return isObject(message) &&
      Object.prototype.hasOwnProperty.call(message, "kind") &&
      message.kind === "state" &&
      Object.prototype.hasOwnProperty.call(message, "state") &&
      isValidState(message.state);
  }

  function setResult(message) {
    elements.result.textContent = message;
  }

  function setSyncState(nextState) {
    syncState = nextState;
    const synced = nextState === "synced";
    elements.syncControls.forEach((control) => {
      control.disabled = !synced;
    });

    elements.syncStatus.classList.remove(
      "status-unavailable",
      "status-waiting",
      "status-synced"
    );

    if (nextState === "unavailable") {
      elements.syncStatus.textContent = "未接続";
      elements.syncStatus.classList.add("status-unavailable");
      elements.syncDescription.textContent = "BroadcastChannelを利用できません。表示側の設定は通常どおり動作します。";
      return;
    }

    if (nextState === "waiting") {
      elements.syncStatus.textContent = "同期待機";
      elements.syncStatus.classList.add("status-waiting");
      elements.syncDescription.textContent = "表示ページからの最新状態を待っています。同期済みになるまで操作できません。";
      return;
    }

    elements.syncStatus.textContent = "同期済み";
    elements.syncStatus.classList.add("status-synced");
    elements.syncDescription.textContent = "最新状態を受信しました。同期済みは表示ページの現在の存在を保証しません。";
  }

  function showState(state) {
    lastReceivedState = state;
    elements.currentValue.textContent = state.current.toLocaleString("ja-JP");
    elements.goalValue.textContent = state.goal.toLocaleString("ja-JP");
    elements.currentInput.value = String(state.current);
    elements.goalInput.value = String(state.goal);
    elements.lastSync.textContent = new Date().toLocaleString("ja-JP");
    setSyncState("synced");
    setResult("表示ページから最新状態を受信しました。");
  }

  function sendMessage(message, successMessage) {
    if (syncState !== "synced" || !transport) {
      setResult("同期済みではないため操作できません。");
      return false;
    }

    if (!transport.post(message)) {
      setSyncState("unavailable");
      setResult("送信に失敗しました。再同期してください。");
      return false;
    }

    setResult(successMessage);
    return true;
  }

  function requestSync() {
    if (!transport || !transport.available) {
      setSyncState("unavailable");
      setResult("通信チャンネルを利用できません。");
      return;
    }

    setSyncState("waiting");

    if (!transport.post({ kind: "sync-request" })) {
      setSyncState("unavailable");
      setResult("再同期要求の送信に失敗しました。");
      return;
    }

    setResult("再同期要求を送信しました。表示ページからの応答を待っています。");
  }

  function getDirectInputValue(input, minimum, name) {
    const value = input.value.trim();

    if (value === "") {
      setResult(`${name}を入力してください。`);
      return null;
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
      setResult(`${name}には有限数を入力してください。`);
      return null;
    }

    if (number < minimum) {
      setResult(`${name}は${minimum}以上にしてください。`);
      return null;
    }

    return value;
  }

  function initializeController() {
    const application = window.LIKE_GOAL;

    if (!application || !application.internal ||
      typeof application.internal.createChannelTransport !== "function") {
      setSyncState("unavailable");
      setResult("通信機能を初期化できませんでした。");
      return;
    }

    transport = application.internal.createChannelTransport(CHANNEL_NAME);
    unsubscribeTransport = transport.subscribe((message) => {
      if (isValidStateMessage(message)) {
        showState(message.state);
      }
    });

    if (!transport.available) {
      setSyncState("unavailable");
      setResult("BroadcastChannelを利用できません。表示側は通常動作を継続します。");
      return;
    }

    requestSync();
  }

  elements.adjustButtons.forEach((button) => {
    button.addEventListener("click", () => {
      sendMessage({
        kind: "action",
        action: {
          type: button.dataset.action,
          amount: Number(button.dataset.amount)
        }
      }, "操作要求を送信しました。表示側からの状態更新を待っています。");
    });
  });

  elements.setCurrentButton.addEventListener("click", () => {
    const value = getDirectInputValue(elements.currentInput, 0, "現在値");

    if (value !== null) {
      sendMessage({
        kind: "action",
        action: { type: "set-current", value }
      }, "現在値の設定要求を送信しました。表示側からの状態更新を待っています。");
    }
  });

  elements.setGoalButton.addEventListener("click", () => {
    const value = getDirectInputValue(elements.goalInput, 1, "目標値");

    if (value !== null) {
      sendMessage({
        kind: "action",
        action: { type: "set-goal", value }
      }, "目標値の設定要求を送信しました。表示側からの状態更新を待っています。");
    }
  });

  elements.resetCounterButton.addEventListener("click", () => {
    sendMessage({
      kind: "action",
      action: { type: "reset-counter" }
    }, "カウンターリセット要求を送信しました。表示側からの状態更新を待っています。");
  });

  elements.resetAllButton.addEventListener("click", () => {
    let accepted = false;

    try {
      accepted = window.confirm("現在値、目標値、表示内容を初期設定に戻します。続けますか？");
    } catch (error) {
      console.error(error);
      setResult("確認ダイアログを表示できませんでした。");
      return;
    }

    if (!accepted) {
      setResult("初期設定へのリセットを取り消しました。");
      return;
    }

    sendMessage({
      kind: "action",
      action: { type: "reset-all" }
    }, "初期設定へのリセット要求を送信しました。表示側からの状態更新を待っています。");
  });

  elements.resyncButton.addEventListener("click", requestSync);

  window.addEventListener("beforeunload", () => {
    unsubscribeTransport();

    if (transport) {
      transport.close();
    }
  });

  initializeController();
})();
