import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface InformModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
  type?: "default" | "consent"
}

export default function InformModal({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  type = "default",
}: InformModalProps) {
  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}>
      <AlertDialogContent className="text-product-foreground w-[95vw] max-w-md mx-4 p-6 sm:p-8 bg-product-background border border-product-border shadow-product-shadow rounded-2xl">
        <AlertDialogHeader className="space-y-3">
          <AlertDialogTitle className="text-xl font-bold text-product-foreground font-heading">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-product-foreground-accent text-base leading-relaxed">{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-3 pt-4 border-t border-product-border">
          {cancelText && (
            <AlertDialogCancel 
              disabled={loading}
              className="bg-product-foreground-accent/10 text-product-foreground-accent hover:bg-product-foreground-accent/20 border border-product-border hover:border-product-foreground-accent/30 transition-colors duration-200">
              {cancelText}
            </AlertDialogCancel>
          )}
          <AlertDialogAction 
            onClick={onConfirm} 
            disabled={loading}
            className="bg-product-primary text-product-foreground hover:bg-product-primary-accent border border-product-primary hover:border-product-primary-accent transition-colors duration-200 font-semibold">
            {loading ? "Processing..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
