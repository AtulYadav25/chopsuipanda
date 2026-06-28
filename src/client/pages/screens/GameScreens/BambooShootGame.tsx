import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { gsap } from 'gsap';
import SoundManager from '@/client/utils/SoundManager';
import { useCurrentAccount } from '@mysten/dapp-kit-react';
import { useAssetLoader } from '@/client/assets/useAssetLoader';
import { bambooShootGameAssets } from '@/client/assets';
import { useBambooShootSessionStart, useContinueGame, useEndGameSession, useThrowBamboo } from '@/client/hooks/chopsuipanda';
import { GameSession } from '@/server/modules/stores/types';
import { useToast } from '@/client/context/ToastContext';
import gameEventClientChannel, { onGameMessage } from '@/client/channels/gameEventClientChannel';
import GameOverScreen from './GameOverScreen';
import SimpleLoadingScreen from '../childScreens/SimpleLoadingScreen';
import { usePlayerStore } from '@/client/store/usePlayerStore';

// Game options
const gameOptions = {
    rotationSpeed: 3,
    throwSpeed: 150,
    minAngle: 10,
    rotationVariation: 1.6,
    changeTime: 2000,
    maxRotationSpeed: 5,
    rotationLerpFactor: 3
};

interface PlayGameInitData {
    BambooShootGroupRef: any;
    levelRef: React.MutableRefObject<NonNullable<GameSession['bambooShootLevelData']>>;
    walletAddress: string;
    gameOverRef: any;
    handleGameOver: any;
    socket: any;
    playerScore: React.MutableRefObject<number>;
    throwBamboo: any;
    assets: any;
}

class AppleSprite extends Phaser.GameObjects.Sprite {
    startAngle: number = 0;
    hit: boolean = false;
}

class BambooSprite extends Phaser.GameObjects.Sprite {
    impactAngle: number = 0;
}

// PlayGame scene
class PlayGame extends Phaser.Scene {

    // Declare all properties
    BambooShootGroupRef!: any;
    levelRef!: React.MutableRefObject<NonNullable<GameSession['bambooShootLevelData']>>;
    walletAddress!: string;
    gameOverRef!: any;
    isTransitioning!: boolean;
    BambooDisplaySizeWidth!: number;
    BambooDisplaySizeHeight!: number;
    handleGameOver!: () => Promise<void>;
    socket!: any;
    playerScore!: React.MutableRefObject<number>;
    isEmitInProgress!: boolean;
    emitQueue!: { appleAngles: number[], targetAngle: number[] }[];
    assets!: any;
    throwBambooMutation!: any;

    //Not Init Declarations
    gameWidth!: number;
    gameHeight!: number;

    currentRotationSpeed!: number;
    newRotationSpeed!: number;
    canThrow!: boolean;
    bambooGroup!: Phaser.GameObjects.Group;
    isGameReady!: boolean;

    _speedIndex = 0;

    scoreShadowTexts!: Phaser.GameObjects.Text;
    scoreText!: Phaser.GameObjects.Text;

    bamboo!: BambooSprite;
    target!: Phaser.GameObjects.Sprite;
    apples!: AppleSprite[];
    speedChangeTimer!: Phaser.Time.TimerEvent | null;


    remainingBamboos!: Phaser.GameObjects.Group;

    constructor() {
        super("PlayGame");
    }

    init(data: PlayGameInitData) {
        this.BambooShootGroupRef = data.BambooShootGroupRef;
        this.levelRef = data.levelRef;
        this.walletAddress = data.walletAddress;
        this.gameOverRef = data.gameOverRef;
        this.isTransitioning = false;
        this.BambooDisplaySizeWidth = 16;
        this.BambooDisplaySizeHeight = 110;
        this.handleGameOver = data.handleGameOver;
        this.socket = data.socket;
        this.playerScore = data.playerScore;
        this.isEmitInProgress = false;
        this.emitQueue = [];
        this.assets = data.assets;
        this.throwBambooMutation = data.throwBamboo
    }

    preload() {
        if (this.levelRef.current!.boss && this.levelRef.current!.boss.score !== 0) {
            const bossLevel = this.levelRef.current!.level;
            const bossImagePath = new URL(`../../../assets/knife_boss/boss${bossLevel}.webp`, import.meta.url).href;
            this.load.image(`boss${bossLevel}`, bossImagePath);
        } else {
            this.load.image("defaultTarget", this.assets.target);
        }
        this.load.image("knife", this.assets.knife);
        this.load.image("background", this.assets.background);
        this.load.spritesheet("apple", this.assets.apple, {
            frameWidth: 70,
            frameHeight: 96
        });

        // Set up texture filtering for all loaded textures
        this.load.on('complete', () => {
            this.setTextureFilters();
        });
    }


    setTextureFilters() {
        // Set LINEAR filtering for smooth rendering while maintaining quality
        const textureKeys = ['background', 'knife', 'defaultTarget', 'apple'];
        textureKeys.forEach(key => {
            if (this.textures.exists(key)) {
                this.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
            }
        });

        // Set boss texture filters if they exist
        if (this.levelRef.current.boss && this.levelRef.current.boss.score !== 0) {
            const bossLevel = this.levelRef.current.level;
            if (this.textures.exists(`boss${bossLevel}`)) {
                this.textures.get(`boss${bossLevel}`).setFilter(Phaser.Textures.FilterMode.LINEAR);
            }
        }
    }

