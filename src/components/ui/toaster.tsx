import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

const variantIcons = {
  default: null,
  destructive: <XCircle className="h-5 w-5 shrink-0 text-destructive" />,
  success: <CheckCircle className="h-5 w-5 shrink-0 text-success" />,
  warning: <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />,
  info: <Info className="h-5 w-5 shrink-0 text-info" />,
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const icon = variantIcons[variant || "default"];
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3">
              {icon}
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
