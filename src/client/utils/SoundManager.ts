import { Howl, Howler } from 'howler';

// TreeChopGame group
import pandaMove from '../assets/audio/TreeChopGame/pandaMove.mp3';
import treeChiCollect from '../assets/audio/TreeChopGame/treeChiCollect.mp3';
import treeChop from '../assets/audio/TreeChopGame/treeChop.mp3';
import treeChopGameOver from '../assets/audio/TreeChopGame/treeChopGameOver.mp3';
import treePowerUp from '../assets/audio/TreeChopGame/treePowerUp.mp3';
import treeScoreAdded from '../assets/audio/TreeChopGame/treeScoreAdded.mp3';
import pandaFall from '../assets/audio/TreeChopGame/pandaFall.mp3';

// KnifeHit group
import BambooShootBossEntry from '../assets/audio/KnifeHit/knifeBossEntry.mp3';
import BambooShootBossDefeat from '../assets/audio/KnifeHit/knifeBossDefeat.mp3';
import BambooShootHit from '../assets/audio/KnifeHit/knifeHit.mp3';
import BambooShootHitOver from '../assets/audio/KnifeHit/knifeHitOver.mp3';
import BambooShootHitSui from '../assets/audio/KnifeHit/knifeHitSui.wav';

// Global group
import bgm from '../assets/audio/bgm.mp3';
import chestOpen from '../assets/audio/chestOpen.mp3';
import chiPurchase from '../assets/audio/chiPurchase.mp3';
import menuSwitch from '../assets/audio/menuSwitch.mp3';
import notification from '../assets/audio/notification.wav';

type SoundName = keyof typeof soundList;
type GroupName = 'TreeChopGame' | 'BambooShoot' | 'Global';

interface SoundConfig {
    src: string[];
    volume: number;
    group: GroupName;
    loop?: boolean;
}

const soundList: Record<string, SoundConfig> = {
    // TreeChopGame group
    pandaMove: { src: [pandaMove], volume: 0.7, group: 'TreeChopGame' },
    treeChiCollect: { src: [treeChiCollect], volume: 0.7, group: 'TreeChopGame' },
    treeChop: { src: [treeChop], volume: 0.7, group: 'TreeChopGame' },
    treeChopGameOver: { src: [treeChopGameOver], volume: 0.8, group: 'TreeChopGame' },
    treePowerUp: { src: [treePowerUp], volume: 0.8, group: 'TreeChopGame' },
    treeScoreAdded: { src: [treeScoreAdded], volume: 0.7, group: 'TreeChopGame' },
    pandaFall: { src: [pandaFall], volume: 0.7, group: 'TreeChopGame' },

    //BambooShootGame group
    BambooShootBossEntry: { src: [BambooShootBossEntry], volume: 0.8, group: 'BambooShoot' },
    BambooShootBossDefeat: { src: [BambooShootBossDefeat], volume: 0.8, group: 'BambooShoot' },
    BambooShootHit: { src: [BambooShootHit], volume: 0.7, group: 'BambooShoot' },
    BambooShootHitOver: { src: [BambooShootHitOver], volume: 0.9, group: 'BambooShoot' },
    BambooShootHitSui: { src: [BambooShootHitSui], volume: 0.8, group: 'BambooShoot' },


    // Global group
    bgm: { src: [bgm], volume: 0.8, group: 'Global', loop: true },
    chestOpen: { src: [chestOpen], volume: 1.0, group: 'Global' },
    chiPurchase: { src: [chiPurchase], volume: 1.0, group: 'Global' },
    menuSwitch: { src: [menuSwitch], volume: 1.0, group: 'Global' },
    notification: { src: [notification], volume: 1.0, group: 'Global' },
};

const sounds: Partial<Record<SoundName, Howl>> = {};
const soundGroups: Partial<Record<GroupName, SoundName[]>> = {};
let wasBGMPlaying = false;

const initAudio = (): void => {
    Object.entries(soundList).forEach(([key, options]) => {
        sounds[key as SoundName] = new Howl(options);
        const group = options.group;
        if (!soundGroups[group]) soundGroups[group] = [];
        soundGroups[group]!.push(key as SoundName);
    });
};

export default {
    initAudio,
    play: (name: SoundName): void => {
        sounds[name]?.play();
        if (name === 'bgm') wasBGMPlaying = true;
    },
    stop: (name: SoundName): void => {
        sounds[name]?.stop();
    },
    stopAll: (): void => {
        wasBGMPlaying = sounds['bgm']?.playing() ?? false;
        Howler.stop();
    },
    resumeBGMIfWasPlaying: (): void => {
        if (wasBGMPlaying && sounds['bgm']) {
            sounds['bgm'].play();
            wasBGMPlaying = false;
        }
    },
    muteAll: (): void => { Howler.mute(true); },
    unmuteAll: (): void => { Howler.mute(false); },
    loadGroup: (groupName: GroupName): void => {
        Object.entries(soundList).forEach(([key, options]) => {
            if (options.group === groupName && !sounds[key as SoundName]) {
                sounds[key as SoundName] = new Howl(options);
                if (!soundGroups[groupName]) soundGroups[groupName] = [];
                soundGroups[groupName]!.push(key as SoundName);
            }
        });
    },
    unloadGroup: (groupName: GroupName): void => {
        soundGroups[groupName]?.forEach((key) => {
            sounds[key]?.unload();
            delete sounds[key];
        });
        delete soundGroups[groupName];
    },
};