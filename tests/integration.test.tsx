// test/integration.test.ts
import { render, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { createStore } from "../src/index";
import React from "react";

describe("Zust Integration", () => {
  test("useSelectors hook selects correct values", () => {
    const initialState = {
      user: { name: "John", age: 30 },
      settings: { theme: "light" },
    };

    const { useSelectors } = createStore(initialState);

    let result: { name: string; theme: string } = { name: "", theme: "" };
    function TestComponent() {
      result = useSelectors("user.name", "settings.theme") as {
        name: string;
        theme: string;
      };
      return null;
    }

    render(<TestComponent />);

    // Validate results after component renders
    expect(result.name).toBe("John");
    expect(result.theme).toBe("light");
  });

  test("state updates trigger re-renders", () => {
    const { useSelectors, setDeep } = createStore({ counter: 0 });
    let renderCount = 0;
    function TestComponent() {
      const { counter } = useSelectors("counter");
      renderCount++;
      return <div data-testid="counter">{counter}</div>;
    }

    const { getByTestId, unmount } = render(<TestComponent />);

    // Check initial render count
    expect(renderCount).toBe(1);
    expect(getByTestId("counter")).toHaveTextContent("0");

    // Update state and flush updates
    act(() => {
      setDeep("counter", (prev) => prev + 1);
    });

    // Check updated render count
    expect(renderCount).toBe(2);
    expect(getByTestId("counter")).toHaveTextContent("1");

    // Cleanup
    unmount();
  });
});
