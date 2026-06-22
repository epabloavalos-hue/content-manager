// Script para obtener el chat_id de tu canal de Telegram
// Uso: node get-telegram-id.mjs TU_TOKEN_AQUI

const token = process.argv[2];

if (!token) {
  console.log("\n❌ Falta el token. Úsalo así:");
  console.log("   node get-telegram-id.mjs 7123456789:AAF-xxxxxxxx\n");
  process.exit(1);
}

console.log("\n🔍 Buscando canales donde está tu bot...\n");

const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
const data = await res.json();

if (!data.ok) {
  console.log("❌ Token incorrecto o inválido. Revísalo en BotFather.\n");
  process.exit(1);
}

if (data.result.length === 0) {
  console.log("⚠️  No encontré nada todavía.");
  console.log("   → Ve a tu canal de Telegram y escribe cualquier mensaje.");
  console.log("   → Luego vuelve a correr este script.\n");
  process.exit(0);
}

const chats = new Map();
for (const update of data.result) {
  const chat = update.channel_post?.chat ?? update.message?.chat;
  if (chat && !chats.has(chat.id)) {
    chats.set(chat.id, chat);
  }
}

if (chats.size === 0) {
  console.log("⚠️  No encontré canales.");
  console.log("   → Asegúrate de que el bot es ADMINISTRADOR del canal.");
  console.log("   → Envía un mensaje en el canal y vuelve a correr esto.\n");
  process.exit(0);
}

console.log("✅ ¡Encontré tus canales!\n");
for (const chat of chats.values()) {
  console.log(`📢 Canal: "${chat.title}"`);
  console.log(`   TELEGRAM_CHANNEL_ID="${chat.id}"`);
  console.log("");
}

console.log("👆 Copia el ID de tu canal y pégalo en el archivo .env\n");
