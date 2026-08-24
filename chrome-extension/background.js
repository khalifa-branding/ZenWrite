// Listen for extension installation to register context menus
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "zenwrite-parent",
    title: "ZenWrite AI Actions",
    contexts: ["selection", "editable"]
  });

  chrome.contextMenus.create({
    parentId: "zenwrite-parent",
    id: "zenwrite-counter-prompt",
    title: "🤖 Agent Counter-Prompt",
    contexts: ["selection", "editable"]
  });

  chrome.contextMenus.create({
    parentId: "zenwrite-parent",
    id: "zenwrite-perfect-prompt",
    title: "✨ 5-Part Master Prompt",
    contexts: ["selection", "editable"]
  });

  chrome.contextMenus.create({
    parentId: "zenwrite-parent",
    id: "zenwrite-grammar",
    title: "🪄 Correct Grammar",
    contexts: ["selection", "editable"]
  });

  chrome.contextMenus.create({
    parentId: "zenwrite-parent",
    id: "zenwrite-rephrase",
    title: "✍️ Rephrase Text",
    contexts: ["selection", "editable"]
  });

  chrome.contextMenus.create({
    parentId: "zenwrite-parent",
    id: "zenwrite-concise",
    title: "📄 Make Concise",
    contexts: ["selection", "editable"]
  });

  chrome.contextMenus.create({
    parentId: "zenwrite-parent",
    id: "zenwrite-expand",
    title: "📖 Elaborate / Expand",
    contexts: ["selection", "editable"]
  });

  chrome.contextMenus.create({
    parentId: "zenwrite-parent",
    id: "zenwrite-shorter",
    title: "✂️ Make Shorter",
    contexts: ["selection", "editable"]
  });

  // Change Tone parent
  chrome.contextMenus.create({
    parentId: "zenwrite-parent",
    id: "tone-parent",
    title: "🎭 Change Tone",
    contexts: ["selection", "editable"]
  });
  
  const tones = [
    { id: "tone-professional", title: "👔 Professional" },
    { id: "tone-casual", title: "👕 Casual" },
    { id: "tone-persuasive", title: "🎯 Persuasive" },
    { id: "tone-friendly", title: "🤝 Friendly" },
    { id: "tone-urgent", title: "⚡ Urgent" },
    { id: "tone-sarcastic", title: "😏 Sarcastic" }
  ];
  tones.forEach(t => {
    chrome.contextMenus.create({
      parentId: "tone-parent",
      id: t.id,
      title: t.title,
      contexts: ["selection", "editable"]
    });
  });

  // Translate Parent
  chrome.contextMenus.create({
    parentId: "zenwrite-parent",
    id: "translate-parent",
    title: "🌐 Translate To",
    contexts: ["selection", "editable"]
  });

  const languages = [
    { id: "translate-es", title: "🇪🇸 Spanish" },
    { id: "translate-fr", title: "🇫🇷 French" },
    { id: "translate-de", title: "🇩🇪 German" },
    { id: "translate-ja", title: "🇯🇵 Japanese" },
    { id: "translate-zh", title: "🇨🇳 Chinese" },
    { id: "translate-ar", title: "🇸🇦 Arabic" }
  ];
  languages.forEach(l => {
    chrome.contextMenus.create({
      parentId: "translate-parent",
      id: l.id,
      title: l.title,
      contexts: ["selection", "editable"]
    });
  });

  chrome.contextMenus.create({
    parentId: "zenwrite-parent",
    id: "zenwrite-explain",
    title: "💡 Explain This",
    contexts: ["selection", "editable"]
  });

  chrome.contextMenus.create({
    parentId: "zenwrite-parent",
    id: "zenwrite-custom",
    title: "🤖 Run Custom Prompt...",
    contexts: ["selection", "editable"]
  });
});

