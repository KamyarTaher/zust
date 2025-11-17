/**
 * Array Path Support Tests
 * Testing the new killer feature - array index paths
 */

import { expect, test, describe } from "@jest/globals";
import { createStore } from "../src/index";

describe("Array Path Support", () => {
  test("sets array element by index", () => {
    const { getState, setDeep } = createStore({
      todos: [
        { id: 1, text: "Buy milk", done: false },
        { id: 2, text: "Walk dog", done: false },
      ],
    });

    setDeep("todos.0.done", true);

    expect(getState().todos[0]?.done).toBe(true);
    expect(getState().todos[1]?.done).toBe(false);
  });

  test("gets array element by index", () => {
    const { getState } = createStore({
      users: [
        { name: "Alice", age: 25 },
        { name: "Bob", age: 30 },
      ],
    });

    expect(getState().users[0]?.name).toBe("Alice");
    expect(getState().users[1]?.age).toBe(30);
  });

  test("handles nested array paths", () => {
    const { getState, setDeep } = createStore({
      teams: [
        { name: "Team A", members: [{ name: "Alice" }, { name: "Bob" }] },
        { name: "Team B", members: [{ name: "Charlie" }] },
      ],
    });

    setDeep("teams.0.members.1.name", "Bobby");

    expect(getState().teams[0]?.members[1]?.name).toBe("Bobby");
  });

  test("updates multiple array elements", () => {
    const { getState, setDeep } = createStore({
      items: [{ value: 1 }, { value: 2 }, { value: 3 }],
    });

    setDeep("items.0.value", 10);
    setDeep("items.2.value", 30);

    expect(getState().items[0]?.value).toBe(10);
    expect(getState().items[1]?.value).toBe(2);
    expect(getState().items[2]?.value).toBe(30);
  });

  test("handles array of primitives", () => {
    const { getState, setDeep } = createStore({
      numbers: [1, 2, 3, 4, 5],
    });

    setDeep("numbers.2", 99);

    expect(getState().numbers[2]).toBe(99);
  });

  test("extends array when setting beyond length", () => {
    const { getState, setDeep } = createStore({
      items: [{ value: 1 }],
    });

    setDeep("items.3.value", 4);

    const items = getState().items;
    expect(items.length).toBeGreaterThanOrEqual(4);
    expect(items[3]?.value).toBe(4);
  });

  test("handles mixed object and array paths", () => {
    const { getState, setDeep } = createStore({
      data: {
        users: [
          { name: "Alice", posts: [{ title: "Hello" }] },
        ],
      },
    });

    setDeep("data.users.0.posts.0.title", "Hi there!");

    expect(getState().data.users[0]?.posts[0]?.title).toBe("Hi there!");
  });

  test("array path with function updater", () => {
    const { getState, setDeep } = createStore({
      scores: [10, 20, 30],
    });

    setDeep("scores.1", (prev: number) => prev + 5);

    expect(getState().scores[1]).toBe(25);
  });
});
