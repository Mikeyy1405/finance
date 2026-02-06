# Claude Code Telegram Bot

Telegram bot die Claude Code headless draait met volledige toegang tot de codebase.

## Setup

### 1. Bun installeren (als je dat nog niet hebt)

```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. Dependencies installeren

```bash
cd telegram-bot
bun install
```

### 3. Telegram Bot aanmaken

1. Open Telegram en zoek naar `@BotFather`
2. Stuur `/newbot`
3. Kies een naam en username
4. Kopieer de bot token

### 4. Environment variables instellen

```bash
cp env.template .env
```

Edit `.env` met je waardes:
- `TELEGRAM_BOT_TOKEN` - van BotFather
- `ALLOWED_USERS` - jouw Telegram user ID (krijg je via @userinfobot)
- `PROJECT_DIR` - pad naar je project

### 5. Claude Code inloggen

Zorg dat je ingelogd bent met Claude Code:

```bash
claude login
```

### 6. Bot starten

```bash
bun start
```

Of met auto-reload tijdens development:

```bash
bun dev
```

### 7. Persistent draaien met tmux

```bash
tmux new -s telegram-bot
bun start
# Ctrl+B, dan D om te detachen
# tmux attach -t telegram-bot om terug te keren
```

## Commando's

| Commando | Beschrijving |
|----------|-------------|
| `/start` | Start bericht |
| `/help` | Toon help |
| `/clear` | Wis chat geschiedenis |
| `/status` | Bot status |
| `/commit [msg]` | Git commit |
| `/build` | Run build |
| `/test` | Run tests |
| `/deploy` | Push naar origin |

Of stuur gewoon een bericht met je vraag/opdracht.

## MCP Servers toevoegen

Edit `.claude/settings.json` om MCP servers toe te voegen:

```json
{
  "mcpServers": {
    "database": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://..."
      }
    }
  }
}
```

## Permissions aanpassen

In `.claude/settings.json` kun je de `allow` en `deny` lists aanpassen om te bepalen welke tools Claude mag gebruiken.