    create() {

        // Store camera dimensions first
        this.gameWidth = this.cameras.main.width;
        this.gameHeight = this.cameras.main.height;

        // Get actual canvas size from the scale manager
        const width = this.scale.width;
        const height = this.scale.height;

        // Add background image and resize it to fit full screen
        const bg = this.add.image(0, 0, 'background').setOrigin(0, 0);
        bg.displayWidth = width;
        bg.displayHeight = height;

        // Add gradient background
        // const graphics = this.add.graphics();

        // graphics.fillGradientStyle(0x536976, 0x536976, 0x292E49, 0x292E49, 1);
        // graphics.fillRect(0, 0, this.gameWidth, this.gameHeight);
        // graphics.setDepth(1); // Set to negative depth to ensure it's behind everything


        this.currentRotationSpeed = gameOptions.rotationSpeed;
        this.newRotationSpeed = gameOptions.rotationSpeed;
        this.canThrow = false; // Start with throwing disabled
        this.bambooGroup = this.add.group();
        this.BambooShootGroupRef.current = this.bambooGroup;
        this.isGameReady = false;

        this._speedIndex = 0;

        // Create score display
        // Coordinates for the score display
        const scoreX = 20;
        const scoreY = 20;

        // Score text styles
        const labelFont = 'bold 24px Game';
        const valueFont = 'bold 32px Game';
        const shadowColor = '#555555';
        const mainLabelColor = '#FFFFFF';
        const mainValueColor = '#FFD700';

        // Score label shadow (4 copies offset for soft shadow)
        for (let i = 1; i <= 4; i++) {
            this.add.text(scoreX + i, scoreY + i, "SCORE", {
                font: labelFont,
                color: shadowColor,
                resolution: 2
            }).setDepth(3);
        }

        // Main score label
        this.add.text(scoreX, scoreY, "SCORE", {
            font: labelFont,
            color: mainLabelColor,
            resolution: 2
        }).setDepth(4);

        // Value shadow (4 copies offset)
        const valueY = scoreY + 30;
        for (let i = 1; i <= 4; i++) {
            this.scoreShadowTexts = this.add.text(scoreX + i, valueY + i, '0', {
                font: valueFont,
                color: shadowColor,
                resolution: 2
            }).setDepth(3);
        }

        // Main value text (store reference to update later)
        this.scoreText = this.add.text(scoreX, valueY, '0', {
            font: valueFont,
            color: mainValueColor,
            resolution: 2
        }).setDepth(4);

        // Create remaining Bamboos display
        this.createRemainingBamboosDisplay();

        // Bamboo setup
        this.bamboo = new BambooSprite(this, this.gameWidth / 2, this.gameHeight / 5 * 4, "knife");
        this.add.existing(this.bamboo);
        this.bamboo.setDisplaySize(this.BambooDisplaySizeWidth, this.BambooDisplaySizeHeight);

        // Target setup
        let initialTargetTextureKey = "defaultTarget";
        if (this.levelRef.current.boss && this.levelRef.current.boss.score !== 0) {
            const bossLevel = this.levelRef.current.level;
            const bossImagePath = new URL(`../../../assets/knife_boss/boss${bossLevel}.webp`, import.meta.url).href;
            this.load.image(`boss${bossLevel}`, bossImagePath);
            this.load.start(); // Start loading the image immediately
            initialTargetTextureKey = `boss${bossLevel}`;
        }
        this.target = this.add.sprite(this.gameWidth / 2, this.gameHeight / 4, initialTargetTextureKey);
        this.target.setDisplaySize(this.gameWidth / 1.95, this.gameWidth / 1.95);
        this.target.depth = 2;

        // Initialize empty arrays for apples and Bamboos
        this.apples = [];

        // Input and speed change logic
        this.input.on("pointerdown", this.throwBamboo, this);

        // Don't start the speed change timer until game is ready
        this.speedChangeTimer = null;

        // Start the game immediately after setup
        this.startGame();


        // Create a small blue circle texture for particles if not already present
        if (!this.textures.exists('appleParticle')) {
            const graphics = this.make.graphics({ x: 0, y: 0 });
            graphics.fillStyle(0x25acd9, 1);
            graphics.fillCircle(8, 8, 8);
            graphics.generateTexture('appleParticle', 16, 16);
            graphics.destroy();
        }
    }

    startGame() {
        this.isGameReady = true;
        this.canThrow = true;
        this.isTransitioning = false;

        // Setup initial game objects
        this.setupApples();
        this.addPreAttachedBamboos();

        // Start speed change timer
        if (this.speedChangeTimer) {
            this.speedChangeTimer.remove();
        }

        this.speedChangeTimer = this.time.addEvent({
            delay: (this.levelRef.current.changeTime || 2) * 1000,
            callback: this.changeSpeed,
            callbackScope: this,
            args: [this.levelRef.current.variation],
            loop: true
        });

    }

    clearGameObjects() {
        // Clear apples
        this.apples.forEach(apple => apple.destroy());
        this.apples = [];

        // Clear Bamboos
        this.bambooGroup.clear(true, true);
    }

