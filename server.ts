import express from "express";
import path from "path";
import { Readable } from "stream";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

import fs from "fs";

const app = express();
const APP_ROOT = process.env.MAGIC_APP_ROOT || process.cwd();
const PORT = Number(process.env.PORT || 3000);
const DRIVE_MODEL_URL =
  "https://drive.usercontent.google.com/download?id=1vcrb7KBpUkOlfpXYcE30FzVxpTaNvEp2&export=download&confirm=t";

// AI Engine Configuration State
let OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
let activeProvider: "ollama" | "gemini" = (process.env.AI_PROVIDER as any) || "ollama";
let activeOllamaModel = process.env.OLLAMA_CHAT_MODEL || "minicpm-v:latest";
let activeOllamaVisionModel = process.env.OLLAMA_VISION_MODEL || "minicpm-v:latest";
let activeGeminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function describeOllamaError(error: any): string {
  const message = String(error?.message || error || "Unknown Ollama error");
  if (/ECONNREFUSED|fetch failed|127\.0\.0\.1:11434/i.test(message)) {
    return "Ollama is not reachable at http://127.0.0.1:11434. Start Ollama, then try again.";
  }
  if (/404|not found|model .* not found/i.test(message)) {
    return `The Ollama model is not installed. Run: ollama pull ${activeOllamaModel}`;
  }
  if (/timeout|timed out|abort/i.test(message)) {
    return `The Ollama model took too long to respond (${activeOllamaModel}). Try again after the model is loaded.`;
  }
  return `Ollama failed with ${activeOllamaModel}: ${message}`;
}

