// Pipedream step: command_check (Node.js)
// Reads the incoming Telegram update and detects bot commands such as /start.
export default defineComponent({
  async run({ steps }) {
    const message = steps.trigger.event.body.message;
    const text = message?.text || "";
    const chatId = message?.chat?.id;

    const isCommand = text.startsWith("/");
    const command = isCommand ? text.split(" ")[0].split("@")[0].toLowerCase() : null;

    return { isCommand, command, text, chatId };
  }
});
