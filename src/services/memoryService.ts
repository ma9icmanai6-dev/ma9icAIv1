import { MemoryItem } from "../types";

const STORAGE_KEY = "magic_assistant_memories_v1";

const DEFAULT_MEMORIES: MemoryItem[] = [
  {
    id: "mem-1",
    type: "persistent",
    key: "preferred_voice",
    value: "British Female (Hazel / Victoria)",
    category: "preference",
    createdAt: new Date().toISOString(),
  },
  {
    id: "mem-2",
    type: "long_term",
    key: "favorite_browser",
    value: "Brave Browser with ad-shield enabled",
    category: "application",
    createdAt: new Date().toISOString(),
  },
  {
    id: "mem-3",
    type: "long_term",
    key: "roblox_workspace",
    value: "C:\\Users\\Developer\\RobloxProjects",
    category: "routine",
    createdAt: new Date().toISOString(),
  },
  {
    id: "mem-4",
    type: "long_term",
    key: "favorite_websites",
    value: "Google, YouTube, GitHub, Roblox DevForum",
    category: "website",
    createdAt: new Date().toISOString(),
  },
];

export class MemoryService {
  private static sessionMemories: MemoryItem[] = [];

  public static getMemories(): MemoryItem[] {
    let persistent: MemoryItem[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        persistent = JSON.parse(stored);
      } else {
        persistent = [...DEFAULT_MEMORIES];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(persistent));
      }
    } catch {
      persistent = [...DEFAULT_MEMORIES];
    }
    return [...persistent, ...this.sessionMemories];
  }

  public static addMemory(
    key: string,
    value: string,
    category: MemoryItem["category"] = "preference",
    type: MemoryItem["type"] = "long_term"
  ): MemoryItem {
    const newItem: MemoryItem = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      key,
      value,
      category,
      createdAt: new Date().toISOString(),
    };

    if (type === "session") {
      this.sessionMemories.push(newItem);
    } else {
      const existing = this.getPersistentMemories();
      const updated = [newItem, ...existing.filter((m) => m.key !== key)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    return newItem;
  }

  public static removeMemory(idOrKey: string): boolean {
    // Check session
    const sessionIdx = this.sessionMemories.findIndex(
      (m) => m.id === idOrKey || m.key.toLowerCase() === idOrKey.toLowerCase()
    );
    if (sessionIdx !== -1) {
      this.sessionMemories.splice(sessionIdx, 1);
      return true;
    }

    const existing = this.getPersistentMemories();
    const updated = existing.filter(
      (m) => m.id !== idOrKey && m.key.toLowerCase() !== idOrKey.toLowerCase()
    );
    if (updated.length !== existing.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return true;
    }
    return false;
  }

  public static clearSessionMemory() {
    this.sessionMemories = [];
  }

  public static clearAllMemories() {
    this.sessionMemories = [];
    localStorage.removeItem(STORAGE_KEY);
  }

  private static getPersistentMemories(): MemoryItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [...DEFAULT_MEMORIES];
    } catch {
      return [...DEFAULT_MEMORIES];
    }
  }
}
