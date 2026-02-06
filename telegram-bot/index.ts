import { Bot, Context, session } from "grammy";
import { claude } from "@anthropic-ai/claude-code";

// ============================================
// CONFIGURATIE
// ============================================

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const ALLOWED_USERS = process.env.ALLOWED_USERS?.split(",").map(Number) || [];
const PROJECT_DIR = process.env.PROJECT_DIR || "/home/user/finance";
const MAX_TURNS = parseInt(process.env.MAX_TURNS || "15");

if (!BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN is niet ingesteld!");
  process.exit(1);
}

if (ALLOWED_USERS.length === 0) {
  console.warn("⚠️ ALLOWED_USERS is leeg - iedereen heeft toegang!");
}

// ============================================
// TOEGESTANE TOOLS (PERMISSIONS)
// ============================================

const ALLOWED_TOOLS = [
  // Bestandsoperaties
  "Read",
  "Write",
  "Edit",
  "Glob",
  "Grep",

  // Veilige bash commands
  "Bash(git *)",
  "Bash(npm *)",
  "Bash(bun *)",
  "Bash(npx *)",
  "Bash(node *)",
  "Bash(cat *)",
  "Bash(ls *)",
  "Bash(pwd)",
  "Bash(which *)",
  "Bash(echo *)",
  "Bash(mkdir *)",
  "Bash(cp *)",
  "Bash(mv *)",
  "Bash(head *)",
  "Bash(tail *)",
  "Bash(wc *)",
  "Bash(curl *)",
  "Bash(jq *)",

  // MCP tools (alle)
  "mcp__*",

  // Web tools
  "WebFetch",
  "WebSearch",

  // Task/Agent tools
  "Task",
  "TodoWrite",
];

// ============================================
// BOT SETUP
// ============================================

const bot = new Bot(BOT_TOKEN);

// Session voor conversation history per user
interface SessionData {
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
}

bot.use(
  session({
    initial: (): SessionData => ({
      conversationHistory: [],
    }),
  })
);

// ============================================
// MIDDLEWARE: AUTH CHECK
// ============================================

bot.use(async (ctx, next) => {
  const userId = ctx.from?.id;

  if (ALLOWED_USERS.length > 0 && !ALLOWED_USERS.includes(userId ?? 0)) {
    console.log(`🚫 Toegang geweigerd voor user ${userId}`);
    await ctx.reply("❌ Je hebt geen toegang tot deze bot.");
    return;
  }

  await next();
});

// ============================================
// HELPER: CLAUDE CODE AANROEPEN
// ============================================

async function askClaude(
  prompt: string,
  ctx: Context & { session: SessionData }
): Promise<string> {
  try {
    // Bouw system prompt met conversation context
    const history = ctx.session.conversationHistory.slice(-10); // laatste 10 berichten
    const contextPrompt = history.length > 0
      ? `Eerdere conversatie:\n${history.map((m) => `${m.role}: ${m.content}`).join("\n")}\n\n`
      : "";

    const response = await claude({
      prompt: contextPrompt + prompt,
      options: {
        maxTurns: MAX_TURNS,
        allowedTools: ALLOWED_TOOLS,
        cwd: PROJECT_DIR,
      },
    });

    // Extract text from response blocks
    const text = response
      .filter((block: any) => block.type === "text")
      .map((block: any) => block.text)
      .join("\n");

    // Update conversation history
    ctx.session.conversationHistory.push(
      { role: "user", content: prompt },
      { role: "assistant", content: text.slice(0, 500) } // keep history compact
    );

    return text || "Geen antwoord ontvangen.";
  } catch (error) {
    console.error("Claude error:", error);
    throw error;
  }
}

// ============================================
// HELPER: LANGE BERICHTEN SPLITSEN
// ============================================

async function sendLongMessage(ctx: Context, text: string) {
  const MAX_LENGTH = 4096;

  if (text.length <= MAX_LENGTH) {
    await ctx.reply(text, { parse_mode: "Markdown" }).catch(() =>
      ctx.reply(text) // fallback zonder markdown als het faalt
    );
    return;
  }

  // Split op newlines waar mogelijk
  const chunks: string[] = [];
  let current = "";

  for (const line of text.split("\n")) {
    if (current.length + line.length + 1 > MAX_LENGTH) {
      chunks.push(current);
      current = line;
    } else {
      current += (current ? "\n" : "") + line;
    }
  }
  if (current) chunks.push(current);

  for (const chunk of chunks) {
    await ctx.reply(chunk, { parse_mode: "Markdown" }).catch(() =>
      ctx.reply(chunk)
    );
    await new Promise((r) => setTimeout(r, 100)); // rate limit
  }
}

// ============================================
// COMMANDO'S
// ============================================