    transitionToNewLevel() {
        this.bamboo.y = this.gameHeight / 5 * 4;
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        this.canThrow = false;


        // Store references to objects before animation
        const apples = [...this.apples];
        const bamboos = this.bambooGroup.getChildren().slice();

        // Update target image for new level
        if (this.levelRef.current.boss && this.levelRef.current.boss.score !== 0) {
            const bossLevel = this.levelRef.current.level;
            const bossImagePath = new URL(`../../../assets/knife_boss/boss${bossLevel}.webp`, import.meta.url).href;
            this.load.image(`boss${bossLevel}`, bossImagePath);
            this.load.start(); // Start loading the image immediately
            this.load.once(Phaser.Loader.Events.COMPLETE, () => {
                this.target.setTexture(`boss${bossLevel}`);
                // Set filter for the new boss texture
                if (this.textures.exists(`boss${bossLevel}`)) {
                    this.textures.get(`boss${bossLevel}`).setFilter(Phaser.Textures.FilterMode.LINEAR);
                }
            });
        } else {
            this.target.setTexture('defaultTarget');
        }


        // Store original target scale
        const originalScale = this.target.scale;

        // Stop any existing animations
        gsap.killTweensOf(this.target);
        apples.forEach(apple => gsap.killTweensOf(apple));
        bamboos.forEach(bamboo => gsap.killTweensOf(bamboo));

        // Create a container for all objects to animate
        const container = this.add.container(0, 0);
        container.setDepth(1);

        // Add all objects to the container
        apples.forEach(apple => {
            if (apple && apple.active) {
                container.add(apple);
            }
        });

        // Create new sprites for Bamboos instead of reusing old ones
        bamboos.forEach(bamboo => {
            if (bamboo) {
                const sprite = bamboo as Phaser.GameObjects.Sprite;
                const newBamboo = this.add.sprite(sprite.x, sprite.y, 'knife');
                newBamboo.setDisplaySize(this.BambooDisplaySizeWidth, this.BambooDisplaySizeHeight);
                newBamboo.angle = sprite.angle;
                newBamboo.rotation = sprite.rotation;
                container.add(newBamboo);
            }
        });

        // Clear any existing objects
        if (this.apples) {
            this.apples.forEach(apple => {
                if (apple && apple.active) {
                    apple.destroy();
                }
            });
        }
        this.apples = [];

        if (this.bambooGroup) {
            this.bambooGroup.clear(true, true);
        }

        // Start both animations simultaneously
        const timeline = gsap.timeline();

        // Pulse animation for target
        timeline.to(this.target, {
            scaleX: originalScale * 0.75,
            scaleY: originalScale * 0.75,
            duration: 0.16,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut"
        }, 0);

        // Fall animation for all objects
        // Fall animation for all objects
        const objects = container.getAll();
        objects.forEach(obj => {
            if (!obj || !obj.active) return;

            const go = obj as Phaser.GameObjects.Sprite;

            const rotations = ((Math.random() * 2) + 3);
            const randomX = (Math.random() * 200) * ((Math.random() < 0.5) ? -1 : 1);
            const randomY = this.gameHeight + Math.random() * 200;

            timeline.to(go, {
                alpha: 0.5,
                y: go.y - 10,
                ease: "power1.out",
                duration: 0.15,
            }, 0);

            timeline.to(go, {
                alpha: 1,
                y: go.y,
                ease: "power1.in",
                duration: 0.1,
            }, 0.15);

            timeline.to(go, {
                y: randomY,
                x: go.x + randomX,
                rotation: `+=${rotations}`,
                duration: 0.5,
                ease: "power2.in",
                onStart: () => {
                    go.setActive(true);
                    go.setVisible(true);
                }
            }, 0.3);
        });



        // After all animations complete
        timeline.call(() => {
            // Destroy the container and all its children
            container.destroy();
            // Reset target scale to original
            this.target.setScale(originalScale);
            // Clear the groups after animation
            this.apples = [];
            this.bambooGroup.clear(true, true);
            // Setup new level
            // Check if this is a boss level
            if (this.levelRef.current.boss && this.levelRef.current.boss.type !== null) {
                this.showBossLevelAnimation(() => {
                    // Setup new level after boss animation completes
                    this.setupNewLevel();
                });
            } else {
                // Setup new level directly if not a boss level
                this.setupNewLevel();


            }
        });
    }


