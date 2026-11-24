// Company Vault - In-Page Autofill Content Script (TASK-135 & TASK-136)

console.log(
  "%c[Company Vault] In-Page Autofill Script Active",
  "background: #18181b; color: #10b981; font-size: 12px; font-weight: bold; padding: 4px 8px; border-radius: 4px; border: 1px solid #27272a;"
)

const WEB_ORIGIN =
  (import.meta.env.VITE_WEB_URL as string) ||
  "https://password-manager-beige-seven.vercel.app"

interface VaultAccount {
  id: string
  service: string
  username: string
  password?: string
}

const ATTACHED_ATTR = "data-cv-attached"
let activeDropdown: HTMLElement | null = null
let activeInput: HTMLInputElement | null = null

function closeActiveDropdown() {
  if (activeDropdown && activeDropdown.parentNode) {
    activeDropdown.parentNode.removeChild(activeDropdown)
  }
  activeDropdown = null
  activeInput = null
}

// Native value setter ensuring React, Vue, and Angular forms update state
function setNativeValue(element: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )?.set
  const prototype = Object.getPrototypeOf(element)
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(
    prototype,
    "value"
  )?.set

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(element, value)
  } else if (valueSetter) {
    valueSetter.call(element, value)
  } else {
    element.value = value
  }

  element.dispatchEvent(new Event("input", { bubbles: true }))
  element.dispatchEvent(new Event("change", { bubbles: true }))
}

function fillForm(triggerInput: HTMLInputElement, account: { username: string; password?: string }) {
  const form = triggerInput.form || triggerInput.closest("form") || document.body

  const inputs = Array.from(
    form.querySelectorAll<HTMLInputElement>('input:not([type="hidden"])')
  )

  const passwordInput = inputs.find(
    (input) => input.type === "password" && input.offsetParent !== null
  )

  const usernameInput = inputs.find((input) => {
    if (input === passwordInput) return false
    const type = (input.type || "text").toLowerCase()
    const name = (input.name || "").toLowerCase()
    const id = (input.id || "").toLowerCase()
    const autocomplete = (input.getAttribute("autocomplete") || "").toLowerCase()

    return (
      type === "email" ||
      type === "text" ||
      autocomplete.includes("username") ||
      autocomplete.includes("email") ||
      name.includes("user") ||
      name.includes("email") ||
      name.includes("login") ||
      id.includes("user") ||
      id.includes("email")
    )
  })

  // Fill username
  if (usernameInput) {
    setNativeValue(usernameInput, account.username)
  } else if (triggerInput.type !== "password") {
    setNativeValue(triggerInput, account.username)
  }

  // Fill password
  if (account.password) {
    if (passwordInput) {
      setNativeValue(passwordInput, account.password)
    } else if (triggerInput.type === "password") {
      setNativeValue(triggerInput, account.password)
    }
  }

  closeActiveDropdown()
}

