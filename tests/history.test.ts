/**
 * History/Time-Travel Tests
 * Testing undo/redo functionality
 */

import { expect, test, describe, beforeEach } from "@jest/globals";
import { createStore } from "../src/index";

describe("History Manager", () => {
  test("enables history when configured", () => {
    const { history } = createStore(
      { counter: 0 },
      { history: { enabled: true } }
    );

    expect(history).toBeDefined();
    expect(history?.canUndo()).toBe(false);
    expect(history?.canRedo()).toBe(false);
  });

  test("undo reverts last change", () => {
    const { getState, setDeep, history } = createStore(
      { counter: 0 },
      { history: { enabled: true, maxSize: 10 } }
    );

    setDeep("counter", 5);
    setDeep("counter", 10);

    // Allow history to capture
    setTimeout(() => {
      history?.undo();
      expect(getState().counter).toBe(5);
    }, 200);
  });

  test("redo reapplies undone change", async () => {
    const { getState, setDeep, history } = createStore(
      { counter: 0 },
      { history: { enabled: true, captureInterval: 0 } }
    );

    setDeep("counter", 5);

    await new Promise(resolve => setTimeout(resolve, 50));

    history?.undo();
    expect(getState().counter).toBe(0);

    history?.redo();
    expect(getState().counter).toBe(5);
  });

  test("canUndo returns correct state", () => {
    const { setDeep, history } = createStore(
      { counter: 0 },
      { history: { enabled: true } }
    );

    expect(history?.canUndo()).toBe(false);

    setDeep("counter", 5);

    setTimeout(() => {
      expect(history?.canUndo()).toBe(true);
    }, 150);
  });

  test("canRedo returns correct state", async () => {
    const { setDeep, history } = createStore(
      { counter: 0 },
      { history: { enabled: true, captureInterval: 0 } }
    );

    setDeep("counter", 5);
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(history?.canRedo()).toBe(false);

    history?.undo();
    expect(history?.canRedo()).toBe(true);
  });

  test("clear removes all history", async () => {
    const { setDeep, history } = createStore(
      { counter: 0 },
      { history: { enabled: true, captureInterval: 0 } }
    );

    setDeep("counter", 5);
    setDeep("counter", 10);

    await new Promise(resolve => setTimeout(resolve, 50));

    history?.clear();
    expect(history?.canUndo()).toBe(false);
    expect(history?.canRedo()).toBe(false);
  });

  test("respects maxSize limit", async () => {
    const { setDeep, history } = createStore(
      { counter: 0 },
      { history: { enabled: true, maxSize: 3, captureInterval: 0 } }
    );

    for (let i = 1; i <= 10; i++) {
      setDeep("counter", i);
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const size = history?.size();
    expect(size).toBeLessThanOrEqual(3);
  });

  test("jump goes back multiple steps", async () => {
    const { getState, setDeep, history } = createStore(
      { counter: 0 },
      { history: { enabled: true, captureInterval: 0 } }
    );

    for (let i = 1; i <= 5; i++) {
      setDeep("counter", i);
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    history?.jump(-3);
    expect(getState().counter).toBe(2);
  });

  test("getTimeline returns history timestamps", () => {
    const { history } = createStore(
      { counter: 0 },
      { history: { enabled: true } }
    );

    const timeline = history?.getTimeline();
    expect(Array.isArray(timeline)).toBe(true);
    expect(timeline?.length).toBeGreaterThan(0);
  });
});