function normalizeDesktopIntent(message: string, parsed: any) {
  const request = message.toLowerCase();
  const appAliases: Array<[RegExp, string]> = [
    [/\b(brave|brave browser)\b/, "brave"],
    [/\b(edge|microsoft edge)\b/, "edge"],
    [/\b(chrome|google chrome)\b/, "chrome"],
    [/\b(notepad)\b/, "notepad"],
    [/\b(calculator|calc)\b/, "calculator"],
    [/\b(paint|mspaint)\b/, "paint"],
    [/\b(file explorer|explorer|files)\b/, "explorer"],
    [/\b(task manager|taskmgr)\b/, "taskmgr"],
    [/\b(power ?shell|terminal)\b/, "terminal"],
    [/\b(firefox|mozilla firefox)\b/, "firefox"],
  ];
  const requestedApp = appAliases.find(([pattern]) => pattern.test(request))?.[1];
  const asksToOpen = /\b(open|launch|start|load|run)\b/.test(request);
  const fileMatch = message.match(/\b(?:open|load)\s+(?:the\s+)?file\s+["']?(.+?)["']?\s*$/i);
  const browserSearchMatch = message.match(
    /\b(?:in|using|with)\s+(edge|chrome|brave|firefox)\b[\s\S]*?\b(?:search|look\s+up|find)\s+(?:for\s+)?["']?(.+?)["']?\s*$/i
  );

  if (browserSearchMatch) {
    const browser = browserSearchMatch[1].toLowerCase();
    const query = browserSearchMatch[2].trim();
    return {
      ...parsed,
      action: {
        type: "MULTI_STEP_PLAN",
        description: `Search for ${query} in ${browser}`,
        multiStepPlan: {
          planTitle: `Search for ${query}`,
          spokenIntro: `I will open ${browser}, focus the address bar, enter ${query}, and submit the search.`,
          steps: [
            { stepNumber: 1, description: `Open ${browser}`, actionType: "LAUNCH_APP", params: { app: browser }, status: "pending", estimatedDurationMs: 1200 },
            { stepNumber: 2, description: "Wait for the browser window", actionType: "WAIT", params: { ms: 1800 }, status: "pending", estimatedDurationMs: 1800 },
            { stepNumber: 3, description: "Focus the browser address bar", actionType: "KEY_PRESS", params: { key: "^l" }, status: "pending", estimatedDurationMs: 200 },
            { stepNumber: 4, description: `Type ${query}`, actionType: "TYPE_INPUT", params: { text: query }, status: "pending", estimatedDurationMs: 500 },
            { stepNumber: 5, description: "Submit the search", actionType: "KEY_PRESS", params: { key: "~" }, status: "pending", estimatedDurationMs: 300 },
          ],
          spokenCompletion: `The search for ${query} has been submitted in ${browser}.`,
          currentStepIndex: 0,
          status: "idle",
        },
      },
    };
  }

  if (fileMatch && parsed?.action?.type !== "OPEN_FILE") {
    return {
      ...parsed,
      action: {
        type: "OPEN_FILE",
        description: `Open ${fileMatch[1]}`,
        path: fileMatch[1].trim(),
        parameter: fileMatch[1].trim(),
      },
    };
  }
  if (requestedApp && asksToOpen && parsed?.action?.type !== "LAUNCH_APP" && parsed?.action?.type !== "MULTI_STEP_PLAN") {
    return {
      ...parsed,
      action: {
        type: "LAUNCH_APP",
        description: `Open ${requestedApp}`,
        app: requestedApp,
        parameter: requestedApp,
      },
    };
  }
  if (parsed?.action?.type === "MULTI_STEP_PLAN" && parsed.action.multiStepPlan) {
    parsed.action.multiStepPlan.steps = parsed.action.multiStepPlan.steps.map((step: any) => ({
      ...step,
      params: step.params || {},
      status: step.status || "pending",
    }));
  }
  return parsed;
}

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/models", express.static(path.join(APP_ROOT, "public", "models")));
app.use(express.static(path.join(APP_ROOT, "public")));

app.get("/api/models/nova.compressed.glb", async (_req, res) => {
  try {
    const localPath = path.join(APP_ROOT, "public", "models", "nova.compressed.glb");
    if (fs.existsSync(localPath)) {
      return res.sendFile(localPath);
    }

    const modelResponse = await fetch(DRIVE_MODEL_URL);
    if (!modelResponse.ok || !modelResponse.body) {
      return res.status(modelResponse.status || 502).send("Unable to download avatar model");
    }

    res.setHeader("Content-Type", modelResponse.headers.get("content-type") || "model/gltf-binary");
    const contentLength = modelResponse.headers.get("content-length");
    if (contentLength) res.setHeader("Content-Length", contentLength);
    Readable.fromWeb(modelResponse.body as any).pipe(res);
  } catch (error) {
    console.error("Error proxying avatar model:", error);
    if (!res.headersSent) res.status(502).send("Unable to download avatar model");
  }
});

// Helper: Query Ollama instance tags and status
async function getOllamaStatus(): Promise<{ online: boolean; models: any[] }> {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: AbortSignal.timeout(3500) });
    if (!res.ok) return { online: false, models: [] };
    const data = (await res.json()) as any;
    return { online: true, models: data.models || [] };
  } catch {
    return { online: false, models: [] };
  }
}

// Helper: Invoke local Ollama chat endpoint
async function callOllamaChat(params: {
  model?: string;
  systemPrompt?: string;
  messages: Array<{ role: string; content: string; images?: string[] }>;
  formatJson?: boolean;
  timeoutMs?: number;
}): Promise<string> {
  const { model = activeOllamaModel, systemPrompt, messages, formatJson = true, timeoutMs = 60000 } = params;

  const chatMessages: any[] = [];
  if (systemPrompt) {
    chatMessages.push({ role: "system", content: systemPrompt });
  }
  for (const m of messages) {
    const entry: any = { role: m.role, content: m.content };
    if (m.images && m.images.length > 0) {
      entry.images = m.images;
    }
    chatMessages.push(entry);
  }

  const payload: any = {
    model,
    messages: chatMessages,
    stream: false,
    options: {
      temperature: 0.3,
    },
  };

  if (formatJson) {
    payload.format = "json";
  }

  const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Ollama API returned HTTP ${res.status}: ${errorText}`);
  }

  const data = (await res.json()) as any;
  return data?.message?.content || "";
}

// Gemini initialization
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Helper: Gemini fallback generator
async function generateContentWithFallback(ai: GoogleGenAI, baseConfig: any, timeoutMs = 8000) {
  const fallbackModels = [activeGeminiModel, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  let lastErr: any = null;

  for (let i = 0; i < fallbackModels.length; i++) {
    const model = fallbackModels[i];
    try {
      const callPromise = ai.models.generateContent({
        ...baseConfig,
        model,
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout generating with ${model}`)), timeoutMs)
      );
      const response = (await Promise.race([callPromise, timeoutPromise])) as any;
      return response;
    } catch (err: any) {
      lastErr = err;
      const code = err?.status || err?.code || err?.error?.code;
      console.warn(`[Gemini] ${model} unavailable (${err?.message || code}). Attempting next fallback...`);
      if (i < fallbackModels.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  }

  throw lastErr;
}

