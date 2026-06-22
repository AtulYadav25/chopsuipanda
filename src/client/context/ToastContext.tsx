// src/context/ToastContext.tsx
import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import NotificationToast from "../components/NotificationToast";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastOptions {
    type?: ToastType;
    message: string;
    duration?: number; // ms, default 3000
}

interface ToastContextValue {
    showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback(({ type = "success", message, duration = 3000 }: ToastOptions) => {
        if (timerRef.current) clearTimeout(timerRef.current);

        setToast({ type, message, duration, id: Date.now() });

        timerRef.current = setTimeout(() => setToast(null), duration);
    }, []);

    const handleClose = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setToast(null);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <NotificationToast
                    key={toast.id}          // remounts on each new toast, re-triggers GSAP
                    type={toast.type!}
                    message={toast.message}
                    onClose={handleClose}
                />
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
    return ctx;
};

/**
 * How to Use?
 * import { useToast } from "@/context/ToastContext";

const SomeDeepChild = () => {
  const { showToast } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      showToast({ type: "success", message: "Saved successfully!" });
    } catch {
      showToast({ type: "error", message: "Something went wrong.", duration: 5000 });
    }
  };

  return <button onClick={handleSave}>Save</button>;
};
 */