// Keep track of the active input/textarea/contentEditable element
let activeElement = null;
let savedSelectionRange = null;

// Track active element during focus/clicks
document.addEventListener("focusin", (e) => {
  if (isInputOrEditable(e.target)) {
    activeElement = e.target;
  }
});

document.addEventListener("mousedown", (e) => {
  if (isInputOrEditable(e.target)) {
    activeElement = e.target;
  }
});

// Track the active selection range continuously to prevent loss during modal popups
document.addEventListener("selectionchange", () => {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    if (range.toString().trim().length > 0) {
      savedSelectionRange = range.cloneRange();
    }
  }
});
function isInputOrEditable(el) {
  if (!el) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.isContentEditable ||
    el.getAttribute("contenteditable") === "true"
  );
}

function getFullContext() {
  if (activeElement) {
    if (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA") {
      return activeElement.value || "";
    } else if (activeElement.isContentEditable || activeElement.getAttribute("contenteditable") === "true") {
      return activeElement.innerText || "";
    }
  }
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const parent = selection.getRangeAt(0).commonAncestorContainer;
    if (parent) {
      const blockEl = parent.nodeType === 3 ? parent.parentNode : parent;
      if (blockEl) {
        return blockEl.textContent || "";
      }
    }
  }
  return "";
}

// Enterprise Content-Aware Sensing & Classification Engine (CAIS)
const ContentSense = {
  PATTERNS: {
    SECRETS: [
      /(?:akiasia|asia)[a-z0-9]{16}/i,
      /gh[pousr]_[a-zA-Z0-9]{36,}/,
      /ai-za[0-9a-zA-Z-_]{35}/i,
      /sk-[a-zA-Z0-9]{32,}/,
      /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/,
      /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/
    ],
    JSON: /^\s*[\{\[][\s\S]*[\}\]]\s*$/,
    SQL: /\b(SELECT|INSERT\s+INTO|UPDATE\s+\w+|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE|FROM\s+\w+|WHERE\s+\w+|GROUP\s+BY|ORDER\s+BY|HAVING)\b/i,
    CODE: /\b(function\s*\(|function\s+\w+|def\s+\w+|class\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=|import\s+.*from|export\s+default|public\s+static\s+void|interface\s+\w+|type\s+\w+\s*=|<\/?[a-z][\s\S]*>)/i,
    SPEC: /^(?:#{1,6}\s+.*|\|[^\n\r|]+\|[^\n\r|]+\||\s*[-*]\s+\[[ xX]\]\s+.*|\s*[-*]\s+Requirements?:?)/m,
    PROMPT: /(?:You are a|Persona & Role|Task Objective|Context & Background|Specific Rules & Constraints|Expected Output Format|<USER_REQUEST>|\[PROMPT\]|\{\{.*\}\})/i,
    EMAIL: /(?:Dear\s+[A-Z]|Hi\s+[A-Z]|Hello\s+[A-Z]|Best\s+regards|Sincerely|Thanks\s+and\s+regards|Please\s+find\s+attached|Subject:)/i
  },

  analyze(text) {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return { modality: 'PROSE', label: 'Prose', hasSecrets: false };
    }
    const trimmed = text.trim();
    const hasSecrets = this.PATTERNS.SECRETS.some(rx => rx.test(trimmed));
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try { JSON.parse(trimmed); return { modality: 'JSON', label: 'JSON Data', hasSecrets }; } catch (e) {}
    }
    if (this.PATTERNS.PROMPT.test(trimmed)) return { modality: 'PROMPT', label: 'AI Prompt', hasSecrets };
    if ((trimmed.match(this.PATTERNS.SQL) || []).length >= 1) return { modality: 'SQL', label: 'SQL Query', hasSecrets };
    if (this.PATTERNS.CODE.test(trimmed)) return { modality: 'CODE', label: 'Code Script', hasSecrets };
    if (this.PATTERNS.SPEC.test(trimmed)) return { modality: 'SPEC', label: 'Technical Spec', hasSecrets };
    if (this.PATTERNS.EMAIL.test(trimmed)) return { modality: 'EMAIL', label: 'Business Email', hasSecrets };
    return { modality: 'PROSE', label: 'Prose', hasSecrets };
  }
};