    // Add new method to show boss level animation
    showBossLevelAnimation(callback: () => void) {

        // Create semi-transparent black overlay
        const overlay = this.add.rectangle(
            this.gameWidth / 2,
            this.gameHeight / 2,
            this.gameWidth,
            this.gameHeight,
            0x000000,
            0.5
        );
        overlay.setDepth(10);
        overlay.alpha = 0;

        // Create BOSS LEVEL text
        const bossText = this.add.text(
            this.gameWidth / 2,
            this.gameHeight / 2,
            'BOSS LEVEL',
            {
                fontSize: '64px',
                fontFamily: 'Game',
                color: '#ff0000', //Replaced fill with color
                stroke: '#ffffff',
                strokeThickness: 4,
                resolution: 2
            }
        );
        bossText.setOrigin(0.5);
        bossText.setDepth(11);
        bossText.setScale(5);
        bossText.alpha = 0;

        SoundManager.play('knifeBossEntry');
        // Create animation timeline
        const timeline = gsap.timeline({
            onComplete: () => {
                overlay.destroy();
                bossText.destroy();
                if (callback) callback();
            }
        });

        // Fade in overlay
        timeline.to(overlay, {
            alpha: 1,
            duration: 0.3,
            ease: "power2.in"
        });

        // Fade in and scale text
        timeline.to(bossText, {
            alpha: 1,
            scale: 0.7,
            duration: 0.4,
            ease: "back.out"
        }, 0.2);

        // Rebound to final scale
        timeline.to(bossText, {
            scale: 0.9,
            duration: 0.3,
            ease: "power1.out"
        }, 0.6);

        // Hold for a moment
        timeline.to({}, {
            duration: 0.7
        });

        // Fade out everything
        timeline.to([overlay, bossText], {
            alpha: 0,
            duration: 0.3,
            ease: "power2.out"
        });
    }


    // Add new method to show boss defeated animation
    showBossDefeatedAnimation(callback: () => void) {

        // Create semi-transparent black overlay
        const overlay = this.add.rectangle(
            this.gameWidth / 2,
            this.gameHeight / 2,
            this.gameWidth,
            this.gameHeight,
            0x000000,
            0.5
        );
        overlay.setDepth(10);
        overlay.alpha = 0;

        // Create BOSS DEFEATED text
        const defeatedText = this.add.text(
            this.gameWidth / 2,
            this.gameHeight / 2,
            'BOSS DEFEATED',
            {
                fontSize: '64px',
                fontFamily: 'Game',
                color: '#00ff00', //Replaced fill with color (TODO) it could be backgroundColor
                resolution: 2
            }
        );
        defeatedText.setOrigin(0.5);
        defeatedText.setDepth(11);
        defeatedText.setScale(0.5);
        defeatedText.alpha = 0;

        // Create animation timeline
        const timeline = gsap.timeline({
            onComplete: () => {
                overlay.destroy();
                defeatedText.destroy();
                if (callback) callback();
            }
        });

        // Fade in overlay
        timeline.to(overlay, {
            alpha: 1,
            duration: 0.3,
            ease: "power2.in"
        });

        // Fade in and scale text with a shaking effect
        timeline.to(defeatedText, {
            alpha: 1,
            scale: 0.7,
            duration: 0.4,
            ease: "back.out"
        }, 0.2);

        // Add shake animation
        timeline.to(defeatedText, {
            x: `+=${5}`,
            yoyo: true,
            repeat: 5,
            duration: 0.05,
            ease: "none"
        }, 0.6);

        // Hold for a moment
        timeline.to({}, {
            duration: 0.5
        });

        // Fade out everything
        timeline.to([overlay, defeatedText], {
            alpha: 0,
            duration: 0.3,
            ease: "power2.out"
        });
    }




    setupNewLevel() {

        // Reset game state
        this.isGameReady = true;
        this.canThrow = true;
        this.isTransitioning = false;

        // Clear any existing objects
        if (this.apples) {
            this.apples.forEach(apple => {
                if (apple && apple.active) {
                    apple.destroy();
                }
            });
        }
        this.apples = [];

        if (this.bambooGroup) {
            this.bambooGroup.clear(true, true);
        }

        // Setup new game objects
        this.setupApples();
        this.addPreAttachedBamboos();

        // Update speed change timer
        if (this.speedChangeTimer) {
            this.speedChangeTimer.remove();
        }

        this.speedChangeTimer = this.time.addEvent({
            delay: (this.levelRef.current.changeTime || 2) * 1000,
            callback: this.changeSpeed,
            callbackScope: this,
            args: [this.levelRef.current.variation],
            loop: true
        });

        this.updateRemainingBambooDisplay();
    }

    //Used to update score for client
    updateScore(score: number) {
        this.playerScore.current += score;
        this.scoreText.setText(`${this.playerScore.current}`);
    }

    //Function called when socket.on is for new-level or continue, this sets the score that is received from the backend data
    updateFullScore(score: number) {
        this.playerScore.current = score;
        this.scoreText.setText(`${this.playerScore.current}`);
    }

    setupApples() {
        if (!this.levelRef.current || this.levelRef.current.apples.length === 0) {
            return;
        }

        this.apples = [];
        const appleAngles = this.levelRef.current.apples;

        appleAngles.forEach(appleAngle => {
            if (typeof appleAngle !== 'number') {
                return;
            }

            const radians = Phaser.Math.DegToRad(appleAngle - 90);
            const apple = new AppleSprite(
                this,
                this.target.x + (this.target.displayWidth / 2) * Math.cos(radians),
                this.target.y + (this.target.displayWidth / 2) * Math.sin(radians),
                "apple"
            );

            this.add.existing(apple);
            apple.setOrigin(0.5, 1);
            apple.angle = appleAngle;
            apple.startAngle = appleAngle;
            apple.depth = 1;
            apple.hit = false;

            // Scale apple relative to target
            const appleOriginalWidth = 70;
            const appleOriginalHeight = 96;
            const appleTargetWidth = this.target.displayWidth * 0.3;
            const appleTargetHeight = appleTargetWidth * (appleOriginalHeight / appleOriginalWidth);
            apple.setDisplaySize(appleTargetWidth, appleTargetHeight);

            this.apples.push(apple);
        });
    }