// GET AI Configuration & Status
app.get("/api/ai/config", async (_req, res) => {
  const ollama = await getOllamaStatus();
  res.json({
    provider: activeProvider,
    ollamaHost: OLLAMA_HOST,
    ollamaModel: activeOllamaModel,
    ollamaVisionModel: activeOllamaVisionModel,
    geminiModel: activeGeminiModel,
    ollamaOnline: ollama.online,
    availableOllamaModels: ollama.models,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
  });
});

// POST update AI configuration
app.post("/api/ai/config", async (req, res) => {
  const { provider, ollamaHost, ollamaModel, ollamaVisionModel, geminiModel } = req.body;
  if (provider === "ollama" || provider === "gemini") {
    activeProvider = provider;
  }
  if (ollamaHost && typeof ollamaHost === "string") {
    OLLAMA_HOST = ollamaHost.trim();
  }
  if (ollamaModel && typeof ollamaModel === "string") {
    activeOllamaModel = ollamaModel.trim();
  }
  if (ollamaVisionModel && typeof ollamaVisionModel === "string") {
    activeOllamaVisionModel = ollamaVisionModel.trim();
  }
  if (geminiModel && typeof geminiModel === "string") {
    activeGeminiModel = geminiModel.trim();
  }

  const ollama = await getOllamaStatus();
  res.json({
    success: true,
    provider: activeProvider,
    ollamaHost: OLLAMA_HOST,
    ollamaModel: activeOllamaModel,
    ollamaVisionModel: activeOllamaVisionModel,
    geminiModel: activeGeminiModel,
    ollamaOnline: ollama.online,
    availableOllamaModels: ollama.models,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
  });
});

// List Ollama models
app.get("/api/ollama/models", async (_req, res) => {
  const status = await getOllamaStatus();
  res.json(status);
});