async function showDropdown(input: HTMLInputElement) {
  closeActiveDropdown()
  activeInput = input

  const rect = input.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return

  const dropdown = document.createElement("div")
  dropdown.id = "company-vault-dropdown-root"

  const dropdownWidth = Math.min(Math.max(rect.width, 280), 340)
  let left = rect.width > 320 ? rect.right - dropdownWidth : rect.left
  if (left < 10) left = 10
  if (left + dropdownWidth > window.innerWidth - 10) {
    left = window.innerWidth - dropdownWidth - 10
  }

  let top = rect.bottom + 6
  if (top + 240 > window.innerHeight && rect.top > 250) {
    top = rect.top - 246
  }

  dropdown.style.cssText = `
    position: fixed;
    top: ${top}px;
    left: ${left}px;
    width: ${dropdownWidth}px;
    background: #121215;
    border: 1px solid #27272a;
    border-radius: 10px;
    box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08);
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #fafafa;
    padding: 6px;
    box-sizing: border-box;
    user-select: none;
    animation: cvFadeIn 0.12s ease-out;
  `

  dropdown.onmousedown = (e) => {
    e.stopPropagation()
  }

  // Initial Loading Skeleton in Dropdown
  dropdown.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;border-bottom:1px solid #27272a;margin-bottom:6px;font-size:11px;color:#a1a1aa;font-weight:500;">
      <div style="display:flex;align-items:center;gap:6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fafafa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/>
          <path d="m21 2-9.6 9.6"/>
          <circle cx="7.5" cy="15.5" r="5.5"/>
        </svg>
        <span style="color:#fafafa;font-weight:600;">Company Vault</span>
      </div>
      <span style="font-size:10px;color:#71717a;">Connecting...</span>
    </div>
    <div style="padding:12px;text-align:center;font-size:12px;color:#71717a;">
      Checking web session...
    </div>
  `
  document.body.appendChild(dropdown)
  activeDropdown = dropdown

  // Fetch session & live credentials matching active domain
  const currentDomain = window.location.hostname.replace(/^www\./, "")

  try {
    const sessionRes = await fetch(`${WEB_ORIGIN}/api/extension/session`, {
      method: "GET",
      credentials: "include",
    })
    const sessionData = await sessionRes.json().catch(() => ({ authenticated: false }))

    if (!sessionData.authenticated) {
      // Unauthenticated state
      dropdown.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;border-bottom:1px solid #27272a;margin-bottom:8px;font-size:11px;color:#a1a1aa;font-weight:500;">
          <div style="display:flex;align-items:center;gap:6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span style="color:#fafafa;font-weight:600;">Company Vault</span>
          </div>
          <span style="font-size:10px;color:#f59e0b;font-weight:600;">Locked</span>
        </div>
        <div style="padding:10px 8px 12px;text-align:center;">
          <div style="font-size:12px;font-weight:500;color:#fafafa;margin-bottom:4px;">Web Sign-In Required</div>
          <div style="font-size:11px;color:#71717a;margin-bottom:10px;line-height:1.4;">Sign in to Company Vault on the web to access and autofill passwords.</div>
          <button id="cv-sign-in-btn" style="width:100%;background:#fafafa;color:#09090b;border:none;border-radius:6px;font-size:11px;font-weight:600;padding:6px 12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
            Sign in on Web
          </button>
        </div>
      `
      const signInBtn = dropdown.querySelector("#cv-sign-in-btn")
      if (signInBtn) {
        signInBtn.addEventListener("click", () => {
          window.open(`${WEB_ORIGIN}/login`, "_blank")
          closeActiveDropdown()
        })
      }
      return
    }

    // Check background auto-lock state
    let isAutoLocked = false
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      const lockStatus: { isLocked?: boolean } = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "CV_GET_LOCK_STATUS" }, (res) => {
          resolve(res || {})
        })
      })
      isAutoLocked = !!lockStatus.isLocked
    }

    if (isAutoLocked) {
      dropdown.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;border-bottom:1px solid #27272a;margin-bottom:8px;font-size:11px;color:#a1a1aa;font-weight:500;">
          <div style="display:flex;align-items:center;gap:6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span style="color:#fafafa;font-weight:600;">Company Vault</span>
          </div>
          <span style="font-size:10px;color:#f59e0b;font-weight:600;">Locked</span>
        </div>
        <div style="padding:10px 8px 12px;text-align:center;">
          <div style="font-size:12px;font-weight:500;color:#fafafa;margin-bottom:4px;">Vault Auto-Locked</div>
          <div style="font-size:11px;color:#71717a;margin-bottom:10px;line-height:1.4;">Vault locked after 15 minutes of inactivity to protect secrets.</div>
          <button id="cv-unlock-btn" style="width:100%;background:#fafafa;color:#09090b;border:none;border-radius:6px;font-size:11px;font-weight:600;padding:6px 12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
            Unlock Vault
          </button>
        </div>
      `
      const unlockBtn = dropdown.querySelector("#cv-unlock-btn")
      if (unlockBtn) {
        unlockBtn.addEventListener("click", () => {
          if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
            chrome.runtime.sendMessage({ type: "CV_MANUAL_UNLOCK" }, () => {
              showDropdown(input)
            })
          }
        })
      }
      return
    }

    // Authenticated: Query credentials matching exact domain
    const lookupRes = await fetch(`${WEB_ORIGIN}/api/extension/lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        domain: currentDomain,
        action: "list",
      }),
    })
    const lookupData = await lookupRes.json().catch(() => ({ credentials: [] }))
    const matchingCreds: Array<{ id: string; serviceName: string; username: string }> = lookupData.credentials || []

    dropdown.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;border-bottom:1px solid #27272a;margin-bottom:4px;font-size:11px;color:#a1a1aa;font-weight:500;">
        <div style="display:flex;align-items:center;gap:6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fafafa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/>
            <path d="m21 2-9.6 9.6"/>
            <circle cx="7.5" cy="15.5" r="5.5"/>
          </svg>
          <span style="color:#fafafa;font-weight:600;">Company Vault</span>
        </div>
        <span style="font-size:10px;background:#27272a;color:#10b981;font-weight:600;padding:2px 6px;border-radius:4px;border:1px solid rgba(16,185,129,0.3);">
          ${matchingCreds.length} ${matchingCreds.length === 1 ? "login" : "logins"}
        </span>
      </div>
      <div id="cv-account-list"></div>
    `

    const listContainer = dropdown.querySelector("#cv-account-list")!

    if (matchingCreds.length === 0) {
      listContainer.innerHTML = `
        <div style="padding:14px 8px;text-align:center;">
          <div style="font-size:11px;color:#71717a;">No credentials found for</div>
          <div style="font-size:11px;font-mono;font-weight:600;color:#fafafa;margin-top:2px;">${currentDomain}</div>
          <a href="${WEB_ORIGIN}/projects" target="_blank" style="display:inline-block;font-size:11px;color:#10b981;margin-top:8px;text-decoration:none;">+ Add in Vault</a>
        </div>
      `
      return
    }

    matchingCreds.forEach((cred) => {
      const item = document.createElement("div")
      item.style.cssText = `
        display: flex;
        flex-direction: column;
        padding: 8px 10px;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.15s ease;
      `
      item.innerHTML = `
        <div style="font-size:12px;font-weight:600;color:#fafafa;line-height:1.2;">${cred.username}</div>
        <div style="font-size:11px;color:#71717a;margin-top:2px;">${cred.serviceName} • Click to fill</div>
      `
      item.onmouseenter = () => {
        item.style.background = "#27272a"
      }
      item.onmouseleave = () => {
        item.style.background = "transparent"
      }
      item.onmousedown = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        item.innerHTML = `
          <div style="font-size:12px;font-weight:600;color:#10b981;">Decrypting & filling...</div>
        `
        try {
          // Fetch decrypted password on demand with audit log
          const fillRes = await fetch(`${WEB_ORIGIN}/api/extension/lookup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              action: "fill",
              credentialId: cred.id,
              domain: currentDomain,
            }),
          })
          const fillData = await fillRes.json()
          if (fillData.password) {
            fillForm(input, { username: cred.username, password: fillData.password })
          }
        } catch (err) {
          console.error("Autofill error", err)
          closeActiveDropdown()
        }
      }
      listContainer.appendChild(item)
    })
  } catch (err) {
    dropdown.innerHTML = `
      <div style="padding:12px;text-align:center;font-size:11px;color:#ef4444;">
        Cannot reach Company Vault backend.
      </div>
    `
  }
}