    createRemainingBamboosDisplay() {
        const bambooSize = 30;
        const spacing = 10;
        const startX = 50;
        const startY = this.gameHeight - 50;

        this.remainingBamboos = this.add.group();

        for (let i = 0; i < this.levelRef.current.throwableBamboos; i++) {
            const bamboo = this.add.sprite(
                startX,
                startY - (i * (bambooSize + spacing)),
                'knife'
            );
            bamboo.setDisplaySize(10, 60);
            bamboo.setAngle(45);
            this.remainingBamboos.add(bamboo);
        }
    }

    updateRemainingBambooDisplay() {
        const remainingCount = this.levelRef.current.throwableBamboos;
        const children = this.remainingBamboos.getChildren();

        for (let i = 0; i < children.length; i++) {
            (children[i] as Phaser.GameObjects.Sprite).setVisible(i < remainingCount);
        }
    }

    changeSpeed(speedSequence: number[] | null = null) {
        // Check if valid, non-empty array is provided
        const isValidSequence = Array.isArray(speedSequence) && speedSequence.length > 0;

        if (isValidSequence) {
            // If single-element array, always use that speed
            if (speedSequence.length === 1) {
                this.newRotationSpeed = speedSequence[0];
            } else {
                // Initialize static index tracker if not already
                if (!this._speedIndex) this._speedIndex = 0;

                // Cycle through sequence
                this.newRotationSpeed = speedSequence[this._speedIndex % speedSequence.length];
                this._speedIndex++;
            }
        } else {
            // Use default random logic
            const variation = Phaser.Math.FloatBetween(
                -gameOptions.rotationVariation,
                gameOptions.rotationVariation
            );
            const sign = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
            this.newRotationSpeed = (this.currentRotationSpeed + variation) * sign;

            // Clamp the result
            this.newRotationSpeed = Phaser.Math.Clamp(
                this.newRotationSpeed,
                -gameOptions.maxRotationSpeed,
                gameOptions.maxRotationSpeed
            );
        }
    }



    addPreAttachedBamboos() {
        if (this.levelRef.current.preAttachedBamboos.length === 0) {
            return;
        }
        const bambooAngles = this.levelRef.current.preAttachedBamboos;

        bambooAngles.forEach(angle => {
            this.throwBambooManually(angle);
        });

        // this.isGameReady = true;
    }

    throwBambooManually(impactAngle: number) {

        const bamboo = new BambooSprite(this, this.bamboo.x, this.bamboo.y, "knife");
        this.add.existing(bamboo);

        // const bamboo = this.add.sprite(this.bamboo.x, this.bamboo.y, "knife");
        bamboo.impactAngle = impactAngle + 180;
        bamboo.angle = impactAngle + 180;
        bamboo.setDisplaySize(this.BambooDisplaySizeWidth, this.BambooDisplaySizeHeight);
        this.bambooGroup.add(bamboo);

    }


    // Now let's update the throwBamboo method to include the boss defeated animation
    throwBamboo() {
        if (!this.isGameReady || !this.canThrow || this.isTransitioning) {
            return;
        }

        if (this.levelRef.current.throwableBamboos > 0) {
            this.canThrow = false;
            this.levelRef.current.throwableBamboos--;
            this.updateRemainingBambooDisplay();
            SoundManager.play('BambooShootHit');
            gsap.to(this.bamboo, {
                y: this.target.y + this.target.displayWidth / 2,
                duration: gameOptions.throwSpeed / 1000,
                ease: "power2.in",
                onComplete: async () => {
                    let legalHit = true;
                    const children = this.bambooGroup.getChildren();
                    for (let i = 0; i < children.length; i++) {
                        const child = children[i] as BambooSprite;
                        if (child.angle > -(gameOptions.minAngle) && child.angle < gameOptions.minAngle) {
                            legalHit = false;
                            break;
                        }
                    }

                    const targetCurrentAngle = this.target.angle




                    if (legalHit) {
                        this.handleBambooAttachment(targetCurrentAngle);
                        this.handleAppleHitsAndSocket();
                        if (this.levelRef.current.throwableBamboos === 0 &&
                            this.levelRef.current.boss &&
                            this.levelRef.current.boss.type !== null) {
                            // Show boss defeated animation before emitting socket event
                            // Continue with the rest of the game logic

                            this.showBossDefeatedAnimation(async () => {
                                this.bamboo.y = this.gameHeight / 5 * 4;
                                SoundManager.play('bambooShootBossDefeat');
                            });
                        } else {
                            this.updateScore(1);
                        }
                    } else {

                        // Stop all animations and game updates
                        this.isGameReady = false;
                        gsap.killTweensOf(this.target);
                        this.handleBambooAttachment(targetCurrentAngle, true);
                        this.apples.forEach(apple => gsap.killTweensOf(apple));
                        this.bambooGroup.getChildren().forEach(bamboo => gsap.killTweensOf(bamboo));



                        // Prepare the data
                        const data = this.getThrowBambooData();


                        SoundManager.play('bambooShootHitOver');
                        gsap.to(this.bamboo, {
                            y: this.gameHeight + this.bamboo.height,
                            rotation: 5,
                            duration: gameOptions.throwSpeed * 4 / 1000,
                            ease: "power2.in",
                            onComplete: async () => {
                                // Add it to the queue
                                this.emitQueue.push(data);

                                await this.handleGameOver();
                            }
                        });
                    }
                }
            });
        }
    }

