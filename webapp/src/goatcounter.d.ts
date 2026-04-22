/** https://www.goatcounter.com/help/events */
export interface GoatCounterCountArgs {
  path?: string | ((p: string) => string);
  title?: string;
  referrer?: string;
  event?: boolean;
}

export interface GoatCounterAPI {
  count: (vars?: GoatCounterCountArgs) => void;
}

declare global {
  interface Window {
    goatcounter?: GoatCounterAPI;
  }
}

export {};
