# Shame.lol — Clippy’s Revenge: Trinity Swarm

![Vercel](https://there.is/this/badge.svg)

Shame.lol is a GoT‑themed execution platform for Microsoft chaos:

* 17 duplicate decks rotting in OneDrive? **SHAME.**
* PRDs where Legal quietly stripped ethics? **SHAME.**
* Tickets that survived 400 “any update?” pings? **SHAME.**

Three dragons (agents) and one Valyrian sword (orchestrator) fuse your Microsoft mess into an immutable, signed `.shame` file the whole org can’t unsee.

---

## What it does

Paste **any** Microsoft‑adjacent chaos:

* Deck link / pasted slide text
* PRD fragment / spec blob
* Azure DevOps / Jira / ServiceNow ticket URL or thread

Hit the giant blood‑red **SHAME** button. The Trinity Swarm:

1. Hunts down real artifacts via Graph (decks, PRDs, tickets).
2. Builds a ground‑truth timeline (versions, comments, approvals, blame).
3. Calls Claude 3.5 Sonnet via OpenRouter to write a GoT‑grade roast.
4. Signs the result and lets you download an immutable `.shame` markdown file.

Result: **verifiable, hilarious, shareable execution log** for your favorite Microsoft disaster.

---

## Agents

### 🐉 Valyria Agent — Deck Duplicates

> “The North remembers your copies, Satya does not.”

* Given deck text/link, searches OneDrive/Teams/Loop for dupes.
* Scores canonical deck by recency, viewers, meeting metadata.
* Returns:

  * `truth.canonical` — the real deck.
  * `truth.duplicates` — the graveyard.
  * `roast` — “17 copies burn, Satya saw this one.”

### 🚶 Walk Agent — PRD Clause Walk of Shame

> “Legal walked naked deleting ethics.”

* Given PRD/spec fragment, pulls versions from Word/Teams/PDF/email.
* Builds a change tree: who deleted what, when.
* Returns:

  * `truth.changes` — version‑by‑version blame.
  * `truth.owners` — Entra IDs for each edit.
  * `roast` — regulatory horror story in markdown.

### 🔔 Bell Agent — Undead Ticket Exorcist

> “400 pings, intern #312 saved you.”

* Given ticket URL/comments, fetches linked PRs + comment thread.
* Extracts the buried resolution and closure payload.
* Returns:

  * `truth.resolution` — the actual fix and link.
  * `truth.timeline` — who pinged vs who shipped.
  * `roast` — why this ticket should be framed in the war room.

### ❄️ Longclaw Orchestrator — Ground Truth Sword

> “One artifact to rule the chaos.”

* Detects chaos type (deck/PRD/ticket).
* Fans out to Valyria / Walk / Bell.
* Fuses receipts into a single `.shame` document:

  * `truth` — canonical + versions + resolution.
  * `roast` — fused GoT narration + receipts.
  * Signable JSON + markdown for cold storage.

---

## Stack

* **Frontend**: Vite 5, React 18, TypeScript, Tailwind v4, Framer Motion, Lucide.
* **AI**: Claude 3.5 Sonnet via OpenRouter.
* **Microsoft data**: `@microsoft/microsoft-graph-client` (token via MSAL, Day 7).
* **Runtime**: Vercel edge functions for `/api/*`.
* **Tests**: Vitest + jsdom.

---

## Getting started

### 1. Install

```bash
git clone https://github.com/you/shame-lol.git
cd shame-lol
npm install
```

### 2. Environment

Copy the example env and drop in your OpenRouter key:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
VITE_OPENROUTER_API_KEY=sk-your-openrouter-key
```

Key comes from [openrouter.ai](https://openrouter.ai).

### 3. Dev server

```bash
npm run dev
```

Open: `http://localhost:5173`

You should see:

* Jon Snow vs dragon hero image
* Giant blood‑red **SHAME** button
* Three golden bells
* Chaos textarea
* “dragon roars…” loader
* Execution log panel + `.shame` download

---

## Usage

1. **Paste**:

   * Deck link / pasted slide text
   * PRD clause / spec chunk
   * Ticket URL or full comment dump

2. **Hit `SHAME`**:

   * Dragon roar plays.
   * Bells toll in sequence.
   * Agents run + orchestrator fuses.

3. **Read the execution**:

   * Top: chaos you fed the dragon (fenced block).
   * Middle: ground‑truth sections (canonical deck, change tree, resolution).
   * Bottom: savage GoT‑style roast with receipts.

4. **Download `.shame`**:

   * Click **download .shame**.
   * You get `shame-<timestamp>.shame.md` — immutable markdown for PRs, tickets, or all‑hands.

---

## Scripts

```bash
# dev
npm run dev

# typecheck + build
npm run build

# tests (agents + orchestrator)
npm test

# lint (TS/React)
npm run lint
```

---

## Deploy

Local build works? Time to embarrass some tenants.

### Vercel

1. Install Vercel CLI:

   ```bash
   npm i -g vercel
   ```

2. Deploy:

   ```bash
   vercel
   vercel --prod
   ```

3. Set env on Vercel:

   * `VITE_OPENROUTER_API_KEY` → same key as `.env`.

Vercel picks up:

* Vite frontend.
* Edge functions from `/api/*`.

One command, one URL, instant corporate trial by fire.

---

## Notes

* **Graph auth**: wired for token injection (MSAL Entra login) but can run in mock mode for demos.
* **Caching**: agents + orchestrator cache in `localStorage` to avoid re‑hitting Graph for the same chaos.
* **Safety**: no PII logs, all heavy data stays tenant‑side; `.shame` files are just markdown + IDs.

---

## License

MIT.

If this project gets you fired for roasting a VP’s 19th “FINAL_v19.pptx”, that’s between you and HR.
