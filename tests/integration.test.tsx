import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { createStore } from "../src/index";
import React from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";

let dom: JSDOM;
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><div id="root"></div>');
  global.document = dom.window.document;
  global.window = dom.window as any;
  container = document.getElementById("root") as HTMLDivElement;
  root = createRoot(container);
});

afterEach(() => {
  if (root) {
    root.unmount();
  }
  dom.window.close();
});

describe("Zust Integration", () => {
  test("useSelectors hook selects correct values", async () => {
    const initialState = {
      user: { name: "John", age: 30 },
      settings: { theme: "light" as const },
    };

    const { useSelectors } = createStore(initialState);

    let result: any;
    function TestComponent() {
      // Immediately use selectors to capture result
      result = useSelectors("user.name", "settings.theme");
      return null;
    }

    await new Promise<void>((resolve) => {
      root.render(<TestComponent />);
      setTimeout(() => {
        // Wait for state and component to update
        resolve();
      }, 0);
    });

    // Validate results after component renders
    expect(result.name).toBe("John");
    expect(result.theme).toBe("light");
  });

  test("state updates trigger re-renders", async () => {
    const { useSelectors, setDeep } = createStore({ counter: 0 });

    let renderCount = 0;
    function TestComponent() {
      const { counter } = useSelectors("counter");
      renderCount++;
      return <div>{counter}</div>;
    }

    // Render component initially
    await new Promise<void>((resolve) => {
      root.render(<TestComponent />);
      setTimeout(() => {
        resolve();
      }, 0);
    });

    // Check initial render count
    expect(renderCount).toBe(1);

    // Update state and re-render
    await new Promise<void>((resolve) => {
      setDeep("counter", (prev) => prev + 1);
      setTimeout(() => {
        resolve();
      }, 0);
    });

    // Check updated render count
    expect(renderCount).toBe(2);
  });
});
