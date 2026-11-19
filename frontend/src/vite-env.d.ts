/// <reference types="vite/client" />

interface Window {
  kgsDesktop?: {
    readonly isSecureDesktop: boolean;
    setExamMode(enabled: boolean): void;
  };
}
