// Pipedream step: handle_feedback (Node.js)
// Saves user feedback to a Google Sheet and confirms in Telegram.
// Accounts (Telegram, Google Sheets) are connected in Pipedream; the spreadsheet ID and
// tab name are entered in the step's fields, so no secrets or IDs are stored in this file.
import { axios } from "@pipedream/platform";

export default defineComponent({
  props: {
    telegram_bot_api: { type: "app", app: "telegram_bot_api" },
    google_sheets: { type: "app", app: "google_sheets" },
    spreadsheet_id: { type: "string", label: "Spreadsheet ID" },
    sheet_name: { type: "string", label: "Sheet (tab) name", default: "Sheet1" },
  },
  async run({ steps, $ }) {
    const message = steps.trigger.event.body.message;
    const text = (message?.text || "").trim();
    const chatId = message?.chat?.id;
    if (!text) return;

    let feedback = null;

    // Case 1: the user replied to the bot's feedback question
    const repliedTo = message?.reply_to_message?.text || "";
    if (repliedTo.startsWith("What feedback would you like to share?") && !text.startsWith("/")) {
      feedback = text;
    }

    // Case 2: "/feedback some text" in one message
    const inline = text.match(/^\/feedback(?:@\w+)?\s+([\s\S]+)/i);
    if (inline) feedback = inline[1].trim();

    // Not feedback: continue to the next steps
    if (!feedback) return;

    const token = this.telegram_bot_api.$auth.token;
    const send = (reply) =>
      axios($, {
        method: "POST",
        url: `https://api.telegram.org/bot${token}/sendMessage`,
        data: { chat_id: chatId, text: reply },
      });

    const row = [
      String(message.from?.id ?? chatId),
      message.from?.username || message.from?.first_name || "unknown",
      feedback,
      new Date().toISOString(),
    ];

    try {
      // RAW keeps user text as plain text (no spreadsheet formulas are evaluated)
      await axios($, {
        method: "POST",
        url: `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheet_id}/values/${encodeURIComponent(this.sheet_name)}:append`,
        params: { valueInputOption: "RAW", insertDataOption: "INSERT_ROWS" },
        headers: { Authorization: `Bearer ${this.google_sheets.$auth.oauth_access_token}` },
        data: { values: [row] },
      });
      await send("Thanks for your feedback! It has been recorded.");
    } catch (err) {
      await send("Sorry, I could not save your feedback right now. Please try again later.");
    }

    $.flow.exit("Feedback handled");
  },
});
