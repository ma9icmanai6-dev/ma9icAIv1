import { AgentStep, MultiStepPlan, PermissionLevel } from "../types";

export interface AutomationCursorPos {
  x: number;
  y: number;
  isClicking: boolean;
  isRightClicking: boolean;
  isDragging: boolean;
  visible: boolean;
  targetLabel?: string;
}

export class AutomationEngine {
  private static isKilled: boolean = false;
  private static activePlan: MultiStepPlan | null = null;
  private static permissionLevel: PermissionLevel = "none";
  private static cursorState: AutomationCursorPos = {
    x: 400,
    y: 300,
    isClicking: false,
    isRightClicking: false,
    isDragging: false,
    visible: false,
  };

  private static cursorListeners: Array<(pos: AutomationCursorPos) => void> = [];

  public static onCursorUpdate(cb: (pos: AutomationCursorPos) => void) {
    this.cursorListeners.push(cb);
    return () => {
      this.cursorListeners = this.cursorListeners.filter((l) => l !== cb);
    };
  }

  private static notifyCursor() {
    this.cursorListeners.forEach((l) => l({ ...this.cursorState }));
  }

  public static setPermission(level: PermissionLevel) {
    this.permissionLevel = level;
    this.isKilled = false;
  }

  public static getPermission(): PermissionLevel {
    return this.permissionLevel;
  }

  public static isAutomationPermitted(): boolean {
    return (
      !this.isKilled &&
      (this.permissionLevel === "one_action" ||
        this.permissionLevel === "one_session" ||
        this.permissionLevel === "always")
    );
  }

  public static emergencyStop(): string {
    return this.triggerEmergencyKillSwitch();
  }

  public static isEmergencyStopped(): boolean {
    return this.isKilled;
  }

  public static async moveAndClick(
    targetX: number,
    targetY: number,
    right: boolean = false,
    label?: string
  ): Promise<boolean> {
    const moved = await this.moveMouseTo(targetX, targetY, 400, label);
    if (!moved) return false;
    return await this.click(false, right);
  }

  /**
   * Emergency Kill Switch (CTRL + ALT + ESC or UI button)
   * Instantly terminates all mouse, keyboard, and agent plan actions.
   */
  public static triggerEmergencyKillSwitch(): string {
    this.isKilled = true;
    this.cursorState.visible = false;
    this.cursorState.isClicking = false;
    this.cursorState.isDragging = false;
    this.notifyCursor();

    if (this.activePlan) {
      this.activePlan.status = "aborted";
    }

    if (this.permissionLevel === "one_action") {
      this.permissionLevel = "none";
    }

    return "EMERGENCY STOP ENGAGED: All automation halted immediately.";
  }

  public static resetKillSwitch() {
    this.isKilled = false;
  }

  /**
   * Smoothly animates simulated mouse pointer to target coordinate
   */
  public static async moveMouseTo(
    targetX: number,
    targetY: number,
    durationMs: number = 600,
    label?: string
  ): Promise<boolean> {
    if (this.isKilled) return false;

    this.cursorState.visible = true;
    this.cursorState.targetLabel = label;
    const startX = this.cursorState.x;
    const startY = this.cursorState.y;
    const startTime = performance.now();

    return new Promise((resolve) => {
      const step = (currentTime: number) => {
        if (this.isKilled) {
          this.cursorState.visible = false;
          this.notifyCursor();
          resolve(false);
          return;
        }

        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        // Ease out cubic
        const ease = 1 - Math.pow(1 - progress, 3);

        this.cursorState.x = startX + (targetX - startX) * ease;
        this.cursorState.y = startY + (targetY - startY) * ease;
        this.notifyCursor();

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve(true);
        }
      };

      requestAnimationFrame(step);
    });
  }

  /**
   * Simulates mouse click with visual feedback
   */
  public static async click(double: boolean = false, right: boolean = false): Promise<boolean> {
    if (this.isKilled) return false;

    if (right) {
      this.cursorState.isRightClicking = true;
    } else {
      this.cursorState.isClicking = true;
    }
    this.notifyCursor();

    await new Promise((r) => setTimeout(r, 120));
    this.cursorState.isClicking = false;
    this.cursorState.isRightClicking = false;
    this.notifyCursor();

    if (double && !this.isKilled) {
      await new Promise((r) => setTimeout(r, 80));
      this.cursorState.isClicking = true;
      this.notifyCursor();
      await new Promise((r) => setTimeout(r, 120));
      this.cursorState.isClicking = false;
      this.notifyCursor();
    }

    return !this.isKilled;
  }

  /**
   * Simulates keyboard typing with realistic delay
   */
  public static async typeText(
    text: string,
    onCharTyped?: (fullTextSoFar: string) => void,
    charDelayMs: number = 35
  ): Promise<boolean> {
    if (this.isKilled) return false;

    let accumulator = "";
    for (let i = 0; i < text.length; i++) {
      if (this.isKilled) return false;
      accumulator += text[i];
      onCharTyped?.(accumulator);
      await new Promise((r) => setTimeout(r, charDelayMs + Math.random() * 20));
    }
    return !this.isKilled;
  }

  /**
   * Executes a multi-step agent plan step-by-step
   */
  public static async executePlan(
    plan: MultiStepPlan,
    onStepUpdate: (plan: MultiStepPlan) => void,
    actionHandlers: Record<string, (params: any) => Promise<any>>
  ): Promise<boolean> {
    this.activePlan = plan;
    plan.status = "in_progress";
    this.isKilled = false;

    for (let i = 0; i < plan.steps.length; i++) {
      if (this.isKilled) {
        plan.status = "aborted";
        onStepUpdate({ ...plan });
        return false;
      }

      plan.currentStepIndex = i;
      const step = plan.steps[i];
      step.status = "running";
      onStepUpdate({ ...plan });

      const handler = actionHandlers[step.actionType];
      if (handler) {
        try {
          await handler(step.params);
          step.status = "completed";
        } catch (err) {
          console.error(`Step ${step.stepNumber} failed:`, err);
          step.status = "failed";
          plan.status = "aborted";
          onStepUpdate({ ...plan });
          return false;
        }
      } else {
        // Generic step simulation
        await new Promise((r) => setTimeout(r, step.estimatedDurationMs || 800));
        step.status = "completed";
      }

      onStepUpdate({ ...plan });
      await new Promise((r) => setTimeout(r, 300));
    }

    plan.status = "completed";
    this.cursorState.visible = false;
    this.notifyCursor();
    onStepUpdate({ ...plan });

    if (this.permissionLevel === "one_action") {
      this.permissionLevel = "none";
    }

    return true;
  }
}
