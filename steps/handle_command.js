// Pipedream step: handle_command (Node.js)
// Replies to bot commands and stops the workflow so the AI step does not also answer.
// The Telegram Bot API account is connected in Pipedream (no token is stored in this file).
import { axios } from "@pipedream/platform";

export default defineComponent({
  props: {
    telegram_bot_api: {
      type: "app",
      app: "telegram_bot_api",
    },
  },
  async run({ steps, $ }) {
    const { isCommand, command, chatId } = steps.command_check.$return_value;

    // Normal message: continue to the AI steps
    if (!isCommand) return;

    const replies = {
      "/start":
        "Hello! I am your personal AI assistant. I can answer questions, summarize text, translate messages, and help you brainstorm ideas. Type /help to see all available commands.",
      "/help":
        "I can help you with:\n- Answering questions\n- Summarizing text\n- Translating messages\n- Brainstorming ideas\nUse /features to see all features, /reset to clear our conversation, and /feedback to share your thoughts.",
      "/reset":
        "Conversation reset. Send me a new message to start fresh.",
    };

    const text = replies[command] || "This command is not available yet.";
    const token = this.telegram_bot_api.$auth.token;

    await axios($, {
      method: "POST",
      url: `https://api.telegram.org/bot${token}/sendMessage`,
      data: { chat_id: chatId, text },
    });

    // Stop here so the AI steps do not also answer the command
    $.flow.exit("Command handled");
  },
});
