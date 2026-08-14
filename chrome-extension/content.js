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
      <div class="zenwrite-modal-header">
        <span class="zenwrite-title">✨ ZenWrite AI Suggestions</span>
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

  if (message.type === "SHOW_LOADING") {
    showModal();
    document.getElementById("zenwrite-loading").style.display = "block";
    document.getElementById("zenwrite-custom-prompt").style.display = "none";
    document.getElementById("zenwrite-diff-container").style.display = "none";
    document.getElementById("zenwrite-footer-actions").style.display = "none";
  } 
  
  else if (message.type === "GET_CUSTOM_PROMPT") {
    showModal();
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
    document.getElementById("zenwrite-loading").style.display = "none";
    document.getElementById("zenwrite-custom-prompt").style.display = "none";
    document.getElementById("zenwrite-diff-container").style.display = "block";
    document.getElementById("zenwrite-footer-actions").style.display = "flex";

    const diffContent = document.getElementById("zenwrite-diff-content");
    diffContent.innerHTML = generateDiffHtml(message.originalText, message.proposedText);

    // Bind Accept button
    const acceptBtn = document.getElementById("zenwrite-btn-accept");
    
    if (message.proposedText.startsWith("Error:") || message.proposedText.startsWith("AI Generation Error:")) {
      acceptBtn.style.display = "none";
    } else {
      acceptBtn.style.display = "block";
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
