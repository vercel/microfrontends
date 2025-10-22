declare module 'shared/header' {
  export function bootstrap(): Promise<void>;
  export function mount(): Promise<void>;
  export function unmount(): Promise<void>;
}

declare module 'shared/footer' {
  export function bootstrap(): Promise<void>;
  export function mount(): Promise<void>;
  export function unmount(): Promise<void>;
}

declare module 'web/page' {
  export function bootstrap(): Promise<void>;
  export function mount(): Promise<void>;
  export function unmount(): Promise<void>;
}
