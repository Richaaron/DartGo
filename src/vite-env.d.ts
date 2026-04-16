/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_APP_NAME: string
  readonly VITE_SCHOOL_NAME: string
  readonly VITE_MAX_UPLOAD_SIZE: string
  readonly VITE_ENABLE_NOTIFICATIONS: string
  readonly VITE_ENABLE_ADVANCED_ANALYTICS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