    // Helper methods to avoid code duplication
    handleAppleHitsAndSocket() {
        let isAppleHitting = false;


        // Prepare the data
        const data = this.getThrowBambooData();

        this.apples.forEach(apple => {
            if (!apple.hit && (180 - Math.abs(apple.angle)) < (gameOptions.minAngle + 5)) {
                apple.hit = true;
                isAppleHitting = true;
                SoundManager.play('BambooShootHitSui');
                apple.setFrame(1);
                apple.setOrigin(0.5, 0.5);
                apple.setScale(1);
                this.updateScore(5);
                // --- PARTICLE EXPLOSION EFFECT (Phaser 3.60+) ---
                const emitter = this.add.particles(apple.x, apple.y, 'appleParticle', {
                    speed: { min: 120, max: 220 },
                    angle: { min: 0, max: 360 },
                    scale: { start: 1, end: 0 },
                    alpha: { start: 1, end: 0 },
                    lifespan: 500,
                    quantity: 20,
                    blendMode: 'ADD',
                    gravityY: 300,
                    duration: 100 // ms, short burst
                });
                emitter.on('complete', () => emitter.destroy());
                // --- END PARTICLE EFFECT ---

                const slice = this.add.sprite(apple.x, apple.y, "apple", 2);
                slice.angle = apple.angle;
                slice.setOrigin(0.5, 0.5);
                slice.setScale(1);

                const randomX1 = Phaser.Math.Between(-this.gameWidth / 2, 0);
                const randomX2 = Phaser.Math.Between(0, this.gameWidth / 2);

                gsap.to(apple, {
                    y: this.gameHeight + apple.height,
                    x: apple.x + randomX1,
                    rotation: 3,
                    duration: 1,
                    ease: "power2.in"
                });

                gsap.to(slice, {
                    y: this.gameHeight + slice.height,
                    x: slice.x + randomX2,
                    rotation: 3,
                    duration: 1,
                    ease: "power2.in",
                    onComplete: () => {
                        slice.destroy();
                    }
                });
            }
        });


        if (isAppleHitting || this.levelRef.current.throwableBamboos === 0) {


            // Add it to the queue
            this.emitQueue.push(data);

            // Start processing if not already
            if (!this.isEmitInProgress) {
                this.processEmitQueue();
            }

        }
    }

    async processEmitQueue() {
        if (this.isEmitInProgress) return;

        this.isEmitInProgress = true;
        while (this.emitQueue.length > 0) {
            const data = this.emitQueue.shift();
            try {
                await this.throwBambooMutation(data);
            } catch (err) {
                console.error("throwBamboo mutation failed:", err);
            }
        }
        this.isEmitInProgress = false;
    }

    // Resolves once the emit queue is fully drained, whether or not
    // processing was already in-flight from another call site.
    waitForEmitQueueToClear(): Promise<void> {
        return new Promise((resolve) => {
            const check = () => {
                if (!this.isEmitInProgress && this.emitQueue.length === 0) {
                    resolve();
                } else {
                    setTimeout(check, 50);
                }
            };
            check();
        });
    }

    getThrowBambooData(): {
        appleAngles: number[],
        targetAngle: number[]
    } {
        const newBamboochildren = this.bambooGroup.getChildren() as Phaser.GameObjects.Sprite[];
        const allNewBamboosAngles = newBamboochildren.map((obj) => obj.angle);
        return {
            targetAngle: allNewBamboosAngles,
            appleAngles: this.apples
                .filter(apple => !apple.hit)
                .map(apple => apple.angle)
        };
    }


    shakeTarget() {
        const timeline = gsap.timeline();
        const shakeIntensity = 5;

        // Move target up
        timeline.to(this.target, {
            y: `-=${shakeIntensity}`,
            duration: 0.05,
            ease: "power2.inOut"
        });

        // Move target back to original position
        timeline.to(this.target, {
            y: `+=${shakeIntensity}`,
            duration: 0.05,
            ease: "power2.inOut"
        });
    }


    handleBambooAttachment(targetAngle: number, gameOver = false) {
        this.canThrow = true;
        const bamboo = new BambooSprite(this, this.bamboo.x, this.bamboo.y, "knife");
        this.add.existing(bamboo);
        bamboo.impactAngle = targetAngle;
        bamboo.setDisplaySize(this.BambooDisplaySizeWidth, this.BambooDisplaySizeHeight);
        this.bambooGroup.add(bamboo);
        if (gameOver === true) {
            return
        }
        this.bamboo.y = this.gameHeight / 5 * 4;
        this.shakeTarget();
    }