// Modal HTML generation
function createOverlayModal() {
  // Check if modal already exists
  let modal = document.getElementById("zenwrite-overlay-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "zenwrite-overlay-modal";
  modal.className = "zenwrite-reset"; // prefix styles to prevent site style contamination
  modal.innerHTML = `
    <div class="zenwrite-modal-card">
      <div class="zenwrite-modal-header" style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="zenwrite-title">✨ ZenWrite AI</span>
          <span id="zenwrite-context-badge" style="font-size: 11px; padding: 2px 7px; border-radius: 10px; background: rgba(139,92,246,0.15); color: #A78BFA; border: 1px solid rgba(139,92,246,0.3); font-weight: 500;">Prose</span>
        </div>
        <button class="zenwrite-close-btn" id="zenwrite-btn-close">&times;</button>
      </div>
      <div class="zenwrite-modal-body">
        <div id="zenwrite-loading" class="zenwrite-loading-container" style="display: none;">
          <div class="zenwrite-pulse">
            <div class="zenwrite-dot"></div>
            <div class="zenwrite-dot"></div>
            <div class="zenwrite-dot"></div>
          </div>
          <p class="zenwrite-loading-text">Polishing with Gemini AI...</p>
        </div>

        <div id="zenwrite-custom-prompt" class="zenwrite-prompt-container" style="display: none;">
          <label class="zenwrite-label">What would you like ZenWrite AI to do?</label>
          <input type="text" id="zenwrite-custom-input" placeholder="e.g. translate to French, make it professional..." class="zenwrite-input">
          <button id="zenwrite-btn-custom-submit" class="zenwrite-btn zenwrite-btn-primary" style="margin-top: 10px; width: 100%;">Run AI Instruction</button>
        </div>

        <div id="zenwrite-diff-container" class="zenwrite-diff-wrapper" style="display: none;">
          <div class="zenwrite-diff-header">Proposed Changes:</div>
          <div id="zenwrite-diff-content" class="zenwrite-diff-box"></div>
        </div>
      </div>
      <div class="zenwrite-modal-footer" id="zenwrite-footer-actions" style="display: none;">
        <button class="zenwrite-btn zenwrite-btn-secondary" id="zenwrite-btn-copy">Copy</button>
        <button class="zenwrite-btn zenwrite-btn-secondary" id="zenwrite-btn-reject">Dismiss</button>
        <button class="zenwrite-btn zenwrite-btn-primary" id="zenwrite-btn-accept">Accept & Replace</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Bind events
  document.getElementById("zenwrite-btn-close").onclick = hideModal;
  document.getElementById("zenwrite-btn-reject").onclick = hideModal;

  return modal;
}

function showModal() {
  const modal = createOverlayModal();
  modal.style.display = "flex";
  const acceptBtn = document.getElementById("zenwrite-btn-accept");
  if (acceptBtn) {
    acceptBtn.style.display = "block";
  }
}

function hideModal() {
  const modal = document.getElementById("zenwrite-overlay-modal");
  if (modal) {
    modal.style.display = "none";
  }
}

// Word-based diff generator for simple DOM rendering
function generateDiffHtml(original, proposed) {
  if (proposed.startsWith("Error:") || proposed.startsWith("AI Generation Error:")) {
    return `<div style="color: #EF4444; font-weight: 500;">${proposed}</div>`;
  }
  
  const origWords = original.split(/\s+/);
  const propWords = proposed.split(/\s+/);
  
  let i = 0, j = 0;
  let diffHtml = "";

  while (i < origWords.length || j < propWords.length) {
    if (i < origWords.length && j < propWords.length && origWords[i] === propWords[j]) {
      diffHtml += escapeHtml(origWords[i]) + " ";
      i++;
      j++;
    } else {
      let delBlock = "";
      while (i < origWords.length && (j >= propWords.length || origWords[i] !== propWords[j])) {
        delBlock += origWords[i] + " ";
        i++;
      }
      if (delBlock) {
        diffHtml += `<span class="zw-diff-del">${escapeHtml(delBlock.trim())}</span> `;
      }

      let insBlock = "";
      while (j < propWords.length && (i >= origWords.length || propWords[j] !== origWords[i])) {
        insBlock += propWords[j] + " ";
        j++;
      }
      if (insBlock) {
        diffHtml += `<span class="zw-diff-ins">${escapeHtml(insBlock.trim())}</span> `;
      }
    }
  }
  return diffHtml;
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Background messages listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Capture active selection range
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    savedSelectionRange = selection.getRangeAt(0).cloneRange();
  }

  if (message.type === "TRIGGER_AI_ACTION") {
    showModal();
    document.getElementById("zenwrite-loading").style.display = "block";
    document.getElementById("zenwrite-custom-prompt").style.display = "none";
    document.getElementById("zenwrite-diff-container").style.display = "none";
    document.getElementById("zenwrite-footer-actions").style.display = "none";

    const fullContext = getFullContext();
    chrome.runtime.sendMessage({
      type: "RUN_CONTEXT_AWARE_AI",
      action: message.action,
      selectionText: message.selectionText,
      fullContext: fullContext
    }).catch(err => console.warn("ZenWrite context-aware message failed:", err));
    return;
  }

  const updateBadge = (text) => {
    const badge = document.getElementById("zenwrite-context-badge");
    if (badge && text) {
      const sense = ContentSense.analyze(text);
      badge.textContent = sense.label;
      if (sense.hasSecrets) {
        badge.style.color = '#EF4444';
        badge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        badge.style.background = 'rgba(239, 68, 68, 0.15)';
        badge.textContent = `${sense.label} (⚠️ Secrets)`;
      } else {
        badge.style.color = '#A78BFA';
        badge.style.borderColor = 'rgba(139, 92, 246, 0.3)';
        badge.style.background = 'rgba(139, 92, 246, 0.15)';
      }
    }
  };

  if (message.type === "SHOW_LOADING") {
    showModal();
    updateBadge(message.text || "");
    document.getElementById("zenwrite-loading").style.display = "block";
    document.getElementById("zenwrite-custom-prompt").style.display = "none";
    document.getElementById("zenwrite-diff-container").style.display = "none";
    document.getElementById("zenwrite-footer-actions").style.display = "none";
  } 
  
  else if (message.type === "GET_CUSTOM_PROMPT") {
    showModal();
    updateBadge(message.selectionText || "");
    document.getElementById("zenwrite-loading").style.display = "none";
    document.getElementById("zenwrite-custom-prompt").style.display = "block";
    document.getElementById("zenwrite-diff-container").style.display = "none";
    document.getElementById("zenwrite-footer-actions").style.display = "none";

    const input = document.getElementById("zenwrite-custom-input");
    input.value = "";
    input.focus();

    // Trigger run command
    document.getElementById("zenwrite-btn-custom-submit").onclick = () => {
      const instruction = input.value.trim();
      if (!instruction) return;

      document.getElementById("zenwrite-custom-prompt").style.display = "none";
      document.getElementById("zenwrite-loading").style.display = "block";

      chrome.runtime.sendMessage({
        type: "RUN_CUSTOM_PROMPT_API",
        instruction: instruction,
        selectionText: message.selectionText,
        fullContext: getFullContext()
      }).catch(err => console.warn("ZenWrite custom prompt message failed:", err));
    };
  } 
  
  else if (message.type === "SHOW_DIFF") {
    showModal();
    updateBadge(message.originalText || "");
    document.getElementById("zenwrite-loading").style.display = "none";
    document.getElementById("zenwrite-custom-prompt").style.display = "none";
    document.getElementById("zenwrite-diff-container").style.display = "block";
    document.getElementById("zenwrite-footer-actions").style.display = "flex";

    const diffContent = document.getElementById("zenwrite-diff-content");
    diffContent.innerHTML = generateDiffHtml(message.originalText, message.proposedText);

    // Bind Copy and Accept buttons
    const acceptBtn = document.getElementById("zenwrite-btn-accept");
    const copyBtn = document.getElementById("zenwrite-btn-copy");
    
    if (copyBtn) {
      copyBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(message.proposedText);
          copyBtn.textContent = "Copied!";
          setTimeout(() => { copyBtn.textContent = "Copy"; }, 2000);
        } catch (err) {
          console.error("Failed to copy:", err);
        }
      };
    }
    
    if (message.proposedText.startsWith("Error:") || message.proposedText.startsWith("AI Generation Error:")) {
      acceptBtn.style.display = "none";
      if (copyBtn) copyBtn.style.display = "none";
    } else {
      acceptBtn.style.display = "block";
      if (copyBtn) copyBtn.style.display = "block";
      acceptBtn.onclick = () => {
        replaceTextOnWebpage(message.originalText, message.proposedText);
        hideModal();
      };
    }
  }
  
  else if (message.type === "SHOW_EXPLANATION") {
    showModal();
    document.getElementById("zenwrite-loading").style.display = "none";
    document.getElementById("zenwrite-custom-prompt").style.display = "none";
    document.getElementById("zenwrite-diff-container").style.display = "block";
    document.getElementById("zenwrite-footer-actions").style.display = "flex";

    const acceptBtn = document.getElementById("zenwrite-btn-accept");
    if (acceptBtn) {
      acceptBtn.style.display = "none";
    }

    const copyBtn = document.getElementById("zenwrite-btn-copy");
    if (copyBtn) {
      copyBtn.style.display = "block";
      copyBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(message.explanation);
          copyBtn.textContent = "Copied!";
          setTimeout(() => { copyBtn.textContent = "Copy"; }, 2000);
        } catch (err) {
          console.error("Failed to copy:", err);
        }
      };
    }

    const diffContent = document.getElementById("zenwrite-diff-content");
    diffContent.innerHTML = `
      <div style="font-size: 13px; color: #909099; margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Selected Context:</div>
      <div style="background: rgba(255,255,255,0.03); border-left: 3px solid #8B5CF6; padding: 8px 12px; margin-bottom: 16px; font-style: italic; font-size: 13px; color: #E3E3E6; border-radius: 4px;">
        "${escapeHtml(message.text)}"
      </div>
      <div style="font-size: 13px; color: #909099; margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">AI Explanation:</div>
      <div style="line-height: 1.5; font-size: 14px; color: #FAF9F6; word-break: break-word;">
        ${escapeHtml(message.explanation).replace(/\n/g, "<br>")}
      </div>
    `;
  }
});

// Write the AI output back to the target field (supporting standard input and contentEditable elements)
function replaceTextOnWebpage(original, proposed) {
  // If target element is an input/textarea
  if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
    const start = activeElement.selectionStart;
    const end = activeElement.selectionEnd;
    const val = activeElement.value;
    
    activeElement.value = val.substring(0, start) + proposed + val.substring(end);
    
    // Trigger input events to ensure JS frameworks (React/Vue) detect the change
    activeElement.dispatchEvent(new Event("input", { bubbles: true }));
    activeElement.dispatchEvent(new Event("change", { bubbles: true }));
    
    activeElement.focus();
    activeElement.setSelectionRange(start, start + proposed.length);
  } 
  // If target element is contentEditable (like Google Docs, Gmail, Medium, WhatsApp Web)
  else if (savedSelectionRange) {
    try {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedSelectionRange);
      
      // Target element
      const targetNode = savedSelectionRange.commonAncestorContainer;
      const targetElement = targetNode.nodeType === 3 ? targetNode.parentNode : targetNode;
      
      let handledByPaste = false;
      if (targetElement) {
        // Create DataTransfer containing the proposed text
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', proposed);
        
        // Dispatch 'paste' event to let React/Draft.js (WhatsApp Web, Gmail) handle it natively
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
          bubbles: true,
          cancelable: true
        });
        
        targetElement.dispatchEvent(pasteEvent);
        if (pasteEvent.defaultPrevented) {
          handledByPaste = true;
        }
      }
      
      if (!handledByPaste) {
        // Use document.execCommand for native undo/redo integration in standard contentEditable
        const success = document.execCommand("insertText", false, proposed);
        if (!success) {
          // Fallback: manual range deletion & node insertion
          savedSelectionRange.deleteContents();
          const textNode = document.createTextNode(proposed);
          savedSelectionRange.insertNode(textNode);
          
          // Move caret to end of inserted text
          savedSelectionRange.setStartAfter(textNode);
          savedSelectionRange.setEndAfter(textNode);
          selection.removeAllRanges();
          selection.addRange(savedSelectionRange);
          
          // Dispatch input events
          if (activeElement) {
            activeElement.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }
      }
    } catch (e) {
      console.error("ZenWrite: Failed to replace text", e);
    }
  }
}

// Sync settings between the page and extension
window.addEventListener("message", (event) => {
  if (event.data && event.data.type === "GET_EXTENSION_SETTINGS") {
    chrome.runtime.sendMessage({ type: "FETCH_SETTINGS_FOR_PAGE" })
      .then(response => {
        if (response && response.apiKey) {
          window.postMessage({
            type: "SET_PAGE_SETTINGS",
            apiKey: response.apiKey,
            aiModel: response.aiModel
          }, "*");
        }
      })
      .catch(err => console.warn("ZenWrite settings fetch failed:", err));
  }
});
