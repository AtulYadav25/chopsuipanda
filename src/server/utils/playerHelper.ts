import { dbPlayers } from "../modules/stores/playerStore";


const LETTERS = "ABCEGYZUPQRTSFDHJKLNMWXV";

export const generateUniqueUsername = async (): Promise<string> => {
    const MAX_ATTEMPTS = 20;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const username = `PANDA${Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, "0")}${LETTERS[Math.floor(Math.random() * LETTERS.length)]
            }`;
        const lowerUsername = username.toLowerCase();

        const existingUsername = await dbPlayers.findOne({ usernameLower: lowerUsername });

        if (!existingUsername) {
            return username;
        }
    }

    throw new Error(
        "Failed to generate a unique username after multiple attempts."
    );
};



