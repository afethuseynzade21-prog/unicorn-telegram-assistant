# Telegram AI Assistant with Commands and Feedback (Pipedream + OpenRouter + Google Sheets)

A Telegram bot that answers messages with a free large language model, supports structured commands, and collects user feedback in a Google Sheet. It is built without a server: Telegram sends each message to a Pipedream workflow, which handles commands, saves feedback, or asks an OpenRouter free model for an answer.

This project is part of the Holberton "BYO AI Assistant on Telegram" series (Part 4: Adding Commands).

## Commands

Registered with BotFather (`/setcommands`):

```
start - Welcome message and brief overview
help - What your bot can do
features - List of bot features
reset - Reset the conversation context
feedback - Leave feedback
```

| Command | Status | Behavior |
|---|---|---|
| `/start` | Done | Welcome message |
| `/help` | Done | Short list of what the bot can do |
| `/features` | Done | Fixed (hardcoded) list of capabilities. No AI call, so the answer is instant. |
| `/reset` | Done (message only) | Confirms a fresh start. The bot does not store conversation history yet, so there is nothing to clear. |
| `/feedback` | Done | Asks for feedback and logs the answer to Google Sheets (see below). |

Any other message is sent to the AI model and the answer is returned to the user.

## Feedback flow

1. The user sends `/feedback`. The bot asks: "What feedback would you like to share? Just type it below." and opens Telegram's reply box.
2. The user's reply is recognized as feedback because it is a reply to that question (no database or stored flag is needed).
3. A new row is added to the Google Sheet with: User ID, Username, Feedback Text, Timestamp.
4. The bot confirms: "Thanks for your feedback! It has been recorded."

A one-message form also works: `/feedback Great bot!`

Sheet columns (row 1): `User ID | Username | Feedback Text | Timestamp`

## How it works

```
Telegram message
      |
      v
Pipedream HTTP trigger (webhook)
      |
      v
command_check        -> detects commands (steps/command_check.js)
      |
      v
handle_feedback      -> saves feedback to Google Sheets and stops (steps/handle_feedback.js)
      |  (other messages continue)
      v
handle_command       -> replies to /start, /help, /features, /reset, /feedback and stops (steps/handle_command.js)
      |  (normal messages continue)
      v
send_chat_completion -> OpenRouter, a ":free" model
      |
      v
send_text_message    -> sends the AI answer back to Telegram
```

### Design notes

- The first version used a Pipedream Switch step with one branch per command. Logical branching is not available on the free Pipedream plan, so the Switch was replaced by a Node.js step (`handle_command`) with the same conditional logic.
- Feedback uses Telegram's reply feature instead of a stored "awaiting feedback" flag, so no data store is needed.
- Feedback is written to the sheet as plain text (`valueInputOption: RAW`), so a message that starts with `=` is not run as a spreadsheet formula.

## Setup

1. Create a bot with [@BotFather](https://t.me/BotFather) and register the commands with `/setcommands` (list above).
2. Create a Pipedream workflow with an HTTP trigger and point the bot's Telegram webhook to the trigger URL.
3. Create a Google Sheet with the four column headers above. Make sure the tab name matches the "Sheet (tab) name" field in `handle_feedback` (default `Sheet1`).
4. Add the steps in the order shown above. Connect your Telegram Bot API, Google Sheets and OpenRouter accounts inside Pipedream, and enter the spreadsheet ID in the `handle_feedback` step.
5. In `send_chat_completion`, choose a free OpenRouter model (name ends with `:free`) and set the message to the user's text.
6. Deploy the workflow and test in Telegram.

## Known limitations

- Free OpenRouter models can be rate-limited (HTTP 429). If that happens, choose another `:free` model.
- The AI step receives only the latest message, so the bot has no conversation memory.
- If a user types feedback without using the reply box, the message is treated as a normal chat message.

## Security

No tokens, API keys, spreadsheet IDs or trigger URLs are stored in this repository. The Telegram bot token and the OpenRouter key stay in Pipedream's connected accounts. Do not publish the workflow's trigger URL, and keep the feedback sheet private.