    update(_: number, delta: number) {
        if (!this.isGameReady) {
            return;
        }

        if (!this.isTransitioning) {
            this.target.angle += this.currentRotationSpeed;
        }
        const children = this.bambooGroup.getChildren();

        for (let i = 0; i < children.length; i++) {
            const child = children[i] as Phaser.GameObjects.Sprite;
            child.angle += this.currentRotationSpeed;
            const radians = Phaser.Math.DegToRad(child.angle + 90);
            child.x = this.target.x + (this.target.displayWidth / 2) * Math.cos(radians);
            child.y = this.target.y + (this.target.displayWidth / 2) * Math.sin(radians);
            child.setDisplaySize(this.BambooDisplaySizeWidth, this.BambooDisplaySizeHeight);
        }

        this.apples.forEach(apple => {
            if (!apple.hit) {
                apple.angle += this.currentRotationSpeed;
                const radians = Phaser.Math.DegToRad(apple.angle - 90);
                apple.x = this.target.x + (this.target.displayWidth / 2) * Math.cos(radians);
                apple.y = this.target.y + (this.target.displayWidth / 2) * Math.sin(radians);
            }
        });

        this.currentRotationSpeed = Phaser.Math.Linear(
            this.currentRotationSpeed,
            this.newRotationSpeed,
            gameOptions.rotationLerpFactor * delta / 1000
        );
    }
}

