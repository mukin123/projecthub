const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');

// 1. REPLACE THESE WITH YOUR ACTUAL DETAILS
const token = '8560787983:AAHbJetf9gYHi51e1SSZ0a8dWxXXAAI8O4Q';
const myChatId = 7632515885; // Your personal numeric ID

// 2. The folder where Claude will operate
const projectDir = '/home/ubuntu/claude/projecthub/your-repo-name';

const bot = new TelegramBot(token, {polling: true});
console.log("Telegram bridge is listening...");

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // SECURITY GATE: Only YOU can talk to this bot
    // If anyone else finds your bot, it will ignore them.
    if (chatId !== myChatId) {
        bot.sendMessage(chatId, "Unauthorized user. Access Denied.");
        return;
    }

    if (!text) return;

    bot.sendMessage(chatId, "🤖 Claude is thinking...");

    // Escape quotes to prevent bash injection
    const safeText = text.replace(/"/g, '\\"');

    // Build the command: Headless mode (-p) + auto-approve everything
   const command = `/home/ubuntu/.local/bin/claude -p "${safeText}" --dangerously-skip-permissions --output-format text`;


    // Execute Claude Code
    exec(command, { cwd: projectDir, shell: '/bin/bash' }, (error, stdout, stderr) => {
        // Combine stdout and stderr to ensure we miss nothing
        let response = (stdout.trim() || stderr.trim());
        
        if (!response) {
            response = "✅ Task completed, but Claude didn't send a text summary. Try asking: 'What did you just do?'";
        }

        // Handle Telegram's 4096 character limit
        if (response.length > 4000) {
            response = response.substring(0, 4000) + "\n\n...[Output truncated]";
        }

        bot.sendMessage(chatId, response);
    });