interface AttachedInstance {
  input: HTMLInputElement
  host: HTMLElement
  updatePosition: () => void
  destroy: () => void
}

const attachedInstances = new Set<AttachedInstance>()

function destroyInstance(instance: AttachedInstance) {
  instance.destroy()
  attachedInstances.delete(instance)
}

function attachVaultIcon(input: HTMLInputElement) {
  if (input.getAttribute(ATTACHED_ATTR)) return
  input.setAttribute(ATTACHED_ATTR, "true")

  const iconHost = document.createElement("div")
  iconHost.style.cssText = `
    position: fixed;
    width: 0;
    height: 0;
    pointer-events: none;
    z-index: 2147483647;
  `
  const shadow = iconHost.attachShadow({ mode: "open" })

  const iconBtn = document.createElement("button")
  iconBtn.type = "button"
  iconBtn.title = "Company Vault Autofill"
  iconBtn.style.cssText = `
    position: fixed;
    width: 22px;
    height: 22px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: #18181b;
    color: #e4e4e7;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
    outline: none;
    pointer-events: auto;
    transition: all 0.15s ease;
    box-shadow: 0 2px 5px rgba(0,0,0,0.5);
  `

  iconBtn.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/>
      <path d="m21 2-9.6 9.6"/>
      <circle cx="7.5" cy="15.5" r="5.5"/>
    </svg>
  `

  iconBtn.onmouseenter = () => {
    iconBtn.style.background = "#27272a"
    iconBtn.style.borderColor = "#10b981"
    iconBtn.style.color = "#10b981"
  }
  iconBtn.onmouseleave = () => {
    iconBtn.style.background = "#18181b"
    iconBtn.style.borderColor = "rgba(255, 255, 255, 0.2)"
    iconBtn.style.color = "#e4e4e7"
  }

  // Clicking the icon toggles the dropdown cleanly
  iconBtn.onmousedown = (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Explicitly blur the input so Google Chrome's native autofill popup dismisses immediately
    input.blur()

    if (activeDropdown && activeInput === input) {
      closeActiveDropdown()
    } else {
      showDropdown(input)
    }
  }

  const updatePosition = () => {
    // If input is no longer connected to the DOM (e.g. unmounted after login), clean up completely
    if (!input.isConnected) {
      destroy()
      return
    }

    const rect = input.getBoundingClientRect()
    const isVisible =
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom >= 0 &&
      rect.top <= window.innerHeight &&
      input.offsetParent !== null

    if (!isVisible) {
      iconBtn.style.display = "none"
      if (activeInput === input) {
        closeActiveDropdown()
      }
      return
    }

    iconBtn.style.display = "flex"
    iconBtn.style.top = `${rect.top + (rect.height - 22) / 2}px`
    iconBtn.style.left = `${rect.right - 28}px`

    if (activeDropdown && activeInput === input) {
      const dropdownWidth = Math.min(Math.max(rect.width, 280), 340)
      let left = rect.width > 320 ? rect.right - dropdownWidth : rect.left
      if (left < 10) left = 10
      if (left + dropdownWidth > window.innerWidth - 10) {
        left = window.innerWidth - dropdownWidth - 10
      }

      let top = rect.bottom + 6
      if (top + 240 > window.innerHeight && rect.top > 250) {
        top = rect.top - 246
      }

      activeDropdown.style.top = `${top}px`
      activeDropdown.style.left = `${left}px`
      activeDropdown.style.width = `${dropdownWidth}px`
    }
  }

  const destroy = () => {
    window.removeEventListener("resize", updatePosition)
    window.removeEventListener("scroll", updatePosition)
    if (iconHost.parentNode) {
      iconHost.parentNode.removeChild(iconHost)
    }
    input.removeAttribute(ATTACHED_ATTR)
    if (activeInput === input) {
      closeActiveDropdown()
    }
    attachedInstances.delete(instance)
  }

  const instance: AttachedInstance = {
    input,
    host: iconHost,
    updatePosition,
    destroy,
  }

  shadow.appendChild(iconBtn)
  document.body.appendChild(iconHost)
  attachedInstances.add(instance)

  updatePosition()

  window.addEventListener("resize", updatePosition, { passive: true })
  window.addEventListener("scroll", updatePosition, { passive: true })
}

function isCompanyVaultHost(): boolean {
  const origin = window.location.origin.toLowerCase()
  return (
    origin.includes("localhost") ||
    origin.includes("127.0.0.1") ||
    origin.includes("password-manager-beige-seven.vercel.app") ||
    origin === WEB_ORIGIN.toLowerCase()
  )
}

function isCredentialInput(input: HTMLInputElement): boolean {
  if (input.disabled || input.readOnly || input.offsetParent === null) return false

  // 1. Never attach inside Company Vault dashboard, management pages, or modals (TASK-135)
  if (isCompanyVaultHost() && !window.location.pathname.includes("/login")) {
    return false
  }

  // 2. Never attach to inputs explicitly marked as no-autofill
  if (input.hasAttribute("data-no-autofill") || input.closest("[data-no-autofill]")) {
    return false
  }

  const type = (input.type || "text").toLowerCase()
  if (
    type === "hidden" ||
    type === "search" ||
    type === "submit" ||
    type === "button" ||
    type === "checkbox" ||
    type === "radio" ||
    type === "file" ||
    type === "color" ||
    type === "range" ||
    type === "date" ||
    type === "url" ||
    type === "tel" ||
    type === "number"
  ) {
    return false
  }

  const role = (input.getAttribute("role") || "").toLowerCase()
  const name = (input.name || "").toLowerCase()
  const id = (input.id || "").toLowerCase()
  const placeholder = (input.placeholder || "").toLowerCase()
  const autocomplete = (input.getAttribute("autocomplete") || "").toLowerCase()

  // Exclude search fields
  if (
    role === "searchbox" ||
    name.includes("search") ||
    placeholder.includes("search") ||
    id.includes("search")
  ) {
    return false
  }

  // Exclude URL fields (e.g. loginUrl, websiteUrl)
  if (
    name.includes("url") ||
    id.includes("url") ||
    placeholder.includes("http") ||
    placeholder.includes("url")
  ) {
    return false
  }

  // Exclude contact, address, billing, phone, or company detail fields
  if (
    name.includes("contact") ||
    id.includes("contact") ||
    placeholder.includes("contact") ||
    name.includes("company") ||
    name.includes("phone") ||
    name.includes("notes")
  ) {
    return false
  }

  // 3. Password fields are always credential fields
  if (type === "password") return true

  // 4. Standalone single-step login username fields
  if (autocomplete === "username" || autocomplete === "current-password") return true

  // 5. For email and username text inputs:
  // ONLY attach if the form/container actually has a password field (it's an authentic login form!)
  const container =
    input.form ||
    input.closest("form") ||
    input.closest('[role="dialog"]') ||
    input.parentElement?.parentElement

  const hasPasswordField = container
    ? !!container.querySelector('input[type="password"]:not([type="hidden"])')
    : false

  if (hasPasswordField) {
    if (type === "email" || autocomplete.includes("email") || autocomplete.includes("username")) {
      return true
    }
    if (
      name.includes("username") ||
      name.includes("user_id") ||
      name === "user" ||
      name === "login" ||
      name === "email"
    ) {
      return true
    }
    if (
      id.includes("username") ||
      id.includes("user_id") ||
      id === "user" ||
      id === "login" ||
      id === "email"
    ) {
      return true
    }
  }

  return false
}

function scanInputs() {
  // 1. Clean up instances for disconnected or removed inputs (e.g. after login / route change)
  for (const instance of Array.from(attachedInstances)) {
    if (!instance.input.isConnected) {
      destroyInstance(instance)
    } else {
      instance.updatePosition()
    }
  }

  // 2. Discover visible login/auth input fields
  const inputs = document.querySelectorAll<HTMLInputElement>("input")
  inputs.forEach((input) => {
    if (isCredentialInput(input)) {
      attachVaultIcon(input)
    }
  })
}

// Debounced scan using requestAnimationFrame for smooth UI and zero lag
let scanScheduled = false
function requestScan() {
  if (scanScheduled) return
  scanScheduled = true
  requestAnimationFrame(() => {
    scanScheduled = false
    scanInputs()
  })
}

// Initial scan
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", requestScan)
} else {
  requestScan()
}

// Observe dynamic DOM changes (e.g. Next.js / React SPA navigation or modals)
const observer = new MutationObserver(() => {
  requestScan()
})

if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true })
} else {
  window.addEventListener("DOMContentLoaded", () => {
    observer.observe(document.body, { childList: true, subtree: true })
  })
}

// Listen to browser navigation & SPA history changes
window.addEventListener("popstate", requestScan)

const originalPushState = history.pushState
if (originalPushState) {
  history.pushState = function (...args) {
    originalPushState.apply(this, args)
    requestScan()
  }
}

const originalReplaceState = history.replaceState
if (originalReplaceState) {
  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args)
    requestScan()
  }
}

// Close dropdown on outside click, including when clicking back into the input
document.addEventListener("mousedown", (e) => {
  const target = e.target as HTMLElement
  if (
    activeDropdown &&
    !activeDropdown.contains(target) &&
    !target.closest("#company-vault-dropdown-root")
  ) {
    closeActiveDropdown()
  }
})

// Close dropdown on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && activeDropdown) {
    closeActiveDropdown()
  }
})

// Listen for autofill requests from the Extension Popup UI
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "CV_AUTOFILL_CREDENTIAL" && message.payload) {
      const pwdInput = document.querySelector<HTMLInputElement>(
        'input[type="password"]:not([type="hidden"])'
      )
      const usernameInput = document.querySelector<HTMLInputElement>(
        'input[type="email"], input[autocomplete*="username"], input[name*="user" i], input[type="text"]'
      )
      const targetInput = pwdInput || usernameInput || activeInput

      if (targetInput) {
        fillForm(targetInput, {
          username: message.payload.username,
          password: message.payload.password,
        })
        sendResponse({ success: true })
      } else {
        sendResponse({ success: false, error: "No input found to fill" })
      }
    }
  })
}
