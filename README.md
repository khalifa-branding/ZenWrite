# ZenWrite AI Editor & Browser Extension Bundle

This bundle contains the complete source code for **ZenWrite AI**, including the web-based document editor and the Chrome/Edge extension.

## Directory Structure

*   `web-editor/`
    *   `editor.html` — The main text editor interface.
    *   `config.js` — Global configuration script file for permanent, universal settings.
    *   `favicon.ico` — High-resolution desktop and shortcut icon.
    *   `favicon.jpg` — Page header logo/favicon.
*   `chrome-extension/`
    *   `manifest.json` — Extension configuration manifest.
    *   `background.js` — Context menus builder and Gemini API router.
    *   `content.js` & `content.css` — Page injection scripts.
    *   `popup.html` & `popup.js` & `popup.css` — Extension settings widget.
    *   `icon-16.png`, `icon-48.png`, `icon-128.png` — Scaled icon assets.

---

## 🚀 AI Writing Features Bundle

ZenWrite comes pre-packaged with six enterprise-grade AI writing tools:
1.  **🎭 Tone Changer**: Highlight text to rewrite it in Professional, Casual, Friendly, Urgent, Persuasive, or Sarcastic tones.
2.  **🌐 Inline Translator**: Translate text directly into Spanish, French, German, Japanese, Chinese, or Arabic.
3.  **🪄 Smart Autocomplete**: Press **`Alt + \`** while typing to fetch ghost text suggestions. Press **`Tab`** to accept or **`Esc`** to dismiss.
4.  **📝 AI Proofreader Drawer**: Click **AI Proofreader** in the header to scan the document for spelling, grammar, and style suggestions with interactive accept/reject cards.
5.  **💡 AI Explainer**: Highlight complex concepts and choose **Explain This** to see definitions in a clean card modal.
6.  **📄 PDF & Word Exporters**: Export documents to clean Microsoft Word formats (`.doc`) or print/save as clean page layouts using PDF print media targets.

---

## 👥 Internal Team Distribution & Pre-Configuration

To distribute this bundle to internal teams with a pre-configured corporate API key:

### 1. Pre-bake a Shared API Key (Optional)
To save your team members from registering their own individual keys, you can hardcode a shared corporate key:
*   **For Web Editor**: Open `web-editor/config.js` and set the shared API key:
    ```javascript
    const ZENWRITE_CONFIG = {
        apiKey: "YOUR_CORPORATE_GEMINI_KEY",
        aiModel: "gemini-3.6-flash"
    };
    ```
*   **For Browser Extension**: Open `chrome-extension/background.js`, locate line 224, and replace the default fallback key with your corporate key:
    ```javascript
    apiKey = "YOUR_CORPORATE_GEMINI_KEY";
    ```

### 2. Loading the Web Editor
1.  Distribute the folder bundle to team members.
2.  Members can double-click `web-editor/editor.html` to open and run the editor in any browser instantly.

### 3. Loading the Chrome / Edge Extension
1.  Open the browser and navigate to **`chrome://extensions`**.
2.  Enable **Developer mode** (top right toggle).
3.  Click **Load unpacked** (top left).
4.  Select the `chrome-extension` folder (or distribute the `chrome-extension.zip` file, which members can extract and load).
5.  All context menus and right-click shortcuts will activate instantly!

---

## 🛡️ Outage Resiliency & Smart Key Ring Failover
ZenWrite is engineered with enterprise-grade API resiliency:
- **Smart Multi-Key Auto-Rotation ("Key Ring")**: Paste one or multiple free Gemini keys in Settings. ZenWrite automatically load-balances and routes requests across the pool. If any key experiences a temporary 429 rate limit, ZenWrite instantly fails over to the next ready key with zero user interruption.
- **Cross-Model Independent Quota Ladder**: Automatically routes requests across **`gemini-2.0-flash`**, **`gemini-1.5-flash`**, and **`gemini-1.5-flash-8b`**, leveraging independent 1,500 Requests/Day free quota buckets on Google AI Studio.
