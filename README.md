<p align="center">
  <img src="https://i.ibb.co/20NRZbVK/Gemini-Generated-Image-h6n0qih6n0qih6n0-1-1.png" alt="Chop SUI Panda" width="100%" />
</p>

<h1 align="center">Chop SUI Panda</h1>

<p align="center">
  <strong>Arcade games on the Sui blockchain — chop trees, shoot bamboo, battle your frens.</strong>
</p>

<p align="center">
  <a href="https://chop-sui-panda-mqy338s2rdx-prod.cloud.modelence.app">Live App</a>
</p>

---

## What is Chop SUI Panda?

Chop SUI Panda is a mobile-first Web3 arcade game built on the **Sui blockchain**. Players connect their Sui wallet, play fast-paced mini-games, earn **CHI** (the in-game currency), climb leaderboards, and challenge friends to real-time battles — all while interacting with on-chain smart contracts for purchases and rewards.

The panda mascot guides you through everything.

---

## Games

### Tree Chop
A reflex-based chopping game rendered entirely with the **HTML5 Canvas API**. Tap to chop the tree while dodging branches — score as high as you can before you're knocked out.

### Bamboo Shoot
A knife-throwing arcade game powered by **Phaser 4**. Launch bamboo shoots at a spinning target without hitting an existing shoot. Difficulty scales with your score.

Both games share server-side session management, anti-cheat validation, and a continue system that costs CHI.

---

## Features

| Feature | Description |
|---|---|
| **Frens System** | Add friends via wallet address or QR code, view their profiles, and send battle challenges |
| **Battle Mode** | Challenge a fren to a head-to-head match on either game — wager CHI, winner takes all |
| **Weekly Leaderboard** | Compete for top ranks each week; tiered CHI rewards scale with total player count |
| **CHI Shop** | Purchase CHI with SUI via on-chain transactions to continue games, wager in battles, or upgrade levels |
| **Reward Chests** | Open Treasure and Royal chests for a chance to win CHI or SUI |
| **Daily Login Streak** | Log in each day to earn escalating rewards across a 7-day cycle |
| **Level Progression** | Spend CHI to level up and unlock new games (Tree Chop at Lv1, Bamboo Shoot at Lv2) |
| **Real-time Notifications** | In-game notification channel for battle invites, friend requests, and chest results |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Modelence](https://modelence.com) — full-stack app framework (server, client, DB, channels, crons, deploy) |
| **Frontend** | React 18, React Router, Zustand, GSAP, Tailwind CSS |
| **Tree Chop Game** | Pure JavaScript Canvas API |
| **Bamboo Shoot Game** | Phaser 4 |
| **Blockchain** | Sui (Testnet) — `@mysten/sui`, `@mysten/dapp-kit-react` |
| **Smart Contract** | Move (`chopsui::game`) — handles SUI payments, treasury, and Ed25519 signature verification |
| **Server** | Modelence modules with Express, JWT auth, Zod validation |
| **Audio** | Howler.js |
| **Build** | Vite 8, TypeScript, PostCSS |

---

## Project Structure

```
chopsuipanda/
├── src/
│   ├── client/                  # React frontend
│   │   ├── assets/              # Game sprites, icons, sounds
│   │   ├── components/          # Navbar, loading spinner, QR code, toasts
│   │   ├── context/             # React context providers
│   │   ├── hooks/               # Custom hooks (player, sui, battles)
│   │   ├── pages/
│   │   │   ├── screens/
│   │   │   │   ├── GameScreens/       # TreeChopGame, BambooShootGame, GameOver
│   │   │   │   ├── BattleScreens/     # Battle variants of both games
│   │   │   │   ├── HomeScreen.tsx      # Main hub with wallet connect
│   │   │   │   ├── FrensScreen.tsx     # Friend list & requests
│   │   │   │   ├── LeaderboardScreen.tsx
│   │   │   │   ├── ShopScreen.tsx      # CHI purchase via SUI
│   │   │   │   └── EarnScreen.tsx      # Daily streak & chests
│   │   │   └── modals/                # Battle, Frens, DailyStreak, Inbox modals
│   │   ├── store/               # Zustand stores (player, gameplay)
│   │   └── utils/               # Sound manager, helpers
│   ├── server/                  # Modelence server modules
│   │   ├── modules/
│   │   │   ├── chopsuipandaModule.ts   # Game sessions, score calc, continue logic
│   │   │   ├── playersModule.ts        # Player CRUD, levels, CHI, chests
│   │   │   ├── battleMatchModule.ts    # Battle matchmaking & resolution
│   │   │   ├── friendshipModule.ts     # Friend requests & management
│   │   │   ├── suiModule.ts            # On-chain transaction verification
│   │   │   ├── weeklyRewardModule.ts   # Leaderboard reward distribution
│   │   │   └── configModule.ts         # Server config
│   │   ├── crons/               # Weekly leaderboard reset & reward payout
│   │   └── migrations/          # DB seed scripts
│   └── shared/                  # Shared between client & server
│       ├── constants/           # Game types, level config, chest tiers, shop items
│       ├── schemas/             # Zod validation schemas
│       └── utils/
├── SUI_SMART_CONTRACT/          # Move smart contract
│   └── sources/
│       └── chopsui.move         # Payment processing, treasury, signature verification
├── modelence.config.ts
├── package.json
└── vite.config.ts
```

---

## Smart Contract

The `chopsui::game` Move module on Sui handles:

- **`paySUI`** — Accepts SUI payments for CHI purchases, validates exact amounts, collects fees into the contract's balance
- **`transfer_to_treasury`** — Withdraws collected fees to the treasury address, gated by Ed25519 signature verification
- **`update_public_key` / `update_treasury_address`** — Owner-only admin functions

The contract uses a shared `GameState` object to track the treasury address, collected fees, and the verification public key.

---

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm
- A Sui wallet (e.g., Sui Wallet browser extension)

### Install & Run

```bash
# Install dependencies
pnpm install

# Start dev server (frontend + backend)
pnpm dev
```

The app runs on Modelence's dev server with hot reload. No separate frontend/backend setup needed.

### Deploy

```bash
# Build for production
pnpm build

# Deploy via Modelence
pnpm start
```

The production app is hosted on [Modelence Cloud](https://modelence.com).

---

## Environment Variables

Configure `.modelence.env` with:

| Variable | Purpose |
|---|---|
| `SUI_PRIVATE_KEY` | Server-side key for signing treasury transfers |
| `JWT_SECRET` | Auth token signing |
| `GAME_STATE_ID` | Shared object ID of the deployed Move contract |
| `PACKAGE_ID` | Published package ID on Sui |

---

## License

This project was built for the Sui hackathon.
