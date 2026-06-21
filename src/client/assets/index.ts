// src/assets/images.ts
// All assets are lazy-loaded via dynamic imports.
// Usage: const { default: img } = await homeAssets.shop();

// ─── Core (tiny / always needed on first paint) ──────────────────────────────
export const coreAssets = {
    mainBackground: () => import('./Dark_mob2.jpg'),
    panda: () => import('./ori_panda2.png'),
};

// ─── Home Game Page ───────────────────────────────────────────────────────────
export const homeAssets = {
    shop: () => import('./home/shop.webp'),
    frens: () => import('./home/frens.webp'),
    play: () => import('./home/play.webp'),
    earn: () => import('./home/earn.webp'),
    leaderboard: () => import('./home/leaderboard.webp'),
    navbarBackground: () => import('./home/navbar.webp'),
};

// ─── Intro + Loading Screen ───────────────────────────────────────────────────
export const introAssets = {
    chiBar: () => import('./chi.webp'),
    chopsuiPandaLogo: () => import('./home/chopPanda.webp'),
    suiBackground: () => import('./suiBackground.webp'),
    suiPandaLoading: () => import('./coinsmash.webp'),
};

// ─── Menu / Icon Bar ─────────────────────────────────────────────────────────
export const menuIconAssets = {
    mailIcon: () => import('./MenuPage/mail.webp'),
    swordIcon: () => import('./MenuPage/sword.webp'),
    volumeIcon: () => import('./MenuPage/volume.webp'),
    dailyStreakIcon: () => import('./MenuPage/dailystreak.webp'),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationAssets = {
    challengeNotification: () => import('./home/challengerequest.webp'),
    pandaHead: () => import('./MenuPage/pandahead.webp'),
};

// ─── Earn Page ────────────────────────────────────────────────────────────────
export const earnAssets = {
    earnBackground: () => import('./MenuPage/earn.webp'),
    suiChest: () => import('./MenuPage/suiChest.webp'),
    chiChest: () => import('./MenuPage/chiChest.webp'),
    suiWeek: () => import('./MenuPage/suiweek.webp'),
};

// ─── Frens Page ───────────────────────────────────────────────────────────────
export const frensAssets = {
    frensBackground: () => import('./MenuPage/frensBackground.webp'),
    pandaHead: () => import('./MenuPage/pandahead.webp'),
};

// ─── Shop Page ────────────────────────────────────────────────────────────────
export const shopAssets = {
    shopScroll: () => import('./MenuPage/shopScroll.webp'),
    shopBackground: () => import('./MenuPage/shopBack.webp'),
};

// ─── Game Mode Selection ──────────────────────────────────────────────────────
export const gameModeAssets = {
    miniSlash: () => import('./home/miniSlash.webp'),
    miniKnife: () => import('./home/miniKnife.webp'),
    miniChop: () => import('./home/miniChop.webp'),
    knifeGame: () => import('./home/knifeH.webp'),
    treeChop: () => import('./home/treeChop.webp'),
};

// ─── Tutorial Screens ─────────────────────────────────────────────────────────
// Tree-chop tutorial
export const treeTutorialAssets = {
    tut1: () => import('./tutorial/TreeGame/treeTutor1.png'),
    tut2: () => import('./tutorial/TreeGame/treeTutor2.png'),
    tut3: () => import('./tutorial/TreeGame/treeTutor3.png'),
};

// Knife-hit tutorial
export const knifeTutorialAssets = {
    tut1: () => import('./tutorial/BambooGame/knifetutor1.png'),
    tut2: () => import('./tutorial/BambooGame/knifetutor2.png'),
    tut3: () => import('./tutorial/BambooGame/knifetutor3.png'),
};

// ─── Temple / Background variants ────────────────────────────────────────────
export const templeAssets = {
    templeBackground: () => import('./MenuPage/frensBackground.webp'),
};

// ─── Leaderboard Page ─────────────────────────────────────────────────────────
export const leaderboardAssets = {
    goldTrophy: () => import('./MenuPage/trophy1.webp'),
    silverTrophy: () => import('./MenuPage/secondplace.webp'),
    bronzeTrophy: () => import('./MenuPage/thirdplace.webp'),
};