// Click handler for context menus
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id) return;

  const action = info.menuItemId;
  const selectionText = info.selectionText || "";

  // Handle custom prompt step (requires user input in page)
  if (action === "zenwrite-custom") {
    chrome.tabs.sendMessage(tab.id, {
      type: "GET_CUSTOM_PROMPT",
      selectionText: selectionText
    }).catch(err => console.warn("GET_CUSTOM_PROMPT sendMessage failed:", err));
    return;
  }

  // Predefined actions are sent to content script first to get full context
  chrome.tabs.sendMessage(tab.id, {
    type: "TRIGGER_AI_ACTION",
    action: action,
    selectionText: selectionText
  }).catch(err => console.warn("TRIGGER_AI_ACTION sendMessage failed:", err));
});

// Listener for custom prompt and context-aware submissions from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "RUN_CONTEXT_AWARE_AI") {
    const action = request.action;
    const selectionText = request.selectionText;
    const fullContext = request.fullContext;

    let promptInstruction = "";
    if (action === "zenwrite-counter-prompt") {
      promptInstruction = `You are an expert AI Agent Director and Prompt Engineer. The user is collaborating with an autonomous AI coding agent in a CLI/IDE terminal (such as Antigravity, Cursor, Claude Code, Aider, or Codex).

The user has highlighted the AI agent's latest response/output. Your task is to generate a context-aware, highly actionable NEXT-TURN COUNTER-PROMPT that the user can copy and paste directly back into the agent's terminal without reading, analyzing, or manually drafting a reply.

Goal: Acknowledge the plan/step proposed by the agent, confirm approval with no unnecessary delay, and give direct, imperative instructions to execute and implement the changes immediately.

Structure the generated counter-prompt cleanly as:
1. Short direct confirmation/evaluation of the current step.
2. Numbered list of concrete next actions/commands the agent must execute.
3. Explicit constraints (e.g. preserve working code, run integrity checks, keep comments).

Formatting rules:
- Return ONLY the exact counter-prompt text ready to paste into the terminal.
- Do not wrap the entire response in triple backticks.
- Do not include conversational introductory remarks like "Here is your counter prompt:".
- Make it authoritative, concise, and unambiguous.`;
    } else if (action === "zenwrite-perfect-prompt") {
      promptInstruction = `You are a world-class Prompt Engineer and AI Alignment Specialist. Your expertise lies in dissecting vague, rough, or unstructured user requests and transforming them into highly optimized, reliable, and context-aware master prompts.

Your objective is to take the rough draft or task description provided by the user and engineer it into a high-performing, production-ready master prompt following this exact 5-part structural blueprint:

# PERSONA & ROLE
[Define a highly specific, expert persona for the AI with deep domain authority]

# TASK OBJECTIVE
[State clearly and concisely what the AI must accomplish using active, imperative verbs]

# CONTEXT & BACKGROUND
[Provide the necessary situational awareness, problem space, and operational context]

# SPECIFIC RULES & CONSTRAINTS
- [Constraint 1: Required Methodology & Inclusion Criteria]
- [Constraint 2: Negative Constraints - What to Avoid]
- [Constraint 3: Edge Case & Quality Guidelines]
- [Constraint 4: Tone, Depth, and Technical Rigor]

# EXPECTED OUTPUT FORMAT
[Define the exact structure, layout, or markdown/JSON schema of the final response]

Meta-Engineering Rules:
- Use clear bracket placeholders like [Insert Text Here] or [Variable] for dynamic inputs.
- No Conversational Filler: Output ONLY the engineered master prompt. Do not wrap the whole response in triple backticks or include conversational introductory/concluding remarks.`;
    } else if (action === "zenwrite-grammar") {
      promptInstruction = "Proofread and correct the spelling, grammar, and sentence structure of the text. Keep all styling intact. Return ONLY the updated corrected text without any extra text or quotes.";
    } else if (action === "zenwrite-rephrase") {
      promptInstruction = "Rewrite and polish the target text to elevate its professional quality, clarity, and stylistic flow. Elevate vocabulary, eliminate passive voice, and remove wordiness while retaining all core semantic meanings, variables, and technical terms. Preserve all structural formatting, such as lists, headings, code blocks, and markdown syntax. Ensure the output reads elegantly and naturally. Return ONLY the polished, rewritten text. Do not wrap the output in quotes. Do not include any explanations.";
    } else if (action === "zenwrite-concise") {
      promptInstruction = "Make the text more concise and direct. Keep formatting. Return ONLY the direct concise text.";
    } else if (action === "zenwrite-shorter") {
      promptInstruction = "Rewrite the text to make it significantly shorter and more concise, keeping only the absolute core message. Return ONLY the shortened text without explanations.";
    } else if (action === "zenwrite-expand") {
      promptInstruction = "Expand and elaborate on the text by adding descriptive depth and context. Return ONLY the expanded text with markdown intact.";
    } else if (action === "zenwrite-explain") {
      promptInstruction = "Explain the following text or concept in a concise, informative manner. Focus on definitions, background context, and clear explanations. Keep it under 150 words.";
    } else if (action.startsWith("tone-")) {
      const tone = action.replace("tone-", "");
      promptInstruction = `Rewrite and adjust the tone of the target text to sound ${tone}. Preserve all markdown formatting, headings, and lists. Return ONLY the rewritten text without explanations, greetings, or extra quotes.`;
    } else if (action.startsWith("translate-")) {
      const langCode = action.replace("translate-", "");
      let language = "English";
      if (langCode === "es") language = "Spanish";
      else if (langCode === "fr") language = "French";
      else if (langCode === "de") language = "German";
      else if (langCode === "ja") language = "Japanese";
      else if (langCode === "zh") language = "Chinese";
      else if (langCode === "ar") language = "Arabic";
      
      promptInstruction = `Translate the target text into ${language}. Preserve all markdown formatting, links, and HTML structure. Return ONLY the translation without any conversational remarks.`;
    }

    if (promptInstruction) {
      runGeminiAI(promptInstruction, selectionText, fullContext).then(responseText => {
        if (action === "zenwrite-explain") {
          chrome.tabs.sendMessage(sender.tab.id, {
            type: "SHOW_EXPLANATION",
            text: selectionText,
            explanation: responseText || ""
          }).catch(err => console.warn("SHOW_EXPLANATION sendMessage failed:", err));
        } else {
          chrome.tabs.sendMessage(sender.tab.id, {
            type: "SHOW_DIFF",
            originalText: selectionText,
            proposedText: responseText || ""
          }).catch(err => console.warn("SHOW_DIFF sendMessage failed:", err));
        }
      }).catch(err => console.error("runGeminiAI execution failed:", err));
    }
  } 
  
  else if (request.type === "RUN_CUSTOM_PROMPT_API") {
    const instruction = request.instruction;
    const selectionText = request.selectionText;
    const fullContext = request.fullContext;
    
    const promptInstruction = `Modify the text based on this specific instruction: "${instruction}". Return ONLY the modified text with markdown intact. Do not add conversational explanations.`;
    
    runGeminiAI(promptInstruction, selectionText, fullContext).then(responseText => {
      chrome.tabs.sendMessage(sender.tab.id, {
        type: "SHOW_DIFF",
        originalText: selectionText,
        proposedText: responseText || ""
      }).catch(err => console.warn("SHOW_DIFF custom sendMessage failed:", err));
    }).catch(err => console.error("runGeminiAI custom execution failed:", err));
  }
  
  else if (request.type === "FETCH_SETTINGS_FOR_PAGE") {
    chrome.storage.local.get(["apiKey", "aiModel"]).then(settings => {
      sendResponse(settings);
    });
    return true; // Keep message channel open for async response
  }
});

