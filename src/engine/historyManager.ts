/**
 * History Manager - Time-travel debugging with undo/redo
 */

/**
 * History configuration options
 */
export interface HistoryConfig {
  /** Enable history tracking (default: false) */
  enabled?: boolean;
  /** Maximum number of history states to keep (default: 50) */
  maxSize?: number;
  /** Debounce interval in ms to prevent too frequent captures (default: 100) */
  captureInterval?: number;
}

/**
 * History state snapshot
 */
interface HistorySnapshot<T> {
  state: T;
  timestamp: number;
}

/**
 * History API exposed to users
 */
export interface HistoryAPI {
  /** Go back one step */
  undo: () => void;
  /** Go forward one step */
  redo: () => void;
  /** Jump to specific history index (negative goes back, positive goes forward) */
  jump: (steps: number) => void;
  /** Clear all history */
  clear: () => void;
  /** Get current history size */
  size: () => number;
  /** Check if undo is available */
  canUndo: () => boolean;
  /** Check if redo is available */
  canRedo: () => boolean;
  /** Get all history timestamps */
  getTimeline: () => number[];
}

/**
 * Internal history manager
 */
export class HistoryManager<T extends object> {
  private past: HistorySnapshot<T>[] = [];
  private future: HistorySnapshot<T>[] = [];
  private currentState: T;
  private config: Required<HistoryConfig>;
  private lastCaptureTime = 0;
  private pendingCapture: ReturnType<typeof setTimeout> | null = null;
  private isRestoring = false;

  constructor(
    initialState: T,
    private onRestore: (state: T) => void,
    config: HistoryConfig = {}
  ) {
    this.currentState = initialState;
    this.config = {
      enabled: config.enabled ?? false,
      maxSize: config.maxSize ?? 50,
      captureInterval: config.captureInterval ?? 100,
    };
  }

  /**
   * Capture current state into history (debounced)
   */
  capture(state: T): void {
    if (!this.config.enabled || this.isRestoring) {
      return;
    }

    const now = Date.now();

    // Debounce captures
    if (now - this.lastCaptureTime < this.config.captureInterval) {
      // Cancel pending capture and schedule new one
      if (this.pendingCapture) {
        clearTimeout(this.pendingCapture);
      }

      this.pendingCapture = setTimeout(() => {
        this.captureImmediate(state);
        this.pendingCapture = null;
      }, this.config.captureInterval);

      return;
    }

    this.captureImmediate(state);
  }

  /**
   * Immediately capture state without debouncing
   */
  private captureImmediate(state: T): void {
    try {
      // Deep clone the state to prevent mutations
      const snapshot: HistorySnapshot<T> = {
        state: JSON.parse(JSON.stringify(state)),
        timestamp: Date.now(),
      };

      // Add to history
      this.past.push({
        state: this.currentState,
        timestamp: this.lastCaptureTime,
      });

      // Limit history size (remove oldest)
      if (this.past.length > this.config.maxSize) {
        this.past.shift();
      }

      // Clear future (new history branch)
      this.future = [];

      this.currentState = snapshot.state;
      this.lastCaptureTime = snapshot.timestamp;
    } catch (error) {
      console.warn("[Zust History] Failed to capture state:", error);
    }
  }

  /**
   * Undo last change
   */
  undo(): void {
    if (!this.canUndo()) {
      console.warn("[Zust History] Cannot undo: no history available");
      return;
    }

    const snapshot = this.past.pop();
    if (!snapshot) {
      return;
    }
    this.future.unshift({
      state: this.currentState,
      timestamp: Date.now(),
    });

    this.restoreState(snapshot.state);
  }

  /**
   * Redo last undone change
   */
  redo(): void {
    if (!this.canRedo()) {
      console.warn("[Zust History] Cannot redo: no future available");
      return;
    }

    const snapshot = this.future.shift();
    if (!snapshot) {
      return;
    }
    this.past.push({
      state: this.currentState,
      timestamp: Date.now(),
    });

    this.restoreState(snapshot.state);
  }

  /**
   * Jump to relative history position
   */
  jump(steps: number): void {
    if (steps === 0) return;

    if (steps < 0) {
      // Go back
      const actualSteps = Math.min(Math.abs(steps), this.past.length);
      for (let i = 0; i < actualSteps; i++) {
        this.undo();
      }
    } else {
      // Go forward
      const actualSteps = Math.min(steps, this.future.length);
      for (let i = 0; i < actualSteps; i++) {
        this.redo();
      }
    }
  }

  /**
   * Restore a specific state
   */
  private restoreState(state: T): void {
    this.isRestoring = true;
    try {
      this.currentState = state;
      this.onRestore(state);
    } finally {
      this.isRestoring = false;
    }
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.past = [];
    this.future = [];
  }

  /**
   * Get current history size
   */
  size(): number {
    return this.past.length + this.future.length;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.past.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.future.length > 0;
  }

  /**
   * Get timeline of all history timestamps
   */
  getTimeline(): number[] {
    return [
      ...this.past.map((s) => s.timestamp),
      Date.now(),
      ...this.future.map((s) => s.timestamp),
    ];
  }

  /**
   * Create public API
   */
  getAPI(): HistoryAPI {
    return {
      undo: () => this.undo(),
      redo: () => this.redo(),
      jump: (steps) => this.jump(steps),
      clear: () => this.clear(),
      size: () => this.size(),
      canUndo: () => this.canUndo(),
      canRedo: () => this.canRedo(),
      getTimeline: () => this.getTimeline(),
    };
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.pendingCapture) {
      clearTimeout(this.pendingCapture);
      this.pendingCapture = null;
    }
    this.clear();
  }
}
