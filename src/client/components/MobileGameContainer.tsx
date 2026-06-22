import { ReactNode } from "react";

interface MobileGameContainerProps {
    children: ReactNode;
}

function MobileGameContainer({ children }: MobileGameContainerProps) {
    return (
        <div
            className="min-h-screen w-full flex items-center justify-center bg-transparent md:bg-[#0a0a0f]"
            style={{
                backgroundImage: `
          radial-gradient(ellipse at 20% 50%, rgba(120, 40, 200, 0.08) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 20%, rgba(40, 100, 200, 0.08) 0%, transparent 60%),
          radial-gradient(ellipse at 60% 80%, rgba(200, 40, 120, 0.06) 0%, transparent 50%)
        `,
            }}
        >
            {/* Mesh grid overlay — desktop only */}
            <div
                className="fixed inset-0 hidden md:block pointer-events-none"
                style={{
                    backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
                    backgroundSize: "40px 40px",
                }}
            />

            {/* Mobile-sized game container */}
            <div
                className="
          relative
          w-full h-screen
          md:w-[390px] md:h-[844px]
          md:rounded-[2.5rem]
          md:overflow-hidden
          md:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_32px_80px_rgba(0,0,0,0.8),0_0_60px_rgba(120,40,200,0.15)]
          bg-[#0d0d14]
          flex flex-col
        "
            >
                {/* Subtle inner glow rim — desktop only */}
                <div
                    className="absolute inset-0 rounded-[2.5rem] pointer-events-none hidden md:block"
                    style={{
                        background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)",
                    }}
                />

                <div className="flex-1 flex flex-col z-10">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default MobileGameContainer;