// Gemini API Caller with Fallback Router and Context Awareness
async function runGeminiAI(promptInstruction, textContent, fullContext = "") {
  // Retrieve settings
  const settings = await chrome.storage.local.get(["apiKey", "aiModel"]);
  let apiKey = settings.apiKey;
  let aiModel = settings.aiModel || "gemini-3.6-flash";
  if (aiModel === "gemini-1.5-flash" || aiModel === "gemini-2.5-flash" || aiModel === "gemini-3.5-flash") {
    aiModel = "gemini-3.6-flash";
  }

  // Fallback to the default key if not configured in the extension
  if (!apiKey) {
    apiKey = "";
  }

  let prompt = "";
  if (fullContext && fullContext.trim() && textContent && textContent.trim()) {
    prompt = `You are a professional writing assistant. You are helping the user edit a document.
Here is the FULL surrounding document context for style, tone, and reference:
"""
${fullContext}
"""

Here is the SPECIFIC section of text that the user wants you to modify:
"""
${textContent}
"""

Instruction: ${promptInstruction}

Requirements:
1. ONLY modify the SPECIFIC section of text requested. Do not change the surrounding document.
2. The revised section MUST blend in seamlessly with the surrounding document context. Match its exact tone, style, level of detail, vocabulary, and formatting.
3. Return ONLY the modified section of text. Do not wrap the output in quotes. Do not add any introductory, transition, or explanatory remarks (e.g., do not say "Here is the revised text:").`;
  } else {
    prompt = `You are a writing assistant. ${promptInstruction}\n\nTarget Text:\n"""\n${textContent}\n"""`;
  }

  // Valid active Gemini models in order of priority
  let modelsToTry = [
    aiModel,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.5-pro",
    "gemini-1.5-pro",
    "gemini-pro"
  ].filter(Boolean);
  modelsToTry = [...new Set(modelsToTry)];

  let lastError = null;

  function parseRetrySeconds(msg) {
    const match = (msg || '').match(/retry in ([\d\.]+)\s*s/i);
    if (match && match[1]) {
      const secs = parseFloat(match[1]);
      if (!isNaN(secs) && secs > 0 && secs <= 30) return Math.ceil(secs);
    }
    return null;
  }

  for (const model of modelsToTry) {
    const apiVersions = ["v1beta", "v1"];
    for (const apiVer of apiVersions) {
      const endpoint = `https://generativelanguage.googleapis.com/${apiVer}/models/${model}:generateContent?key=${apiKey}`;
      
      const MAX_RETRIES = 3;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: prompt }]
              }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 2048
              }
            })
          });

          if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            const errMsg = err.error?.message || `HTTP ${response.status}: ${response.statusText}`;

            if (response.status === 404 || errMsg.toLowerCase().includes("not found")) {
              break;
            }

            const isRateLimit = response.status === 429 || 
              errMsg.toLowerCase().includes("quota exceeded") ||
              errMsg.toLowerCase().includes("rate") ||
              errMsg.toLowerCase().includes("limit");

            const isServerOverload = response.status === 503 || 
              errMsg.toLowerCase().includes("high demand") || 
              errMsg.toLowerCase().includes("temporary") || 
              errMsg.toLowerCase().includes("overloaded");

            if ((isRateLimit || isServerOverload) && attempt < MAX_RETRIES - 1) {
              const parsedWait = parseRetrySeconds(errMsg);
              const waitSecs = parsedWait ? Math.min(parsedWait, 10) : Math.pow(2, attempt + 1);
              console.warn(`[ZenWrite Extension] Busy/Rate-limited on ${model}. Retrying in ${waitSecs}s (Attempt ${attempt + 1}/${MAX_RETRIES})...`);
              await new Promise(res => setTimeout(res, waitSecs * 1000));
              continue;
            }

            if (isRateLimit || isServerOverload) {
              throw new Error(`CONGESTION:${errMsg}`);
            }
            throw new Error(errMsg);
          }

          const data = await response.json();
          const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!responseText) throw new Error("Empty response from AI model.");
          
          return responseText.trim();
        } catch (err) {
          lastError = err;
          if (err.message.startsWith("CONGESTION:")) {
            break;
          }
        }
      }
    }
  }

  const finalErrMsg = lastError ? lastError.message.replace(/^CONGESTION:/, "") : "Unknown connection error";
  return `AI Generation Error: ${finalErrMsg}`;
}
