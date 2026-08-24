// Polyfilled at runtime by `react-native-get-random-values` (see index.js).
declare const crypto: {
  getRandomValues<T extends ArrayBufferView | null>(array: T): T;
};
