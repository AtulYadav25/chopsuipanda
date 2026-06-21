// src/hooks/useAssetLoader.ts

import { useEffect, useState } from "react";

const assetCache = new Map<string, string>();

export function useAssetLoader(assetMap: Record<string, () => Promise<any>>) {
    const [assets, setAssets] = useState<Record<string, string>>({});
    const [progress, setProgress] = useState(0);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const keys = Object.keys(assetMap);
        let loaded = 0;

        const promises = keys.map(async (key) => {
            // ✅ Cache check is inside the effect, per key
            if (assetCache.has(key)) {
                loaded++;
                setProgress(Math.round((loaded / keys.length) * 100));
                return [key, assetCache.get(key)!] as const;
            }

            const mod = await assetMap[key]();
            const url = mod.default;

            // ✅ Store in cache for future calls
            assetCache.set(key, url);

            loaded++;
            setProgress(Math.round((loaded / keys.length) * 100));
            return [key, url] as const;
        });

        Promise.all(promises).then((entries) => {
            setAssets(Object.fromEntries(entries));
            setReady(true);
        });
    }, [assetMap]); // ✅ assetMap in deps

    return { assets, progress, ready };
}