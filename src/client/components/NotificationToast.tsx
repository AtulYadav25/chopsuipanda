import React, { useEffect } from "react";
import gsap from "gsap";

const NotificationToast = ({
    type = "success",
    message,
    onClose,
    classNamesPassed
}: {
    type: "success" | "error" | "info" | "warning";
    message: string;
    onClose: () => void;
    classNamesPassed?: string;
}) => {
    const getMessageStyle = () => {
        switch (type) {
            case "success":
                return "bg-green-600 text-white";
            case "error":
                return "bg-red-600 text-white";
            case "info":
                return "bg-blue-600 text-white";
            case "warning":
                return "bg-yellow-600 text-black";
            default:
                return "bg-gray-800 text-white";
        }
    };

    useEffect(() => {
        const animation = gsap.fromTo(
            "#notification-toast",
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
        );

        return () => {
            animation.reverse();
        };
    }, []);

    return (
        <div
            id="notification-toast"
            className={` fixed z-[10001] font-Game bottom-5 left-1/2 transform -translate-x-1/2 w-11/12 max-w-sm rounded-2xl shadow-lg p-4 flex items-center justify-between ${getMessageStyle()} z-[200] ${classNamesPassed}`}
        >
            <span className="text-xs ">{message}</span>
            <button
                className="ml-4 p-1 rounded-full hover:bg-black/20"
                onClick={onClose}
                aria-label="Close message"
            >

            </button>
        </div>
    );
};

export default NotificationToast;