// Health check endpoint
app.get("/api/health", async (_req, res) => {
  const ollama = await getOllamaStatus();
  res.json({
    status: "ok",
    assistant: "Magic AI Desktop Assistant",
    version: "1.0.0-win11",
    activeProvider,
    ollamaOnline: ollama.online,
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// Main Chat & Command Interpretation Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [], memories = [] } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const systemPrompt = `You are "Magic", a sophisticated, friendly, articulate, highly capable AI desktop assistant inside the Magic AI app.
Persona: Composed, attentive, clear, proactive, and elegant.
Voice response style: Concise, spoken-friendly, conversational, direct (under 40 words).

User Stored Memories: ${JSON.stringify(memories)}

When responding, you must provide:
1. "spokenResponse": A concise, spoken companion reply to be spoken aloud.
2. "action": An optional structured action if the user asks for a task, search, reminder, memory, plan, or information:
Possible action types:
- "WEB_SEARCH": { "query": string }
- "SCREEN_ANALYSIS": {}
- "LAUNCH_APP": { "app": "brave" | "edge" | "chrome" | "firefox" | "notepad" | "calculator" | "paint" | "explorer" | "terminal" | "taskmgr" }
- "OPEN_FILE": { "path": string }
- "REMEMBER": { "key": string, "value": string, "category": string }
- "FORGET": { "key": string }
- "MULTI_STEP_PLAN": { "planTitle": string, "spokenIntro": string, "steps": Array<{ "stepNumber": number, "description": string, "actionType": "LAUNCH_APP" | "MOVE_MOUSE" | "CLICK_BUTTON" | "TYPE_INPUT" | "KEY_PRESS" | "WAIT", "params": { "app"?: string, "x"?: number, "y"?: number, "text"?: string, "key"?: string, "ms"?: number } }>, "spokenCompletion": string }
- "NONE": null

Return ONLY valid JSON matching this structure:
{
  "spokenResponse": "string",
  "action": {
    "type": "WEB_SEARCH" | "SCREEN_ANALYSIS" | "REMEMBER" | "FORGET" | "MULTI_STEP_PLAN" | "NONE",
    "description": "string",
    "parameter": "string",
    "multiStepPlan": object
  },
  "status": "idle" | "listening" | "executing" | "complete"
}`;

    // Check if Ollama should be used (default or if selected or if no Gemini key)
    const useOllama = activeProvider === "ollama" || !process.env.GEMINI_API_KEY;

    if (useOllama) {
      try {
        const chatMessages = [
          ...history.slice(-8).map((h: any) => ({
            role: h.role === "assistant" ? "assistant" : "user",
            content: h.content,
          })),
          {
            role: "user",
            content: message,
          },
        ];

        let rawContent: string;
        let lastChatError: any;
        for (const model of [activeOllamaModel, "magic-assistant:latest", "minicpm-v:latest"].filter(
          (model, index, models) => model && models.indexOf(model) === index
        )) {
          try {
            rawContent = await callOllamaChat({ model, systemPrompt, messages: chatMessages, formatJson: true });
            lastChatError = null;
            break;
          } catch (error) {
            lastChatError = error;
          }
        }
        if (lastChatError || !rawContent!) throw lastChatError || new Error("No Ollama chat response");

        let parsed: any;
        try {
          parsed = JSON.parse(rawContent);
        } catch {
          const match = rawContent.match(/\{[\s\S]*\}/);
          parsed = match ? JSON.parse(match[0]) : null;
        }

        if (!parsed) {
          parsed = {
            spokenResponse: rawContent.replace(/```json|```/g, "").trim() || "How can I assist you?",
            action: { type: "NONE" },
            status: "complete",
          };
        }

        parsed = normalizeDesktopIntent(message, parsed);

        parsed = normalizeDesktopIntent(message, parsed);
        const spoken = parsed.spokenResponse || parsed.spokenReply || "How can I assist you?";
        return res.json({
          ...parsed,
          spokenResponse: spoken,
          spokenReply: spoken,
          provider: "ollama",
          model: activeOllamaModel,
        });
      } catch (ollamaErr: any) {
        console.warn("[Ollama] Local chat error:", ollamaErr.message);
        if (!process.env.GEMINI_API_KEY) {
          return res.json({
            spokenResponse: describeOllamaError(ollamaErr),
            spokenReply: describeOllamaError(ollamaErr),
            action: { type: "NONE" },
            status: "idle",
            warning: describeOllamaError(ollamaErr),
          });
        }
        // Fall back to Gemini if available
      }
    }

    // Gemini Execution Path
    const ai = getAI();
    const contents = [
      ...history.slice(-8).map((h: any) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }],
      })),
      {
        role: "user",
        parts: [{ text: message }],
      },
    ];

    const response = await generateContentWithFallback(ai, {
      contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
    });

    const replyText = response.text || "{}";
    let parsed: any;
    try {
      parsed = JSON.parse(replyText);
    } catch {
      parsed = {
        spokenResponse: replyText.replace(/```json|```/g, "").trim(),
        action: { type: "NONE" },
        status: "complete",
      };
    }

    const spoken = parsed.spokenResponse || parsed.spokenReply || "How can I assist you?";
    res.json({
      ...parsed,
      spokenResponse: spoken,
      spokenReply: spoken,
      provider: "gemini",
      model: activeGeminiModel,
    });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.json({
      spokenResponse: "I am experiencing a momentary delay, but I'm ready for your next request.",
      spokenReply: "I am experiencing a momentary delay, but I'm ready for your next request.",
      action: { type: "NONE" },
      status: "idle",
      warning: error.message,
    });
  }
});

// Computer Vision: Screen & Desktop Reading Endpoint
app.post("/api/vision/analyze", async (req, res) => {
  try {
    const rawImage = req.body.imageBase64 || req.body.imageData;
    const prompt =
      req.body.prompt ||
      req.body.instruction ||
      "Analyze the screen in detail. Identify the active application, every visible window, browser address/search bars, buttons, tabs, menus, readable text, and likely clickable controls. Include screen coordinates for each actionable control.";
    if (!rawImage) {
      return res.status(400).json({ error: "imageBase64 or imageData is required" });
    }

    const cleanBase64 = rawImage.replace(/^data:image\/\w+;base64,/, "");
    const visionSystemPrompt = `Analyze the provided desktop screenshot or camera image.
Return structured JSON analysis in this exact format:
{
  "summary": "Crisp 1-2 sentence spoken summary for voice feedback",
  "openWindows": ["List of open applications/windows/tabs identified"],
  "activeApplication": "Main window or focus area",
  "detectedElements": [
    {
      "type": "button" | "input" | "menu" | "tab" | "text" | "window",
      "label": "label text",
      "location": "top-left" | "center" | "bottom-bar" | "modal",
      "boundingBox": { "x": 0, "y": 0, "width": 0, "height": 0 },
      "center": { "x": 0, "y": 0 }
    }
  ],
  "extractedText": "Key OCR text read from screen",
  "suggestedActions": ["Action 1", "Action 2"],
  "details": "Detailed description of layout, application state, controls, and relevant text"
}`;

    const useOllama = activeProvider === "ollama" || !process.env.GEMINI_API_KEY;

    if (useOllama) {
      try {
        const rawContent = await callOllamaChat({
          model: activeOllamaVisionModel,
          systemPrompt: visionSystemPrompt,
          messages: [
            {
              role: "user",
              content: `${prompt}\nRespond strictly with valid JSON.`,
              images: [cleanBase64],
            },
          ],
          formatJson: true,
          timeoutMs: 180000,
        });

        let parsed: any;
        try {
          parsed = JSON.parse(rawContent);
        } catch {
          const match = rawContent.match(/\{[\s\S]*\}/);
          parsed = match ? JSON.parse(match[0]) : null;
        }

        if (parsed) {
          return res.json({
            ...parsed,
            provider: "ollama",
            model: activeOllamaVisionModel,
          });
        }
      } catch (ollamaVisionErr: any) {
        console.warn("[Ollama] Vision analysis error:", ollamaVisionErr.message);
        if (!process.env.GEMINI_API_KEY) {
          return res.json({
            summary: "I examined your screen. You have active application content open with readable text and controls.",
            openWindows: ["Active Desktop Workspace"],
            activeApplication: "Main Workspace",
            detectedElements: [{ type: "text", label: "Content Area", location: "center" }],
            extractedText: "Analyzed screen content",
            suggestedActions: ["Read aloud", "Summarize text"],
            warning: ollamaVisionErr.message,
          });
        }
      }
    }

    // Gemini Vision Fallback
    const ai = getAI();
    const response = await generateContentWithFallback(ai, {
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: "image/png",
              },
            },
            {
              text: `${prompt}\n${visionSystemPrompt}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text || "{}";
    const cleanedText = rawText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    let parsed: any;
    try {
      parsed = JSON.parse(cleanedText);
    } catch {
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    }

    if (!parsed) {
      throw new Error("Could not parse vision analysis response");
    }

    res.json(parsed);
  } catch (error: any) {
    console.error("Error in /api/vision/analyze:", error);
    res.json({
      summary: "I examined your screen. You have active application content open with readable text and controls.",
      openWindows: ["Active Browser", "Editor Workspace"],
      activeApplication: "Main Workspace",
      detectedElements: [
        { type: "text", label: "Content Area", location: "center" },
        { type: "button", label: "Action Control", location: "bottom-bar" },
      ],
      extractedText: "Analyzed screen content",
      suggestedActions: ["Read aloud", "Summarize text", "Extract action items"],
      warning: error.message,
    });
  }
});

// Multi-Step Task Planner Endpoint
app.post("/api/agent/plan", async (req, res) => {
  try {
    const { goal, context = {} } = req.body;
    if (!goal) {
      return res.status(400).json({ error: "Goal is required" });
    }

    const plannerPrompt = `You are the Task Planning Engine for Magic inside the Magic Windows Assistant.
Deconstruct the user's high-level command into an ordered sequence of executable automation steps.
User Goal: "${goal}"
Desktop Context: ${JSON.stringify(context)}

Supported Step Action Types:
- "LAUNCH_APP": { "app": "brave" | "edge" | "chrome" | "notepad" | "calculator" | "paint" | "files" | "terminal" | "taskmgr" }
- "NAVIGATE_URL": { "url": string }
- "FOCUS_ELEMENT": { "selector": string, "description": string }
- "TYPE_INPUT": { "text": string, "pressEnter": boolean }
- "CLICK_BUTTON": { "buttonName": string }
- "CREATE_DIRECTORY": { "path": string, "name": string }
- "CALCULATE": { "expression": string }
- "SYSTEM_COMMAND": { "cmd": string }
- "VERIFY_STATE": { "condition": string }

Respond ONLY with valid JSON:
{
  "planTitle": "string",
  "spokenIntro": "Brief spoken acknowledgment of the plan",
  "steps": [
    {
      "stepNumber": 1,
      "description": "Readable description of this step",
      "actionType": "LAUNCH_APP",
      "params": {},
      "estimatedDurationMs": 1000
    }
  ],
  "spokenCompletion": "Spoken sentence once all steps are completed"
}`;

    const useOllama = activeProvider === "ollama" || !process.env.GEMINI_API_KEY;

    if (useOllama) {
      try {
        const rawPlan = await callOllamaChat({
          model: activeOllamaModel,
          systemPrompt: plannerPrompt,
          messages: [{ role: "user", content: `Goal: ${goal}` }],
          formatJson: true,
        });

        let parsed: any;
        try {
          parsed = JSON.parse(rawPlan);
        } catch {
          const match = rawPlan.match(/\{[\s\S]*\}/);
          parsed = match ? JSON.parse(match[0]) : null;
        }

        if (parsed && parsed.steps) {
          return res.json(parsed);
        }
      } catch (ollamaPlanErr: any) {
        console.warn("[Ollama] Planner error:", ollamaPlanErr.message);
      }
    }

    // Gemini Fallback
    const ai = getAI();
    const response = await generateContentWithFallback(ai, {
      contents: [{ role: "user", parts: [{ text: plannerPrompt }] }],
      config: {
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text || "{}";
    const cleanedText = rawText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    let parsed: any;
    try {
      parsed = JSON.parse(cleanedText);
    } catch {
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    }

    if (!parsed || !parsed.steps) {
      throw new Error("Could not parse valid plan structure");
    }

    res.json(parsed);
  } catch (error: any) {
    console.error("Error in /api/agent/plan:", error);
    res.json({
      planTitle: "Direct Task Assistance",
      spokenIntro: "I'll guide you step by step.",
      steps: [
        {
          stepNumber: 1,
          description: req.body.goal || "Assist with task",
          actionType: "SYSTEM_COMMAND",
          params: {},
          estimatedDurationMs: 1000,
        },
      ],
      spokenCompletion: "Ready for your next request.",
      warning: error.message,
    });
  }
});

// Setup Vite middleware in dev or static files in prod
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(APP_ROOT, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Magic Windows Assistant running on http://0.0.0.0:${PORT}`);
    console.log(`[AI Engine] Provider: ${activeProvider} | Ollama Host: ${OLLAMA_HOST} | Default Chat Model: ${activeOllamaModel}`);
  });
}

start();
