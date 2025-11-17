/**
 * Regression tests for parsePath cache mutation bug
 *
 * Bug: parsePath cached results were being mutated by setNestedValue and deleteNestedValue
 * using .pop() which modified the cached array.
 *
 * This caused useSelectors to return incorrect keys after setDeep calls.
 */

import { render, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { createStore } from "../src/index";
import { expect, test, describe } from "@jest/globals";
import React from "react";

describe("Path Cache Mutation Regression Tests", () => {
  test("useSelectors returns correct keys after setDeep", () => {
    const { useSelectors, setDeep } = createStore({
      user: { name: "John Doe", email: "john@example.com", age: 30 },
    });

    let result: { name?: string; email?: string; age?: number } = {};

    function TestComponent() {
      result = useSelectors("user.name", "user.email", "user.age") as {
        name: string;
        email: string;
        age: number;
      };
      return <div>{result.name}</div>;
    }

    const { rerender } = render(<TestComponent />);

    // Initial render should have correct keys
    expect(result).toEqual({
      name: "John Doe",
      email: "john@example.com",
      age: 30,
    });
    expect(Object.keys(result)).toEqual(["name", "email", "age"]);

    // Update one nested field
    act(() => {
      setDeep("user.name", "Jane Doe");
    });

    rerender(<TestComponent />);

    // After setDeep, keys should still be correct (not 'user')
    expect(result).toEqual({
      name: "Jane Doe",
      email: "john@example.com",
      age: 30,
    });
    expect(Object.keys(result)).toEqual(["name", "email", "age"]);

    // Critically: key should be "name", not "user"
    expect(result.name).toBe("Jane Doe");
    expect(result).not.toHaveProperty("user");
  });

  test("multiple setDeep calls don't corrupt path cache", () => {
    const { useSelectors, setDeep } = createStore({
      user: { name: "John", email: "john@example.com", age: 30 },
    });

    let result: { name?: string; email?: string; age?: number } = {};

    function TestComponent() {
      result = useSelectors("user.name", "user.email", "user.age") as {
        name: string;
        email: string;
        age: number;
      };
      return null;
    }

    const { rerender } = render(<TestComponent />);

    // Initial state
    expect(result).toEqual({
      name: "John",
      email: "john@example.com",
      age: 30,
    });

    // Multiple updates to same paths
    act(() => {
      setDeep("user.name", "Jane");
    });
    rerender(<TestComponent />);

    expect(result.name).toBe("Jane");
    expect(Object.keys(result)).toEqual(["name", "email", "age"]);

    act(() => {
      setDeep("user.email", "jane@example.com");
    });
    rerender(<TestComponent />);

    expect(result.email).toBe("jane@example.com");
    expect(Object.keys(result)).toEqual(["name", "email", "age"]);

    act(() => {
      setDeep("user.age", 31);
    });
    rerender(<TestComponent />);

    expect(result.age).toBe(31);
    expect(Object.keys(result)).toEqual(["name", "email", "age"]);

    // Final check: all values should be updated correctly
    expect(result).toEqual({
      name: "Jane",
      email: "jane@example.com",
      age: 31,
    });
  });

  test("deeply nested paths maintain correct keys after setDeep", () => {
    const { useSelectors, setDeep } = createStore({
      data: {
        user: {
          profile: {
            personal: {
              firstName: "John",
              lastName: "Doe",
            },
          },
        },
      },
    });

    let result: { firstName?: string; lastName?: string } = {};

    function TestComponent() {
      result = useSelectors(
        "data.user.profile.personal.firstName",
        "data.user.profile.personal.lastName"
      ) as { firstName: string; lastName: string };
      return null;
    }

    const { rerender } = render(<TestComponent />);

    expect(result).toEqual({
      firstName: "John",
      lastName: "Doe",
    });

    act(() => {
      setDeep("data.user.profile.personal.firstName", "Jane");
    });
    rerender(<TestComponent />);

    // Key should be "firstName", not any intermediate path segment
    expect(result).toEqual({
      firstName: "Jane",
      lastName: "Doe",
    });
    expect(Object.keys(result)).toEqual(["firstName", "lastName"]);
  });

  test("parsePath cache returns copies, not references", () => {
    const { setDeep, getState } = createStore({
      user: { name: "John", age: 30 },
    });

    // Trigger parsePath caching
    setDeep("user.name", "Jane");
    expect(getState().user.name).toBe("Jane");

    // If cache is properly copying, this should work correctly
    setDeep("user.age", 31);
    expect(getState().user.age).toBe(31);

    // Both updates should have worked
    expect(getState().user).toEqual({ name: "Jane", age: 31 });
  });
});
