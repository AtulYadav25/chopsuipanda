export const MIST_PER_SUI = 1_000_000_000;

export const suiToMist = (sui: number): number =>
    Math.round(sui * MIST_PER_SUI);

export const mistToSui = (mist: number): number =>
    mist / MIST_PER_SUI;