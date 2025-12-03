/// <reference types="vite/client" />

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}
declare module '*.webp' {
  const src: string;
  export default src;
}
