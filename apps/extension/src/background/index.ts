// Company Vault - Background Service Worker (TASK-137: Auto-Lock Inactivity)

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes
const ALARM_NAME = "CV_INACTIVITY_CHECK"

interface VaultStorageState {
  isLocked?: boolean
  lastActiveAt?: number
}

async function getState(): Promise<VaultStorageState> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["isLocked", "lastActiveAt"], (result) => {
      resolve(result as VaultStorageState)
    })
  })
}

async function setState(updates: Partial<VaultStorageState>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(updates, () => {
      resolve()
    })
  })
}

function updateBadge(isLocked: boolean) {
  if (isLocked) {
    chrome.action.setBadgeText({ text: "LOCK" })
    chrome.action.setBadgeBackgroundColor({ color: "#f59e0b" })
  } else {
    chrome.action.setBadgeText({ text: "" })
  }
}

async function checkInactivity() {
  const state = await getState()
  const lastActive = state.lastActiveAt || Date.now()
  const elapsed = Date.now() - lastActive

  if (elapsed >= INACTIVITY_TIMEOUT_MS && !state.isLocked) {
    await setState({ isLocked: true })
    updateBadge(true)
    console.log("[Company Vault] Vault auto-locked after 15 minutes of inactivity.")
  }
}

// 1. Initialize Alarm on Installation or Startup
chrome.runtime.onInstalled.addListener(() => {
  setState({ isLocked: false, lastActiveAt: Date.now() })
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 })
  updateBadge(false)
})

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 })
  checkInactivity()
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    checkInactivity()
  }
})

// 2. Handle Messages from Popup and Content Script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "CV_RECORD_ACTIVITY") {
    getState().then((state) => {
      const isLocked = state.isLocked || false
      setState({ lastActiveAt: Date.now() }).then(() => {
        sendResponse({ success: true, isLocked })
      })
    })
    return true
  }

  if (message?.type === "CV_MANUAL_LOCK") {
    setState({ isLocked: true }).then(() => {
      updateBadge(true)
      sendResponse({ success: true, isLocked: true })
    })
    return true
  }

  if (message?.type === "CV_MANUAL_UNLOCK") {
    setState({ isLocked: false, lastActiveAt: Date.now() }).then(() => {
      updateBadge(false)
      sendResponse({ success: true, isLocked: false })
    })
    return true
  }

  if (message?.type === "CV_GET_LOCK_STATUS") {
    getState().then((state) => {
      const lastActive = state.lastActiveAt || Date.now()
      const elapsed = Date.now() - lastActive
      let isLocked = state.isLocked || false

      if (elapsed >= INACTIVITY_TIMEOUT_MS && !isLocked) {
        isLocked = true
        setState({ isLocked: true })
        updateBadge(true)
      }

      sendResponse({
        isLocked,
        remainingMs: Math.max(0, INACTIVITY_TIMEOUT_MS - elapsed),
      })
    })
    return true
  }
})
