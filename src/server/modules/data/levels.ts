// src/server/data/levels.ts
//
// Move your existing BossLevels data here unchanged — this file's content
// wasn't included in what you shared, so this is a placeholder with the
// same shape bambooGame.ts expects (an array indexed by boss number).
//
// Example shape based on usage in the original code:
// BossLevels[(stage / 5) - 1] is read whenever stage is a multiple of 5.

import type { BambooShootLevelData } from '../stores/types';

export const BossLevels: BambooShootLevelData[] = [
    {
        "level": 1,
        "apples": [
            0,
            45,
            90,
            135,
            180,
            225,
            270
        ],
        "preAttachedBamboos": [

        ],
        "variation": [1.6, -1],
        "throwableBamboos": 10,
        "changeTime": 1.8,
        "boss": {
            "name": "Kernel J",
            "type": "EPIC",
            "score": 25
        }
    },
    {
        "level": 2,
        "apples": [90, 250],
        "preAttachedBamboos": [30, 60, 270, 330],
        "throwableBamboos": 10,
        "changeTime": 1.3,
        "boss": {
            "name": "Boss1",
            "type": "Epic",
            "score": 30
        }
    },
    {
        "level": 3,
        "apples": [],
        "preAttachedBamboos": [30, 60, 90, 120, 150],
        "throwableBamboos": 6,
        "changeTime": 2.4,
        "boss": {
            "name": "Boss2",
            "type": "LEGENDARY",
            "score": 30
        }
    },
    {
        "level": 4,
        "apples": [0, 80],
        "preAttachedBamboos": [30, 180],
        "throwableBamboos": 8,
        "changeTime": 2,
        "boss": {
            "name": "Boss3",
            "type": "RARE",
            "score": 30
        }
    },
    {
        "level": 5,
        "apples": [100],
        "preAttachedBamboos": [0, 60],
        "throwableBamboos": 7,
        "changeTime": 2.2,
        "boss": {
            "name": null,
            "type": null,
            "score": 30
        }
    },
    {
        "level": 6,
        "apples": [100],
        "preAttachedBamboos": [0, 60],
        "throwableBamboos": 7,
        "changeTime": 2.2,
        "boss": {
            "name": null,
            "type": null,
            "score": 30
        }
    }
];