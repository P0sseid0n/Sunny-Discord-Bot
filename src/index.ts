import Bot from './bot'
import dotenv from 'dotenv'
dotenv.config()

const bot = new Bot({
	intents: 32767,
})

bot.start(process.env.BOT_TOKEN)
