import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";

interface StyledQRCodeProps {
    value: string;
    size?: number;
    logoSrc?: string;
}

export default function StyledQRCode({ value, size = 120, logoSrc }: StyledQRCodeProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const qrRef = useRef<QRCodeStyling | null>(null);

    useEffect(() => {
        qrRef.current = new QRCodeStyling({
            width: size,
            height: size,
            type: "svg",
            data: value,
            margin: 2,
            qrOptions: {
                errorCorrectionLevel: "H",
            },
            image: logoSrc,
            imageOptions: {
                hideBackgroundDots: true,
                imageSize: 0.32,
                margin: 2,
                crossOrigin: "anonymous",
            },
            dotsOptions: {
                type: "rounded",
                color: "#0B1220",
            },
            cornersSquareOptions: {
                type: "extra-rounded",
                color: "#0B1220",
            },
            cornersDotOptions: {
                type: "dot",
                color: "#298DFF",
            },
            backgroundOptions: {
                color: "#ffffff",
            },
        });

        if (containerRef.current) {
            containerRef.current.innerHTML = "";
            qrRef.current.append(containerRef.current);
        }
    }, [value, size, logoSrc]);

    return <div ref={containerRef} />;
}