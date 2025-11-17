# Zust Example - Interactive Demo

This is a comprehensive Next.js application demonstrating all features of Zust state management library.

## Features Demonstrated

- ✅ **Basic State Management** - Nested state updates with dot notation
- ✅ **Array Paths** - Access and update array items with index notation
- ✅ **Time-Travel Debugging** - Undo/redo functionality with history
- ✅ **Computed Values** - Cached computed properties with dependency tracking
- ✅ **Async Dispatch** - First-class async/await support
- ✅ **Batched Updates** - Minimize re-renders with batch()
- ✅ **Path-Based Subscriptions** - Subscribe to specific state changes
- ✅ **Persistence** - State persists across page reloads
- ✅ **Theme Switching** - Light/dark mode toggle

## Quick Start

### Option 1: Using Bun (Recommended)

```bash
# Install dependencies
bun install

# Run development server
bun dev
```

### Option 2: Using npm

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### Option 3: Using yarn

```bash
# Install dependencies
yarn

# Run development server
yarn dev
```

## Open the App

Open [http://localhost:3000](http://localhost:3000) in your browser to see the interactive demo.

## What You'll See

The demo includes 6 interactive cards, each showcasing a different Zust feature:

1. **Basic State Management** - Text inputs demonstrating nested state updates
2. **Array Paths** - Todo list with array index access
3. **Time-Travel** - Counter with undo/redo buttons
4. **Computed Values** - Auto-calculated statistics
5. **Async Dispatch** - Fetch posts from API
6. **Shopping Cart** - Batch updates with real-time totals

## Code Structure

```
example/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main demo page
│   └── globals.css         # Styles
├── lib/
│   └── store.ts            # Zust store configuration
├── package.json
├── next.config.js
└── tsconfig.json
```

## Learn More

- **Zust Documentation**: See the main [README.md](../README.md)
- **Next.js Documentation**: [https://nextjs.org/docs](https://nextjs.org/docs)

## Customization

Feel free to modify `lib/store.ts` to add your own state and computed values. The example is designed to be educational and easy to understand.

## Tips

- Open DevTools to see state changes in real-time
- Try the undo/redo feature after making several changes
- Notice how computed values update automatically
- Test the persistence by refreshing the page
- Switch between light and dark themes

Enjoy exploring Zust! 🚀
