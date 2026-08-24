# ZenWrite AI Editor & Browser Extension Bundle

This repository contains the complete source code for **ZenWrite AI**, featuring a distraction-free web document editor, Progressive Web App (PWA), and a companion Chrome/Edge extension.

**Live Production URL:** [https://khalifa-branding.github.io/ZenWrite/](https://khalifa-branding.github.io/ZenWrite/)

---

## 📁 Directory Structure

*   `index.html` — Production Web Application and PWA root.
*   `sw.js` & `manifest.json` — PWA Service Worker (v2.3.0) and web manifest.
*   `web-editor/`
    *   `editor.html` — Standalone portable text editor interface.
    *   `config.js` — Global configuration script for pre-baked corporate keys.
    *   `sw.js` & `manifest.json` — Standalone PWA assets.
    *   `favicon.ico` & `favicon.jpg` — High-resolution icons.
*   `chrome-extension/`
    *   `manifest.json` — Manifest V3 extension configuration.
    *   `background.js` — Context menus builder, Gemini API failover router, and counter-prompt engine.
    *   `content.js` & `content.css` — Non-intrusive page injection scripts and diff viewer.
    *   `popup.html`, `popup.js`, `popup.css` — Extension settings widget.
*   `chrome-extension.zip` & `ZenWrite-Bundle.zip` — Pre-packaged 1-click distribution bundles.

---

## 🚀 Key Features & AI Suite

### 1. 🤖 AI Agent Next-Turn Counter-Prompt Engine
* **Automatic Smart Paste Detection**: Pasting terminal outputs, code walkthroughs, test runs, or diffs displays a non-intrusive banner (`🤖 AI Agent Response detected` $\rightarrow$ `[ ⚡ Counter-Prompt ]`).
* **1-Tap Directive Scenario Chips**: Instantly orient coding agents (Antigravity, Cursor, Claude Code, Aider, Codex):
  * 🟢 **Proceed & Implement**: Confirms approval and gives immediate imperative execution commands.
  * 🧪 **Verify & Test**: Directs agent to run automated test suites and verify integrity.
  * 🛠️ **Fix Bugs & Errors**: Commands systematic root-cause debugging and edge-case fixing.
  * 🧹 **Clean & Refactor**: Directs code simplification while preserving backward compatibility.
  * 🚀 **Commit & Sync**: Instructs syntax validation, git staging, descriptive commit messaging, and remote push.
* **1-Click Copy for Terminal**: Formatted for direct `Ctrl+V` back into agent CLIs with universal clipboard fallbacks.

### 2. ✨ 5-Part Master Prompt Studio
* Transforms rough, vague task ideas into deterministic, production-ready prompts using the gold-standard 5-part architecture:
  1. `# PERSONA & ROLE`
  2. `# TASK OBJECTIVE`
  3. `# CONTEXT & BACKGROUND`
  4. `# SPECIFIC RULES & CONSTRAINTS`
  5. `# EXPECTED OUTPUT FORMAT`

### 3. 🧩 Everywhere Extension (`chrome-extension/`)
* Right-click selected text in any web application (GitHub PRs, Cursor Web, Claude, ChatGPT, Jira, Notion) to trigger:
  * `🤖 Agent Counter-Prompt`
  * `✨ 5-Part Master Prompt`
  * `🎭 Change Tone` (Professional, Casual, Persuasive, Friendly, Urgent, Sarcastic)
  * `🌐 Translate To` (Spanish, French, German, Japanese, Chinese, Arabic)
  * `💡 Explain This`

### 4. 📂 Native Drag-and-Drop File Import & Multi-Format Export
* Drag any `.md`, `.txt`, `.json`, or code file over the editor to trigger a visual drop-zone overlay (`.drag-active`) and load the file into the active document.
* Export cleanly to **Markdown (`.md`)**, **Plain Text (`.txt`)**, **HTML (`.html`)**, **Word (`.doc`)**, or **PDF Document (`.pdf`)**.

### 5. ⚡ PWA v2.3.0 Offline Shell & Auto-Collapsed Zen Canvas
* **Service Worker v2.3.0**: Fully functional offline editor with stale-while-revalidate caching.
* **Auto-Collapsed Left Panel**: The document sidebar starts collapsed on launch for a distraction-free writing canvas, auto-collapsing smoothly on document switch.
* **Mobile Floating Selection Pill**: 1-tap thumb-zone actions (AI, Counter-Prompt, Copy, Cut, Delete, Select All) with WCAG 44×44px touch compliance.

---

## 👥 Installation & Distribution

### Web Editor & PWA
1. Open [https://khalifa-branding.github.io/ZenWrite/](https://khalifa-branding.github.io/ZenWrite/) in any modern browser.
2. Click **Install App** in the sidebar footer or browser address bar to install as a standalone desktop/mobile app.

### Chrome / Edge Extension
1. Download or extract `chrome-extension.zip`.
2. Open Chrome/Edge and navigate to **`chrome://extensions`**.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** (top-left) and select the `chrome-extension` folder.
5. All right-click AI actions and shortcuts will activate immediately!

---

## 🛡️ API Resiliency & Smart Key Ring Failover

* **Multi-Key Load Balancing**: Store multiple free Gemini API keys in Settings. ZenWrite automatically balances requests across keys and fails over instantly if any key hits a 429 quota rate limit.
* **Cross-Model Independent Quota Ladder**: Automatically routes requests across **`gemini-2.5-flash-lite`**, **`gemini-2.5-flash`**, **`gemini-3.7-flash`**, and **`gemini-3.6-flash`**, leveraging independent quota buckets on Google AI Studio.
