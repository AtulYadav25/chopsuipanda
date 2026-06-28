import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import SoundManager from "@/client/utils/SoundManager";
import { useAssetLoader } from "@/client/assets/useAssetLoader";
import { treeChopGameAssets } from "@/client/assets";
import { useToast } from "@/client/context/ToastContext";
import { useChopTree, useTreeChopSessionStart } from "@/client/hooks/chopsuipanda";
import { TREE_CHOP_BRANCH_POSITION, TREE_CHOP_BRANCH_TYPE, TreeBranch } from "@/server/modules/stores/types";
import { useCurrentAccount } from "@mysten/dapp-kit-react";
import SimpleLoadingScreen from "../childScreens/SimpleLoadingScreen";

const TreeChopGameBattle = ({ submitBattleScore
}: {
    submitBattleScore: () => void
}) => {

    //Asset Loader
    const { assets, ready } = useAssetLoader(treeChopGameAssets);

    const childCanvasRef = useRef<HTMLCanvasElement | null>(null);
    // imagesLoaded is now driven by `ready` from useAssetLoader — no extra state needed
    const playerSide = useRef<TreeBranch['position']>(TREE_CHOP_BRANCH_POSITION.LEFT);
    const scoreRef = useRef(0);
    const fetchingMoreBranches = useRef(false);
    const gameOverRef = useRef<boolean>(false);
    const isGameStarted = useRef(false);
    const [gameState, setGameState] = useState("starting");

    // Hooks & Mutations
    const account = useCurrentAccount();
    const { showToast } = useToast();
    const { mutateAsync: startTreeChopSession } = useTreeChopSessionStart();
    const { mutate: chopTree } = useChopTree();

    // ── Typed mutation queue (replaces socket emit queue) ────────────────────
    type ChopTreeArgs = { side: TreeBranch['position']; clientBranchId: TreeBranch['id'] };
    type ChopTreeResult = { branches?: TreeBranch[]; score?: number } | null;
    type QueueItem = {
        args: ChopTreeArgs;
        onSuccess?: (data: ChopTreeResult) => void;
        onError?: (err: Error) => void;
    };

    const mutationQueue = useRef<QueueItem[]>([]);
    const isEmitting = useRef(false);

    const processMutationQueue = () => {
        if (isEmitting.current || mutationQueue.current.length === 0) return;
        isEmitting.current = true;
        const { args, onSuccess, onError } = mutationQueue.current.shift()!;
        chopTree(args, {
            onSuccess: (res) => {
                const data = (res as any)?.data ?? null;
                onSuccess?.(data);
                isEmitting.current = false;
                processMutationQueue();
            },
            onError: (err) => {
                onError?.(err as Error);
                isEmitting.current = false;
                processMutationQueue();
            },
        });
    };

    const queueMutation = (args: ChopTreeArgs, callbacks?: { onSuccess?: (data: ChopTreeResult) => void; onError?: (err: Error) => void }) => {
        mutationQueue.current.push({ args, ...callbacks });
        processMutationQueue();
    };


    const gameOver = async () => {

        setGameState("ended");
        isGameStarted.current = false;
        await submitBattleScore()
        SoundManager.play('treeChopGameOver');
    }



    //Switching to requestAnimationFrame instead of useEffect and using useRef instead of useState

    const animationFrameId = useRef<number | null>(null);

    // Game constants
    const treeParts = 14;
    const visibleParts = 7;
    const partHeight = 250;

    // Tree and branch dimensions
    const TREE_WIDTH = 180;
    const TREE_SCALE = 0.5;
    const BRANCH_WIDTH = 100;
    const BRANCH_HEIGHT = 75;
    // Chi bonus image dimensions - adjusted for proper scaling
    const CHI_BONUS_WIDTH = 60;
    const CHI_BONUS_HEIGHT = 60;
    const CHI_BONUS_X_OFFSET = 1; // Center the chi bonus horizontally
    const CHI_BONUS_Y_OFFSET = -2; // Adjust vertical position
    const CHARACTER_SCALE = 0.25;
    const FLOOR_HEIGHT = 100;
    const Y_OFFSET = 25;

    // Character sprite animation constants
    const CHARACTER_SPRITE_WIDTH = 500;
    const CHARACTER_SPRITE_HEIGHT = 500;
    const CHARACTER_SPRITE_FRAMES = 5;

    // Dust sprite animation constants
    const DUST_SPRITE_WIDTH = 300;
    const DUST_SPRITE_HEIGHT = 122;
    const DUST_SPRITE_FRAMES = 8;

    // Time bar constants
    const TIME_BAR_WIDTH = window.innerWidth / 2;
    const TIME_BAR_HEIGHT = 20;
    const TIME_BAR_X = (window.innerWidth - TIME_BAR_WIDTH) / 2;
    const TIME_BAR_Y = 50;
    const TIME_INCREASE_AMOUNT = 8;

    // Game state
    const topIndex = useRef(0);
    const branches = useRef<{ position: TreeBranch['position'], id: TreeBranch['id'], type: TreeBranch['type'] }[]>(
        Array.from({ length: visibleParts }, (_) => {
            return { position: TREE_CHOP_BRANCH_POSITION.NONE, id: 0, type: null }
        })
    );
    const newBranches = useRef<{ position: TreeBranch['position'], id: TreeBranch['id'], type: TreeBranch['type'] }[]>([]);
    const characterFrame = useRef(0);
    const isChopping = useRef(false);
    const lastChopTime = useRef(0);
    const timeBarProgress = useRef(100);
    const treeShakeOffset = useRef(0);
    const timeSquareInterval = useRef(1000); // Initial interval of 1 second per square
    const gameTimeElapsed = useRef(0); // Track elapsed game time for decreasing intervals
    const lastSquareUpdateTime = useRef(0); // Track when the last square was removed


    // Animation states
    const characterSpriteFrame = useRef(0);
    const showCharacterAnimation = useRef(false);
    const dustSpriteFrame = useRef(0);
    const showDustAnimation = useRef(false);
    const showScoreAnimation = useRef(false);
    const scoreAnimationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);;
    const bonusBranchRefs = useRef<Record<string, { x: number; y: number; scale: number; glow: number }>>({});

    const circleTimerRef = useRef<{
        color: string;
        radius: number | null;
        scale: number | null;
    }>({
        color: '#15ff00',
        radius: null,
        scale: null
    })
    const countdownSecondsRef = useRef<number>(20);
    const lastUpdateTimerRef = useRef(0);


    // Flying chiBonus animation state
    const flyingChiBonus = useRef({
        active: false,
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1
    });

    // Character animation states
    const CHARACTER_STATES = {
        IDLE: 0,
        HIT_START: 1,
        HIT: 2,
        GAME_OVER: 3
    };

    // Character dimensions
    const CHARACTER_WIDTH = 500;
    const CHARACTER_HEIGHT = 500;

    // Load images
    const images = useRef({
        tree: new Image(),
        branch: new Image(),
        character: new Image(),
        background: new Image(),
        floor: new Image(),
        chiBonus: new Image(),
        timeBonus: new Image(),
        characterSprite: new Image(),
        dustSprite: new Image()
    });

    // Animation states
    const characterOffset = useRef(0);
    const characterYOffset = useRef(0);

    /**
     * Once useAssetLoader has resolved all URLs (`ready === true`),
     * assign them to the HTMLImageElement refs used by the canvas draw loop.
     * useAssetLoader already handles caching, so this is near-instant.
     */
    useEffect(() => {
        if (!ready) return;

        images.current.tree.src = assets.treeImage;
        images.current.branch.src = assets.branchImage;
        images.current.character.src = assets.characterImage;
        images.current.background.src = assets.backgroundImage;
        images.current.floor.src = assets.floorImage;
        images.current.chiBonus.src = assets.chiBonus;
        images.current.timeBonus.src = assets.timeBonus;
        images.current.characterSprite.src = assets.characterImage; // same sprite sheet
        images.current.dustSprite.src = assets.dustSpriteAnimation;

        return () => {
            gsap.killTweensOf(Object.values(bonusBranchRefs.current));
            if (scoreAnimationTimer.current) {
                clearTimeout(scoreAnimationTimer.current);
            }
        };
    }, [ready, assets]);

    function drawCircularTimer(ctx: CanvasRenderingContext2D, width: number) {
        // Ensure radius and scale are set
        if (!circleTimerRef.current.radius) circleTimerRef.current.radius = 35;
        if (!circleTimerRef.current.scale) circleTimerRef.current.scale = 1;

        const centerX = width / 2;
        const centerY = 50;
        const radius = circleTimerRef.current.radius;
        const scale = circleTimerRef.current.scale;
        const lineWidth = 6;

        const percentage = Math.max(0, Math.min(1, countdownSecondsRef.current / 20)); // Clamp between 0 and 1
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + percentage * 2 * Math.PI;

        // Draw base circle
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = lineWidth;
        ctx.shadowColor = "#222";
        ctx.shadowBlur = 10;
        ctx.stroke();

        // Draw countdown arc
        ctx.beginPath();
        ctx.arc(0, 0, radius, startAngle, endAngle, false);
        ctx.strokeStyle = circleTimerRef.current.color;
        ctx.lineWidth = lineWidth;
        ctx.shadowColor = circleTimerRef.current.color;
        ctx.shadowBlur = 20;
        ctx.stroke();

        ctx.restore();

        // Draw seconds inside the circle (with glow)
        ctx.save();
        ctx.fillStyle = circleTimerRef.current.color;
        ctx.font = '28px Game';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = circleTimerRef.current.color;
        ctx.shadowBlur = 10;
        ctx.fillText(countdownSecondsRef.current.toString(), centerX, centerY);
        ctx.restore();
    }




    const drawGame = () => {
        const canvas = childCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const width = window.innerWidth;
        const height = window.innerHeight;

        // ✅ Only resize when needed to prevent layout thrashing
        if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
            // Set CSS size
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            // Set scaled pixel buffer
            canvas.width = width * dpr;
            canvas.height = height * dpr;

            // Reset transform before scaling (important!)
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            // ✅ Scale drawing to match display density
            ctx.scale(dpr, dpr);
        }

        // ✅ Now it's safe to clear and draw
        ctx.clearRect(0, 0, width, height);

        // Draw background
        ctx.drawImage(
            images.current.background,
            0,
            0,
            window.innerWidth,
            window.innerHeight
        );

        // Draw dark overlay with reduced opacity
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

        // Draw floor
        const floorY = window.innerHeight - FLOOR_HEIGHT;
        ctx.drawImage(
            images.current.floor,
            0,
            floorY,
            window.innerWidth,
            FLOOR_HEIGHT
        );

        // Draw tree parts
        for (let i = 0; i < visibleParts; i++) {
            const partIndex = topIndex.current + i;
            if (partIndex >= treeParts) continue;

            // Calculate tree position - center of screen with shake offset
            const treeX = (window.innerWidth - TREE_WIDTH * TREE_SCALE) / 2 + treeShakeOffset.current;
            const treeY = floorY - ((i + 1) * partHeight * TREE_SCALE) + Y_OFFSET;


            // Draw tree part
            ctx.drawImage(
                images.current.tree,
                0,
                partIndex * partHeight,
                250,
                partHeight,
                treeX,
                treeY,
                TREE_WIDTH * TREE_SCALE,
                partHeight * TREE_SCALE
            );

            // Draw branch
            const branch = branches.current[i];
            // Handle both string format (legacy) and object format (new)
            const branchPosition = branch.position;
            const branchType = branch.type;

            // Skip drawing the chiBonus if it's at the lowest position
            if (i === 0) {
                continue; // Skip drawing this branch
            }

            if (branchPosition !== TREE_CHOP_BRANCH_POSITION.NONE) {
                const branchX = branchPosition === TREE_CHOP_BRANCH_POSITION.LEFT
                    ? treeX - BRANCH_WIDTH
                    : treeX + (TREE_WIDTH * TREE_SCALE);

                // Save context for branch flipping
                ctx.save();

                if (branchPosition === TREE_CHOP_BRANCH_POSITION.RIGHT) {
                    if (branchType !== TREE_CHOP_BRANCH_TYPE.TIME_BONUS) {
                        ctx.translate(branchX + BRANCH_WIDTH, 0);
                        ctx.scale(-1, 1);
                    } else {
                        ctx.translate(treeX + BRANCH_WIDTH + 20, 0); // No flip, just translate normally
                    }

                    // Draw the appropriate image based on branch type
                    if (branchType === TREE_CHOP_BRANCH_TYPE.SCORE_BONUS) {
                        // Draw chiBonus image for score bonus branches with adjusted dimensions and scale
                        const branchKey = `right-${i}`;
                        const scale = bonusBranchRefs.current[branchKey]?.scale || 1;
                        const centerX = 0 + CHI_BONUS_X_OFFSET + CHI_BONUS_WIDTH / 2;
                        const centerY = treeY + CHI_BONUS_Y_OFFSET + CHI_BONUS_HEIGHT / 2;
                        const scaledWidth = CHI_BONUS_WIDTH * scale;
                        const scaledHeight = CHI_BONUS_HEIGHT * scale;

                        ctx.drawImage(
                            images.current.chiBonus,
                            centerX - scaledWidth / 2,
                            centerY - scaledHeight / 2,
                            scaledWidth,
                            scaledHeight
                        );

                        if (!bonusBranchRefs.current[branchKey]) {
                            bonusBranchRefs.current[branchKey] = {
                                x: 0 + CHI_BONUS_X_OFFSET,
                                y: treeY + CHI_BONUS_Y_OFFSET,
                                scale: 1,
                                glow: 0
                            };

                            // Create glow and pulse animation
                            gsap.to(bonusBranchRefs.current[branchKey], {
                                duration: 0.65, // was 0.5
                                scale: 1.2,
                                glow: 10, // For glow effect
                                repeat: -1,
                                yoyo: true,
                                ease: "sine.inOut"
                            });
                        } else {
                            // Update position for existing animation
                            bonusBranchRefs.current[branchKey].y = treeY + CHI_BONUS_Y_OFFSET;
                        }

                        // Apply glow effect
                        if (bonusBranchRefs.current[branchKey] && bonusBranchRefs.current[branchKey].glow > 0) {
                            ctx.shadowColor = '#FFD700';
                            ctx.shadowBlur = bonusBranchRefs.current[branchKey].glow;
                            ctx.shadowOffsetX = 0;
                            ctx.shadowOffsetY = 0;
                        }
                    } else if (branchType === TREE_CHOP_BRANCH_TYPE.TIME_BONUS) {
                        // Draw chiBonus image for score bonus branches with adjusted dimensions and scale
                        const branchKey = `right-${i}`;
                        const scale = bonusBranchRefs.current[branchKey]?.scale || 1;
                        const centerX = 0 + CHI_BONUS_X_OFFSET + CHI_BONUS_WIDTH / 2;
                        const centerY = treeY + CHI_BONUS_Y_OFFSET + CHI_BONUS_HEIGHT / 2;
                        const scaledWidth = CHI_BONUS_WIDTH * scale;
                        const scaledHeight = CHI_BONUS_HEIGHT * scale;

                        ctx.drawImage(
                            images.current.timeBonus,
                            centerX - scaledWidth / 2,
                            centerY - scaledHeight / 2,
                            scaledWidth,
                            scaledHeight
                        );

                        if (!bonusBranchRefs.current[branchKey]) {
                            bonusBranchRefs.current[branchKey] = {
                                x: 0 + CHI_BONUS_X_OFFSET,
                                y: treeY + CHI_BONUS_Y_OFFSET,
                                scale: 1,
                                glow: 0
                            };

                            // Create glow and pulse animation
                            gsap.to(bonusBranchRefs.current[branchKey], {
                                duration: 0.65, // was 0.5
                                scale: 1.2,
                                glow: 10, // For glow effect
                                repeat: -1,
                                yoyo: true,
                                ease: "sine.inOut"
                            });
                        } else {
                            // Update position for existing animation
                            bonusBranchRefs.current[branchKey].y = treeY + CHI_BONUS_Y_OFFSET;
                        }

                        // Apply glow effect
                        if (bonusBranchRefs.current[branchKey] && bonusBranchRefs.current[branchKey].glow > 0) {
                            ctx.shadowColor = '#FFD700';
                            ctx.shadowBlur = bonusBranchRefs.current[branchKey].glow;
                            ctx.shadowOffsetX = 0;
                            ctx.shadowOffsetY = 0;
                        }
                    } else {
                        // Draw regular branch image
                        ctx.drawImage(
                            images.current.branch,
                            0,
                            treeY,
                            BRANCH_WIDTH,
                            BRANCH_HEIGHT
                        );
                    }
                } else {
                    // Draw the appropriate image based on branch type
                    if (branchType === TREE_CHOP_BRANCH_TYPE.SCORE_BONUS) {
                        // Draw chiBonus image for score bonus branches with adjusted dimensions and scale
                        const branchKey = `left-${i}`;
                        const scale = bonusBranchRefs.current[branchKey]?.scale || 1;
                        const centerX = branchX + CHI_BONUS_X_OFFSET + CHI_BONUS_WIDTH / 2;
                        const centerY = treeY + CHI_BONUS_Y_OFFSET + CHI_BONUS_HEIGHT / 2;
                        const scaledWidth = CHI_BONUS_WIDTH * scale;
                        const scaledHeight = CHI_BONUS_HEIGHT * scale;

                        ctx.drawImage(
                            images.current.chiBonus,
                            centerX - scaledWidth / 2,
                            centerY - scaledHeight / 2,
                            scaledWidth,
                            scaledHeight
                        );

                        if (!bonusBranchRefs.current[branchKey]) {
                            bonusBranchRefs.current[branchKey] = {
                                x: branchX + CHI_BONUS_X_OFFSET,
                                y: treeY + CHI_BONUS_Y_OFFSET,
                                scale: 1,
                                glow: 0
                            };

                            // Create glow and pulse animation
                            gsap.to(bonusBranchRefs.current[branchKey], {
                                duration: 0.65, // was 0.5
                                scale: 1.2,
                                glow: 10, // For glow effect
                                repeat: -1,
                                yoyo: true,
                                ease: "sine.inOut"
                            });
                        } else {
                            // Update position for existing animation
                            bonusBranchRefs.current[branchKey].y = treeY + CHI_BONUS_Y_OFFSET;
                        }

                        // Apply glow effect
                        if (bonusBranchRefs.current[branchKey] && bonusBranchRefs.current[branchKey].glow > 0) {
                            ctx.shadowColor = '#FFD700';
                            ctx.shadowBlur = bonusBranchRefs.current[branchKey].glow;
                            ctx.shadowOffsetX = 0;
                            ctx.shadowOffsetY = 0;
                        }
                    } else if (branchType === TREE_CHOP_BRANCH_TYPE.TIME_BONUS) {
                        // Draw chiBonus image for score bonus branches with adjusted dimensions and scale
                        const branchKey = `left-${i}`;
                        const scale = bonusBranchRefs.current[branchKey]?.scale || 1;
                        const centerX = branchX + CHI_BONUS_X_OFFSET + CHI_BONUS_WIDTH / 2;
                        const centerY = treeY + CHI_BONUS_Y_OFFSET + CHI_BONUS_HEIGHT / 2;
                        const scaledWidth = CHI_BONUS_WIDTH * scale;
                        const scaledHeight = CHI_BONUS_HEIGHT * scale;

                        ctx.drawImage(
                            images.current.timeBonus,
                            centerX - scaledWidth / 2,
                            centerY - scaledHeight / 2,
                            scaledWidth,
                            scaledHeight
                        );

                        if (!bonusBranchRefs.current[branchKey]) {
                            bonusBranchRefs.current[branchKey] = {
                                x: 0 + CHI_BONUS_X_OFFSET,
                                y: treeY + CHI_BONUS_Y_OFFSET,
                                scale: 1,
                                glow: 0
                            };

                            // Create glow and pulse animation
                            gsap.to(bonusBranchRefs.current[branchKey], {
                                duration: 0.65, // was 0.5
                                scale: 1.2,
                                glow: 10, // For glow effect
                                repeat: -1,
                                yoyo: true,
                                ease: "sine.inOut"
                            });
                        } else {
                            // Update position for existing animation
                            bonusBranchRefs.current[branchKey].y = treeY + CHI_BONUS_Y_OFFSET;
                        }

                        // Apply glow effect
                        if (bonusBranchRefs.current[branchKey] && bonusBranchRefs.current[branchKey].glow > 0) {
                            ctx.shadowColor = '#FFD700';
                            ctx.shadowBlur = bonusBranchRefs.current[branchKey].glow;
                            ctx.shadowOffsetX = 0;
                            ctx.shadowOffsetY = 0;
                        }
                    } else {
                        // Draw regular branch image
                        ctx.drawImage(
                            images.current.branch,
                            branchX,
                            treeY,
                            BRANCH_WIDTH,
                            BRANCH_HEIGHT
                        );
                    }
                }
                ctx.restore();
            }
        }

        // Update character position
        const treeX = (window.innerWidth - TREE_WIDTH * TREE_SCALE) / 2;

        //To change the x axis of the character 
        const charX = playerSide.current === "left"
            ? treeX - (CHARACTER_WIDTH * CHARACTER_SCALE) - 10 + characterOffset.current
            : treeX + (TREE_WIDTH * TREE_SCALE) + 10 - characterOffset.current;
        const charY = floorY - CHARACTER_HEIGHT * CHARACTER_SCALE + Y_OFFSET - characterYOffset.current;

        // Draw character with flipping
        ctx.save();
        if (showCharacterAnimation.current) {
            // Draw animated character sprite
            if (playerSide.current === "right") {
                ctx.translate(charX + CHARACTER_SPRITE_WIDTH * CHARACTER_SCALE, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(
                    images.current.characterSprite,
                    characterSpriteFrame.current * CHARACTER_SPRITE_WIDTH,
                    CHARACTER_SPRITE_HEIGHT, // Second row of the sprite sheet
                    CHARACTER_SPRITE_WIDTH,
                    CHARACTER_SPRITE_HEIGHT,
                    0,
                    charY,
                    CHARACTER_SPRITE_WIDTH * CHARACTER_SCALE,
                    CHARACTER_SPRITE_HEIGHT * CHARACTER_SCALE
                );
            } else {
                ctx.drawImage(
                    images.current.characterSprite,
                    characterSpriteFrame.current * CHARACTER_SPRITE_WIDTH,
                    CHARACTER_SPRITE_HEIGHT, // Second row of the sprite sheet
                    CHARACTER_SPRITE_WIDTH,
                    CHARACTER_SPRITE_HEIGHT,
                    charX,
                    charY,
                    CHARACTER_SPRITE_WIDTH * CHARACTER_SCALE,
                    CHARACTER_SPRITE_HEIGHT * CHARACTER_SCALE
                );
            }
        } else {
            // Draw regular character
            if (playerSide.current === "right") {
                ctx.translate(charX + CHARACTER_WIDTH * CHARACTER_SCALE, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(
                    images.current.character,
                    (gameOverRef.current ? CHARACTER_STATES.GAME_OVER : characterFrame.current) * CHARACTER_WIDTH,
                    0,
                    CHARACTER_WIDTH,
                    CHARACTER_HEIGHT,
                    0,
                    charY,
                    CHARACTER_WIDTH * CHARACTER_SCALE,
                    CHARACTER_HEIGHT * CHARACTER_SCALE
                );
            } else {
                ctx.drawImage(
                    images.current.character,
                    (gameOverRef.current ? CHARACTER_STATES.GAME_OVER : characterFrame.current) * CHARACTER_WIDTH,
                    0,
                    CHARACTER_WIDTH,
                    CHARACTER_HEIGHT,
                    charX,
                    charY,
                    CHARACTER_WIDTH * CHARACTER_SCALE,
                    CHARACTER_HEIGHT * CHARACTER_SCALE
                );
            }
        }
        ctx.restore();

        // Draw dust animation if active
        if (showDustAnimation.current) {
            const dustX = playerSide.current === "left"
                ? charX + CHARACTER_WIDTH * CHARACTER_SCALE / 2 - DUST_SPRITE_WIDTH / 2
                : charX + CHARACTER_WIDTH * CHARACTER_SCALE / 2 - DUST_SPRITE_WIDTH / 2;
            const dustY = floorY - DUST_SPRITE_HEIGHT + 50; // Position dust at floor level

            ctx.drawImage(
                images.current.dustSprite,
                dustSpriteFrame.current * DUST_SPRITE_WIDTH,
                0,
                DUST_SPRITE_WIDTH,
                DUST_SPRITE_HEIGHT,
                dustX,
                dustY,
                DUST_SPRITE_WIDTH,
                DUST_SPRITE_HEIGHT
            );
        }

        // Draw score
        const scoreText = "SCORE";
        const scoreValue = scoreRef.current.toString();
        // Move the score to the top left with padding
        const scoreX = 24; // Padding from left
        const scoreY = 20; // Padding from top

        // Draw score label (with glow)
        ctx.save();
        ctx.font = "bold 24px Game";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 6;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(scoreText, scoreX, scoreY);
        ctx.restore();


        // Draw score value (with stronger glow)
        ctx.save();
        ctx.font = "32px Game";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 20;
        ctx.fillStyle = "#FFD700";
        ctx.fillText(scoreValue, scoreX, scoreY + 30);
        ctx.restore();


        // Draw flying chiBonus animation if active
        if (flyingChiBonus.current.active) {
            ctx.save();

            // Apply opacity and scale
            ctx.globalAlpha = flyingChiBonus.current.opacity;

            // Apply glow effect
            ctx.shadowColor = '#4988e6';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Draw the flying chiBonus
            const size = CHI_BONUS_WIDTH * flyingChiBonus.current.scale;
            ctx.drawImage(
                images.current.chiBonus,
                flyingChiBonus.current.x - size / 2,
                flyingChiBonus.current.y - size / 2,
                size,
                size
            );

            ctx.restore();
        }

        // Draw +20 score animation if active
        if (showScoreAnimation.current) {
            // Save the current context state
            ctx.save();

            ctx.font = "36px Game";
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";


            // Draw text shadow
            ctx.fillStyle = "#CCCCCC";
            for (let i = 1; i <= 3; i++) {
                ctx.fillText("+20", TIME_BAR_X + TIME_BAR_WIDTH / 2 + i, TIME_BAR_Y + TIME_BAR_HEIGHT + 45 + i);
            }

            // Draw main text
            ctx.fillStyle = "#FFD700"; // Yellow color
            ctx.fillText("+20", TIME_BAR_X + TIME_BAR_WIDTH / 2, TIME_BAR_Y + TIME_BAR_HEIGHT + 45);

            // Restore the context to previous state
            ctx.restore();
        }

        drawCircularTimer(ctx, width)
    };

    const animate = (timestamp: number) => {
        if (!gameOverRef.current) {
            // Calculate time since last frame
            const deltaTime = timestamp - (lastSquareUpdateTime.current || timestamp);
            lastSquareUpdateTime.current = timestamp;

            // Accumulate game time in seconds
            gameTimeElapsed.current += deltaTime / 1000;



            if ((timestamp - lastUpdateTimerRef.current) > 1000) {
                if (isGameStarted.current && !gameOverRef.current) {
                    if (countdownSecondsRef.current > 0) {
                        countdownSecondsRef.current = countdownSecondsRef.current - 1;

                        // Update color & glow
                        if (countdownSecondsRef.current >= 12) {
                            circleTimerRef.current.color = '#15ff00';
                        } else if (countdownSecondsRef.current >= 6) {
                            circleTimerRef.current.color = '#ffa500';
                        } else {
                            circleTimerRef.current.color = '#ff0000';

                            // Animate red warning (pop)
                            gsap.to(circleTimerRef.current, {
                                scale: 1.08,
                                duration: 0.2,
                                yoyo: true,
                                repeat: 1,
                                ease: "power1.inOut",
                            });

                        }
                        lastUpdateTimerRef.current = timestamp;
                    } else {
                        handleEmitGameOverSocket();
                    }
                }
            }
        }

        drawGame();
        animationFrameId.current = requestAnimationFrame(animate);
    };


    const updateCircleTimer = (num: number) => {
        countdownSecondsRef.current = Math.min(countdownSecondsRef.current + num, 20);
    }


    const fetchMoreBranches = (args: ChopTreeArgs) => {
        fetchingMoreBranches.current = true;
        queueMutation(args, {
            onSuccess: (data) => {
                const responseBranches = data?.branches ?? [];
                newBranches.current.push(...responseBranches);
                fetchingMoreBranches.current = false;

                // Clear stale GSAP animations for bonus branches scrolling off screen
                Object.values(bonusBranchRefs.current).forEach(tween => {
                    if (tween) {
                        gsap.killTweensOf(tween);
                    }
                });
                bonusBranchRefs.current = {};
            },
            onError: (err) => {
                showToast({ type: 'error', message: err.message || 'Failed to fetch branches' });
                fetchingMoreBranches.current = false;
            },
        });
    };

    useEffect(() => {
        if (!ready) return;

        // Reset time-related variables
        lastSquareUpdateTime.current = performance.now();
        lastUpdateTimerRef.current = performance.now();
        gameTimeElapsed.current = 0;
        timeSquareInterval.current = 1000;

        // Start animation loop
        animationFrameId.current = requestAnimationFrame(animate);

        // Cleanup
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [ready]);

    const chop = async (side: TreeBranch['position']) => {
        if (gameOverRef.current || !isGameStarted.current) return;

        const now = Date.now();
        if (isChopping.current) return;


        lastChopTime.current = now;
        playerSide.current = side;
        let isSocketEmitted = false;

        isChopping.current = true;
        characterFrame.current = CHARACTER_STATES.HIT_START;

        // Increase time bar progress
        timeBarProgress.current = Math.min(100, timeBarProgress.current + TIME_INCREASE_AMOUNT);

        // Start tree shake animation
        const shakeDuration = 160; // was 120
        const shakeIntensity = 1;
        const shakeInterval = 10;   // was 8
        let shakeTime = 0;

        const shakeTree = () => {
            if (shakeTime < shakeDuration) {
                treeShakeOffset.current = Math.sin(shakeTime / 20) * shakeIntensity;
                shakeTime += shakeInterval;
                setTimeout(shakeTree, shakeInterval);
            } else {
                treeShakeOffset.current = 0;
            }
        };

        SoundManager.play('treeChop')

        shakeTree();

        // Character movement animation
        const moveDistance = 20;
        const moveDuration = 160;

        // Move character towards tree
        characterOffset.current = moveDistance;
        setTimeout(() => {
            characterOffset.current = 0;
            characterFrame.current = CHARACTER_STATES.HIT_START;
        }, moveDuration);




        topIndex.current = topIndex.current + 1;
        if (topIndex.current >= treeParts - visibleParts) {
            topIndex.current = 0;
        }


        // Check collision with the lowest visible branch BEFORE any updates
        const currentBranches = [...branches.current];
        const lowestBranch = currentBranches[visibleParts - (visibleParts - 1)];

        // Handle both string format (legacy) and object format (new)
        const lowestBranchPosition = typeof lowestBranch === 'object' ? lowestBranch.position : lowestBranch;
        const lowestBranchType = typeof lowestBranch === 'object' ? lowestBranch.type : null;

        branches.current.shift();
        branches.current.push(newBranches.current[0]);
        newBranches.current.shift();

        if (lowestBranchPosition === side) {


            // Special behavior for scoreBonus branches
            if (lowestBranchType === TREE_CHOP_BRANCH_TYPE.SCORE_BONUS) {
                // Add extra time for bonus branches
                timeBarProgress.current = Math.min(100, timeBarProgress.current + 50);
                SoundManager.play('treeChiCollect');
                scoreRef.current += 21;
                isSocketEmitted = true;
                queueMutation(
                    { side, clientBranchId: lowestBranch.id as number },
                    { onError: (err) => showToast({ type: 'error', message: err.message }) }
                );


                // Show character animation when hitting scoreBonus on the correct side
                if (side === lowestBranchPosition) {
                    // Start character animation sequence
                    showCharacterAnimation.current = true;
                    characterSpriteFrame.current = 0;


                    // Prevent isChopping from becoming false until animations complete
                    isChopping.current = true;

                    // Calculate the position of the chiBonus that was hit
                    const treeX = (window.innerWidth - TREE_WIDTH * TREE_SCALE) / 2;
                    const floorY = window.innerHeight - FLOOR_HEIGHT;
                    const treeY = floorY - (visibleParts * partHeight * TREE_SCALE) + ((visibleParts - 2) * partHeight * TREE_SCALE) + Y_OFFSET;

                    const branchX = side === TREE_CHOP_BRANCH_POSITION.LEFT
                        ? treeX - BRANCH_WIDTH
                        : treeX + (TREE_WIDTH * TREE_SCALE);

                    // Initialize flying chiBonus animation
                    flyingChiBonus.current = {
                        active: true,
                        x: side === TREE_CHOP_BRANCH_POSITION.LEFT ? branchX + CHI_BONUS_X_OFFSET + CHI_BONUS_WIDTH / 2 : branchX + CHI_BONUS_X_OFFSET + CHI_BONUS_WIDTH / 2,
                        y: treeY + CHI_BONUS_Y_OFFSET + CHI_BONUS_HEIGHT / 2,
                        scale: 1,
                        opacity: 1
                    };

                    // Animate chiBonus to top center
                    gsap.to(flyingChiBonus.current, {
                        x: window.innerWidth / 2,
                        y: 150,
                        scale: 1.5,
                        duration: 0.5,
                        ease: "power2.out",
                        onComplete: () => {
                            // Fade out and disappear
                            gsap.to(flyingChiBonus.current, {
                                opacity: 0,
                                scale: 2,
                                duration: 0.3,
                                ease: "power2.in",
                                onComplete: () => {
                                    flyingChiBonus.current.active = false;
                                }
                            });
                        }
                    });

                    // Animate character upward
                    gsap.to(characterYOffset, {
                        current: 50, // Move character up by 50 pixels
                        duration: 0.25,
                        ease: "power2.out",
                        onComplete: () => {
                            // Start showing the rest of the animation frames
                            let frame = 1;
                            const frameInterval = setInterval(() => {
                                characterSpriteFrame.current = frame;
                                frame++;
                                SoundManager.play('treePowerUp');
                                if (frame >= CHARACTER_SPRITE_FRAMES) {
                                    clearInterval(frameInterval);

                                    // Animate character back to floor
                                    gsap.to(characterYOffset, {
                                        current: 0,
                                        duration: 0.25,
                                        ease: "power2.in",
                                        onComplete: () => {
                                            // Reset character animation
                                            showCharacterAnimation.current = false;

                                            // Start dust animation
                                            showDustAnimation.current = true;
                                            dustSpriteFrame.current = 0;

                                            let dustFrame = 0;
                                            SoundManager.play('pandaFall')
                                            const dustInterval = setInterval(() => {
                                                dustSpriteFrame.current = dustFrame;
                                                dustFrame++;

                                                if (dustFrame >= DUST_SPRITE_FRAMES) {
                                                    clearInterval(dustInterval);
                                                    showDustAnimation.current = false;

                                                    // Show +100 score animation
                                                    showScoreAnimation.current = true;

                                                    SoundManager.play('treeScoreAdded');

                                                    // Clear previous timer if exists
                                                    if (scoreAnimationTimer.current) {
                                                        clearTimeout(scoreAnimationTimer.current);
                                                    }

                                                    // Hide score animation after 1 second
                                                    scoreAnimationTimer.current = setTimeout(() => {
                                                        showScoreAnimation.current = false;
                                                        isChopping.current = false; // Finally allow chopping again
                                                    }, 800);
                                                }
                                            }, 60); // 8 frames over 0.6 seconds
                                        }
                                    });
                                }
                            }, 90); // 5 frames over 0.6 seconds
                        }
                    });
                } else {
                    // If not hitting on the correct side, just continue without animation
                    setTimeout(() => {
                        isChopping.current = false;
                    }, 40);
                }
            } else if (lowestBranchType === TREE_CHOP_BRANCH_TYPE.TIME_BONUS) {
                isSocketEmitted = true;
                isChopping.current = false;
                scoreRef.current += 1;
                SoundManager.play('treeChiCollect');
                updateCircleTimer(5)
            } else {
                // Regular branch collision - game over
                characterFrame.current = CHARACTER_STATES.GAME_OVER;

                isSocketEmitted = true;
                SoundManager.play('treeChopGameOver');

                setTimeout(() => {
                    characterFrame.current = CHARACTER_STATES.GAME_OVER;
                    setTimeout(async () => {
                        handleEmitGameOverSocket()
                    }, 650);
                }, 100);
            }
        } else {
            isChopping.current = false;
            scoreRef.current += 1;
        }

        const data: ChopTreeArgs = {
            side,
            clientBranchId: lowestBranch.id
        };

        setTimeout(() => {
            characterFrame.current = CHARACTER_STATES.HIT;
        }, 40);

        if (!isSocketEmitted && newBranches.current.length <= 14 && !fetchingMoreBranches.current) {
            fetchMoreBranches(data)
        }

    };



    const handleEmitGameOverSocket = async () => {
        if (gameOverRef.current) {
            return;
        }
        gameOverRef.current = true;

        const clientBranchId = branches.current[visibleParts - (visibleParts - 1)].id as number;
        const dataPacket: ChopTreeArgs = {
            side: TREE_CHOP_BRANCH_POSITION.NONE,
            clientBranchId
        };


        const emitGameOver = () => {
            return new Promise<void>((resolve, reject) => {
                queueMutation(dataPacket, {
                    onSuccess: () => resolve(),
                    onError: (err) => reject(err),
                });
            });
        };

        try {
            await emitGameOver();        // Emit and wait for server response
            await gameOver();            // Then call game over logic
        } catch (err) {
            console.error("Emit failed:", err);
        }
    };


    const gameStartedFlight = useRef<boolean>(false);

    useEffect(() => {
        const startSession = async () => {
            try {
                if (gameStartedFlight.current) return; // TODO: What about this? Check if game works correct with this condtion
                gameStartedFlight.current = true;
                const data = await startTreeChopSession({}, {
                    onSuccess: () => {

                    }
                });

                isGameStarted.current = true;
                scoreRef.current = data.data.score;
                branches.current = data.data.branches;
                newBranches.current = data.data.newBranchesForClient;
                lastUpdateTimerRef.current = performance.now();
                setGameState("started");

            } catch (e) {
                console.error("Session start error:", e);
                setGameState("error");
                showToast({ type: "error", message: "Failed to start game session. Please retry." });
            }
        };

        startSession();

    }, [account?.address])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") chop(TREE_CHOP_BRANCH_POSITION.LEFT);
            if (e.key === "ArrowRight") chop(TREE_CHOP_BRANCH_POSITION.RIGHT);
        };

        const handleTouch = (e: TouchEvent) => {
            const touchX = e.touches[0].clientX;
            const screenMidpoint = window.innerWidth / 2;

            if (touchX < screenMidpoint) {
                chop(TREE_CHOP_BRANCH_POSITION.LEFT);
            } else {
                chop(TREE_CHOP_BRANCH_POSITION.RIGHT);
            }
        };



        window.addEventListener("keydown", handleKeyDown);

        const canvasEl = childCanvasRef.current;
        if (canvasEl) {
            canvasEl.addEventListener("touchstart", handleTouch);
        }

        SoundManager.loadGroup('TreeChopGame');

        const handleVisibilityChange = () => {
            if ((document.hidden || document.visibilityState === "hidden") && !gameOverRef.current) {

                handleEmitGameOverSocket()
            }
        };

        const handleBlur = () => {
            // In some cases (especially on desktop), blur can indicate the user left the window

            handleEmitGameOverSocket()
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);


        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            SoundManager.unloadGroup('TreeChopGame');
            window.removeEventListener("keydown", handleKeyDown);
            if (canvasEl) {
                canvasEl.removeEventListener("touchstart", handleTouch);
            }
        };
    }, [account?.address]);

    return (
        <>
            {/* Show asset-loading screen until useAssetLoader finishes and game starts */}
            {(gameState === 'starting' || !ready) && <SimpleLoadingScreen loading={true} noAnimation={true} />}

            <div className="relative w-full h-screen overflow-hidden bg-sky-500">

                <canvas
                    ref={childCanvasRef}
                    width={window.innerWidth}
                    height={window.innerHeight}
                    className="block w-full h-full"
                />

            </div>
        </>
    );
};

export default TreeChopGameBattle;
