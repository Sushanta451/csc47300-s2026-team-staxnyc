// Minimal TSX support without installing React type packages.
// This project loads React via UMD scripts, so we keep typing intentionally loose.
declare namespace JSX {
  type Element = any;
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

