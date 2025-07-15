/// <reference types="vite/client" />

declare global {
  interface Element {
    _reactRoot?: import("react-dom/client").Root;
  }
}
