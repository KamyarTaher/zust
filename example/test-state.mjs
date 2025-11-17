import { store } from './lib/store.ts';

const state = store.getState();
console.log('State structure:', Object.keys(state));
console.log('User:', state.user);
console.log('Cart:', state.cart);
console.log('Cart is array?', Array.isArray(state.cart));
