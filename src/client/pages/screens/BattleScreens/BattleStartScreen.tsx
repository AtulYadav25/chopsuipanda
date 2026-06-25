import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { usePlayerStore } from '@/client/store/usePlayerStore';
import { BattleMatch } from '@/shared/schemas/battleMatch.schema';
import { useAssetLoader } from '@/client/assets/useAssetLoader';
import { battleAssets } from '@/client/assets';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BattleStartScreenProps {
    battle: BattleMatch;
    handleStartGame: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const BattleStartScreen = ({ battle, handleStartGame }: BattleStartScreenProps) => {
    const { assets } = useAssetLoader(battleAssets);

    const containerRef = useRef<HTMLDivElement>(null);
    const characterRef = useRef<HTMLImageElement>(null);
    const textRef = useRef<HTMLParagraphElement>(null);
    const secondTextRef = useRef<HTMLParagraphElement>(null);

    const [imageLoaded, setImageLoaded] = useState<boolean>(false);

    const player = usePlayerStore((s) => s.player);

    const isUserOpponent =
        battle?.opponent?.username?.toUpperCase() === player?.username?.toUpperCase();

    const firstText = isUserOpponent
        ? 'Challenge Accepted!'
        : `Challenged Friend ${battle?.opponent?.username ?? ''}`;

    const secondTextHTML = isUserOpponent
        ? `Opponent Score<br>${battle?.challenger?.score}`
        : 'Make Highest Score as possible to win';

    useEffect(() => {
        if (!imageLoaded) return;

        const tl = gsap.timeline();

        tl.fromTo(containerRef.current, { y: '-100%' }, { y: 0, duration: 0.8, ease: 'power2.out' });

        tl.from(characterRef.current, { opacity: 0, y: 40, duration: 0.8, ease: 'power2.out' }, '-=0.4');

        tl.from(textRef.current, { opacity: 0, y: 10, duration: 0.5 });

        tl.to(textRef.current, { opacity: 0, duration: 0.4, delay: 0.8 });

        tl.fromTo(secondTextRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5 });

        tl.to(secondTextRef.current, { delay: 3, duration: 0 });

        tl.call(() => handleStartGame());

        return () => { tl.kill(); };
    }, [battle, player, handleStartGame, imageLoaded]);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-cover bg-center h-[100vh]"
            style={{ backgroundImage: `url(${assets.battleBackground})` }}
        >
            <div className="relative h-24 w-[80%] flex items-center justify-center">
                <p ref={textRef} className="absolute text-white text-2xl text-center font-Game">
                    {firstText}
                </p>
                {/* opacity-0 is the initial state — GSAP animates it to 1 */}
                <p
                    ref={secondTextRef}
                    className="absolute text-white text-xl text-center font-Game opacity-0"
                    dangerouslySetInnerHTML={{ __html: secondTextHTML }}
                />
            </div>
            <img
                ref={characterRef}
                src={assets.battlePanda}
                alt="Character"
                onLoad={() => setImageLoaded(true)}
                className="w-[70%] mb-4"
            />
        </div>
    );
};

export default BattleStartScreen;