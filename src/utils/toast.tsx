import { Toaster, toast } from 'sonner'

export { toast }

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      expand={false}
      richColors
      closeButton
      theme="light"
      toastOptions={{
        style: {
          fontFamily: 'inherit',
        },
      }}
    />
  )
}

export const showSuccess = (message: string, description?: string) => {
  toast.success(message, {
    description,
    duration: 4000,
  })
}

export const showError = (message: string, description?: string) => {
  toast.error(message, {
    description,
    duration: 5000,
  })
}

export const showWarning = (message: string, description?: string) => {
  toast.warning(message, {
    description,
    duration: 4000,
  })
}

export const showInfo = (message: string, description?: string) => {
  toast.info(message, {
    description,
    duration: 3000,
  })
}

export const showLoading = (message: string) => {
  return toast.loading(message)
}

export const dismissToast = (id?: string) => {
  if (id) {
    toast.dismiss(id)
  } else {
    toast.dismiss()
  }
}