// /start
bot.command("start", async (ctx) => {
  await ctx.reply(`
🤖 **Claude Code Bot**

Ik ben verbonden met Claude Code op de VPS. Je kunt me vragen stellen en ik kan code lezen, schrijven, en uitvoeren.

**Commando's:**
/help - Toon deze help
/clear - Wis conversatie geschiedenis
/status - Toon bot status
/commit - Maak een git commit
/build - Run de build
/test - Run tests

**Of stuur gewoon een bericht!**
  `, { parse_mode: "Markdown" });
});

// /help
bot.command("help", async (ctx) => {
  await ctx.reply(`
📚 **Beschikbare commando's:**

*Algemeen:*
/start - Start de bot
/help - Deze help
/clear - Wis chat geschiedenis
/status - Bot status

*Development:*
/commit [message] - Git commit
/build - Run build
/test - Run tests
/deploy - Deploy naar productie

*Code:*
Stuur gewoon een vraag of opdracht, bijvoorbeeld:
- "Wat doet de login functie?"
- "Fix de bug in api/auth"
- "Voeg een nieuwe endpoint toe"

Ik heb toegang tot de codebase en kan bestanden lezen, schrijven en aanpassen.
  `, { parse_mode: "Markdown" });
});

// /clear - wis conversation history
bot.command("clear", async (ctx) => {
  (ctx as any).session.conversationHistory = [];
  await ctx.reply("🧹 Conversatie geschiedenis gewist.");
});

// /status
bot.command("status", async (ctx) => {
  await ctx.reply(`
✅ **Bot Status**

• Project: \`${PROJECT_DIR}\`
• Max turns: ${MAX_TURNS}
• Allowed users: ${ALLOWED_USERS.length || "iedereen"}
• Uptime: ${Math.floor(process.uptime() / 60)} minuten
  `, { parse_mode: "Markdown" });
});

// /commit [message]
bot.command("commit", async (ctx) => {
  await ctx.replyWithChatAction("typing");

  const message = ctx.match || "Auto-commit via Telegram bot";
  const prompt = `Maak een git commit met de volgende message: "${message}".
Voer eerst git status uit om te zien wat er gecommit moet worden.
Als er niets te committen is, zeg dat dan.`;

  try {
    const response = await askClaude(prompt, ctx as any);
    await sendLongMessage(ctx, response);
  } catch (error) {
    await ctx.reply("❌ Fout bij commit: " + (error as Error).message);
  }
});

// /build
bot.command("build", async (ctx) => {
  await ctx.replyWithChatAction("typing");
  await ctx.reply("🔨 Build gestart...");

  try {
    const response = await askClaude(
      "Run de build command (npm run build of bun run build) en rapporteer het resultaat.",
      ctx as any
    );
    await sendLongMessage(ctx, response);
  } catch (error) {
    await ctx.reply("❌ Build fout: " + (error as Error).message);
  }
});

// /test
bot.command("test", async (ctx) => {
  await ctx.replyWithChatAction("typing");
  await ctx.reply("🧪 Tests gestart...");

  try {
    const response = await askClaude(
      "Run de tests (npm test of bun test) en rapporteer het resultaat.",
      ctx as any
    );
    await sendLongMessage(ctx, response);
  } catch (error) {
    await ctx.reply("❌ Test fout: " + (error as Error).message);
  }
});

// /deploy
bot.command("deploy", async (ctx) => {
  await ctx.replyWithChatAction("typing");

  try {
    const response = await askClaude(
      "Check of er uncommitted changes zijn. Als alles clean is, push naar origin. Geef een status update.",
      ctx as any
    );
    await sendLongMessage(ctx, response);
  } catch (error) {
    await ctx.reply("❌ Deploy fout: " + (error as Error).message);
  }
});

// ============================================
// ALGEMENE BERICHTEN
// ============================================

bot.on("message:text", async (ctx) => {
  const vraag = ctx.message.text;

  // Skip als het een command is
  if (vraag.startsWith("/")) return;

  await ctx.replyWithChatAction("typing");

  try {
    const response = await askClaude(vraag, ctx as any);
    await sendLongMessage(ctx, response);
  } catch (error) {
    console.error("Error:", error);
    await ctx.reply(
      "❌ Er ging iets mis: " + (error as Error).message
    );
  }
});

// ============================================
// ERROR HANDLING
// ============================================

bot.catch((err) => {
  console.error("Bot error:", err);
});

// ============================================
// START
// ============================================

console.log("🚀 Claude Telegram Bot wordt gestart...");
console.log(`📁 Project directory: ${PROJECT_DIR}`);
console.log(`👥 Toegestane users: ${ALLOWED_USERS.length || "iedereen"}`);

bot.start();

console.log("✅ Bot draait!");
