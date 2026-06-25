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
    chi: () => import('./chi.webp'),
    sui: () => import('./suicoin3.png'),
    chopsuiPandaLogo: () => import('./home/chopPanda.webp'),
    suiBackground: () => import('./suiBackground.webp'),
    suiPandaLoading: () => import('./coinsmash.webp'),
    sadPanda: () => import('./home/sadPanda.webp'),
    happyPanda: () => import('./home/happyPanda.webp'),
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
    closedChest: () => import('./MenuPage/closedChest.webp'),
    chest: () => import('./MenuPage/chest.webp')
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
    bambooShootGameLogo: () => import('./home/miniKnife.webp'),
    treeChopGameLogo: () => import('./home/miniChop.webp'),
    bambooShootGameBg: () => import('./home/knifeH.webp'),
    treeChopBg: () => import('./home/treeChop.webp'),
};

// ─── Tutorial Screens ─────────────────────────────────────────────────────────
// Tree-chop tutorial
export const treeChopTutorialAssets = {
    tut1: () => import('./tutorial/TreeGame/treeTutor1.png'),
    tut2: () => import('./tutorial/TreeGame/treeTutor2.png'),
    tut3: () => import('./tutorial/TreeGame/treeTutor3.png'),
};

// BambooShoot tutorial
export const bambooShootTutorialAssets = {
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

// Game Assets
export const treeChopGameAssets = {
    treeImage: () => import('./timber/tree.png'),
    branchImage: () => import('./timber/branch.png'),
    characterImage: () => import('./timber/character.png'),
    backgroundImage: () => import('./timber/back4.webp'),
    chiBonus: () => import('./chi.webp'),
    timeBonus: () => import('./timeBonus.png'),
    dustSpriteAnimation: () => import('./timber/characterDustSprite.png'),
    floorImage: () => import('./timber/floor.webp'),
}

export const bambooShootGameAssets = {
    target: () => import('./knife_boss/target.png'),
    knife: () => import('./knife_boss/knife.png'),
    apple: () => import('./knife_boss/apple.png'),
    background: () => import('./knife_boss/background.webp'),
}

//Battle Assets
export const battleAssets = {
    battleBackground: () => import('./GameBackgroundMob/challengeBackground.webp'),
    battlePanda: () => import('./GameBackgroundMob/challengepanda.webp')
}


//Game Over
export const gameOverAssets = {
    gameOverBoard: () => import('./timber/gameOver.webp'),
    scrollImage: () => import('./timber/scroll.webp'),
}

//Panda Loading Assets
export const pandaLoadingAssets = {
    suiBackground: () => import('./suiBackground.webp'),
    suiPandaLoading: () => import('./coinsmash.webp'),
    TempleBackground: () => import('./MenuPage/frensBackground.webp'),
}