const BambooShootGame = ({ handleEndGame }: {
    handleEndGame: () => void;
}) => {

    //Asset Loader
    const { assets, ready } = useAssetLoader(bambooShootGameAssets)

    const [levelData, setLevelData] = useState<GameSession['bambooShootLevelData']>();
    const [retryGame, setRetryGame] = useState(0);
    const [showGameOver, setShowGameOver] = useState(false);
    const [gameOverData, setGameOverData] = useState<{
        score: number,
        chi: number
    }>({
        score: 0,
        chi: 0
    });
    const [apiLoading, setApiLoading] = useState({
        loading: false,
        to: ''
    });

    const gameRef = useRef(null);
    const gameInstanceRef = useRef<Phaser.Game | null>(null);
    const BambooShootGroupRef = useRef(null);
    const playerScoreRef = useRef<number>(0);
    const [isGameInitialized, setIsGameInitialized] = useState(false);
    const numOfContinues = useRef<number>(0);
    const gameEndTimeStamp = useRef<number>(Date.now());


    //Hooks
    const account = useCurrentAccount();


    //Mutations & Queries
    const { mutateAsync: startBambooGameSession } = useBambooShootSessionStart();
    const { mutateAsync: throwBamboo } = useThrowBamboo();
    const { mutateAsync: handleEndGameSession } = useEndGameSession();
    const { mutateAsync: continueGameSession } = useContinueGame();

    //Store Data
    const player = usePlayerStore((s) => s.player)

    const gameOverRef = useRef(false);


    const levelRef = useRef<GameSession['bambooShootLevelData']>({
        level: 0,
        apples: [],
        preAttachedBamboos: [],
        variation: [],
        throwableBamboos: 2,
        changeTime: 2,
        boss: {
            name: "",
            type: "",
            score: 0,
        }
    });

    const gameOver = async () => {
        if (gameOverRef.current === true) {
            return
        }

        setApiLoading({
            loading: true,
            to: 'gameEndSession'
        });

        gameEndTimeStamp.current = Date.now();
        gameOverRef.current = true;
        setShowGameOver(true);

        // 2. Drain the emit queue before ending the session
        const scene = gameInstanceRef.current?.scene.getScene("PlayGame") as PlayGame | undefined;
        if (scene) {
            if (scene.isEmitInProgress) {
                await scene.waitForEmitQueueToClear();
            } else if (scene.emitQueue.length > 0) {
                await scene.processEmitQueue();
            }
        }

        await handleEndGameSession({}, {
            onSuccess: (data) => {
                setGameOverData({
                    score: data.data.score,
                    chi: data.data.chi
                })
                setApiLoading({
                    loading: false,
                    to: ''
                });
            },
            onError: (err) => {
                setApiLoading({
                    loading: false,
                    to: ''
                });
                showToast({
                    type: "error",
                    message: err.message
                });
            }
        });
    }


    //Toast Context
    const { showToast } = useToast();

    useEffect(() => {
        gameOverRef.current = showGameOver;
    }, [showGameOver])


    // TODO NOW: I think because of this account changing it is always joining and leaving the channel so instead take from player.waleltAddress
    useEffect(() => {
        if (!player?.walletAddress) return;

        const roomKey = player.walletAddress.toLowerCase();
        gameEventClientChannel.joinChannel(roomKey)

        return () => {
            gameEventClientChannel.leaveChannel(roomKey);
        };
    }, [player?.walletAddress]);


    const gameStartSessionFlightRef = useRef(false);

    useEffect(() => {
        const loadLevelData = async () => {
            if (gameStartSessionFlightRef.current) {
                return;
            }
            gameStartSessionFlightRef.current = true;
            const data = await startBambooGameSession({}, {
                onSuccess: () => {

                }
            });

            setLevelData(data.bambooShootLevelData);
            levelRef.current = data.bambooShootLevelData;
            playerScoreRef.current = data.bambooShootScore || 0;
            setIsGameInitialized(true);
            gameStartSessionFlightRef.current = false;
        }

        loadLevelData();

        SoundManager.loadGroup('BambooShoot')

        const handleVisibilityChange = async () => {
            if ((document.hidden || document.visibilityState === "hidden") && !gameOverRef.current) {
                await gameOver();
            }
        };

        const handleBlur = async () => {
            if (gameOverRef.current) {
                return
            }
            // In some cases (especially on desktop), blur can indicate the user left the window
            await gameOver();

        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);


        // Clean up socket listeners
        return () => {
            SoundManager.unloadGroup('BambooShoot')
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);

        };
    }, []);


    useEffect(() => {
        const unsub = onGameMessage((msg) => {
            if (msg.type === 'newLevel') {
                setLevelData(msg.session.bambooShootLevelData);
                playerScoreRef.current = msg.session.bambooShootScore!;
                levelRef.current = msg.session.bambooShootLevelData;

                const scene = gameInstanceRef.current?.scene?.scenes[0];
                if (scene instanceof PlayGame) {
                    scene.transitionToNewLevel();
                }
            } else if (msg.type === 'continueGame') {
                showToast({ type: "success", message: "Game Continued!" });
                gameOverRef.current = false;
                setLevelData(msg.session.bambooShootLevelData);
                playerScoreRef.current = msg.session.bambooShootScore!;
                levelRef.current = msg.session.bambooShootLevelData;

                const scene = gameInstanceRef.current?.scene?.scenes[0];
                if (scene instanceof PlayGame) {
                    scene.transitionToNewLevel();
                }
            }
        });
        return unsub;
    }, []);

    useEffect(() => {
        if (!isGameInitialized || !levelData || !ready) {
            return;
        }

        const config = {
            type: Phaser.CANVAS,
            backgroundColor: 0x536976,
            parent: gameRef.current,
            scene: [PlayGame],
            scale: {
                mode: Phaser.Scale.RESIZE, // 👈 Auto-resizes to fit full screen
                autoCenter: Phaser.Scale.CENTER_BOTH,
            },
            render: {
                pixelArt: false, // Disable pixel art mode for smooth rendering
                antialias: true, // Enable antialiasing for smooth edges
                resolution: window.devicePixelRatio || 1, // 👈 Ensures crisp on Retina/high-DPI
                roundPixels: false, // Allow sub-pixel rendering for smooth movement
                powerPreference: 'default'
            }
        };

        const game = new Phaser.Game(config);
        gameInstanceRef.current = game;

        // Pass refs to the scene
        game.scene.start("PlayGame", {
            BambooShootGroupRef: BambooShootGroupRef,
            levelRef,
            walletAddress: account?.address,
            gameOverRef: gameOverRef,
            handleGameOver: gameOver,
            playerScore: playerScoreRef,
            throwBamboo,
            assets
        });

        const handleResize = () => {
            game.scale.resize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            game.destroy(true);
            window.removeEventListener('resize', handleResize);
        };
    }, [isGameInitialized, ready, retryGame]);

    const handleRetryGame = async () => {
        numOfContinues.current = 0;

        try {

            const loadLevelData = async () => {
                if (gameStartSessionFlightRef.current) {
                    return;
                }
                gameStartSessionFlightRef.current = true;
                const data = await startBambooGameSession({}, {
                    onSuccess: () => {
                    }
                });
                levelRef.current = data.bambooShootLevelData;
                setLevelData(data.bambooShootLevelData);
                playerScoreRef.current = data.bambooShootScore || 0;
                gameStartSessionFlightRef.current = false;
            }

            await loadLevelData();

            setShowGameOver(false);
            setRetryGame((prev) => prev + 1);
        } catch (err) {
            console.error("Emit failed:", err);
            return; // stop here if socket fails
        }

    };


    const handleContinueGameBtn = async () => {
        let timeDiff = (Date.now() - gameEndTimeStamp.current) / 1000;
        if (timeDiff > 30) {
            showToast({ type: "info", message: "Time's up! You can try again. Give it your best!" });
            return;
        }

        if (numOfContinues.current > 10) {
            showToast({ type: "info", message: "You used your max chances, Try Again!" });
            return;
        }

        setApiLoading({
            loading: true,
            to: 'continue'
        });

        try {
            await continueGameSession({}, {
                onSuccess: () => {
                    setShowGameOver(false);
                    numOfContinues.current += 1;
                    setApiLoading({ loading: false, to: '' });
                },
                onError: (err) => {

                    showToast({ type: "error", message: err.message });
                    setApiLoading({ loading: false, to: '' });
                }
            });
        } catch (e) {
            setApiLoading({ loading: false, to: '' });
        }
    };

    return (
        <>
            {!isGameInitialized && (
                <SimpleLoadingScreen loading={true} noAnimation={true} />
            )}

            {showGameOver && (
                <GameOverScreen
                    onContinue={handleContinueGameBtn}
                    apiLoading={apiLoading}
                    onExit={handleEndGame}
                    onRetry={handleRetryGame}
                    score={gameOverData?.score || 0}
                    chi={gameOverData?.chi || 0}
                    numOfContinues={numOfContinues.current}
                />
            )}

            <div
                ref={gameRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    imageRendering: 'auto', // Use auto for smooth rendering
                }}
            />


        </>
    );
};

export default BambooShootGame;