declare global {
  interface Window {
    /**
     * Navigate to the auth page with a custom redirect URL
     * @param redirectUrl - URL to redirect to after successful authentication
     */
    navigateToAuth: (redirectUrl: string) => void;
  }
}

// Allow dynamic ESM import of JSZip via CDN in Landing.tsx
declare module "https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm" {
  const JSZip: any;
  export default JSZip;
}

export {};