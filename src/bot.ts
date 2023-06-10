import Discord, { RESTGetAPIApplicationCommandsResult } from 'discord.js'
import { readdirSync } from 'fs'
import path from 'path'
import { ICommand, IEvent } from './types'
import { PrismaClient } from '@prisma/client'

class Bot extends Discord.Client {
	public commands = new Discord.Collection<string, ICommand>()
	public database = new PrismaClient()

	constants = {
		devMode: false,
	}

	async start(botToken?: string) {
		this.constants.devMode = process.env.NODE_ENV === 'development'

		await this.seedDatabase()
		console.log('Iniciando bot...')
		await this.login(botToken || process.env.BOT_TOKEN)
		console.log('Bot logado!')
		await this.loadCommands()
		this.loadEvents()
		console.log('Bot pronto!')
	}

	async seedDatabase() {}

	// Load slash commands from /commands
	async loadCommands() {
		const folderPath = path.join(__dirname, 'commands')
		const commandFiles = readdirSync(folderPath).filter(file => file.endsWith('.ts'))

		for (const fileName of commandFiles) {
			const filePath = path.join(folderPath, fileName)
			const file = await import(filePath)

			const command = file.command as ICommand

			this.commands.set(command.data.name, command)
		}

		const rest = new Discord.REST({ version: '9' }).setToken(process.env.BOT_TOKEN!)

		const clientId = this.user?.id
		if (!clientId) throw new Error('Erro ao pegar o id do bot')

		const restBody = this.commands.map(command => command.data.toJSON())

		if (this.constants.devMode) {
			const guildId = process.env.DEV_GUILD_ID

			if (!guildId) throw new Error('Erro ao pegar o id do servidor')

			// const guildCommands = (await rest.get(
			// 	Discord.Routes.applicationGuildCommands(clientId, guildId)
			// )) as RESTGetAPIApplicationCommandsResult

			// for (const command of guildCommands) {
			// 	const deleteUrl = `${Discord.Routes.applicationGuildCommands(clientId, guildId)}/${command.id}`
			// 	await rest.delete(`/${deleteUrl}`)
			// }

			// console.log(`Comandos do servidor apagados: ${guildCommands.length}`)

			// const applicationCommands = (await rest.get(
			// 	Discord.Routes.applicationCommands(clientId)
			// )) as RESTGetAPIApplicationCommandsResult

			// for (const command of applicationCommands) {
			// 	const deleteUrl = `${Discord.Routes.applicationCommands(clientId)}/${command.id}`
			// 	await rest.delete(`/${deleteUrl}`)
			// }

			// console.log(`Comandos globais apagados: ${applicationCommands.length}`)

			// try {
			// 	await rest.put(Discord.Routes.applicationGuildCommands(clientId, guildId), {
			// 		body: restBody,
			// 	})
			// 	console.log(`Comandos do servidor carregados: ${restBody.length}`)
			// } catch (error) {
			// 	console.log(error)
			// }
		} else {
			await rest.put(Discord.Routes.applicationCommands(clientId), { body: restBody })
		}

		console.log(`Comandos Carregados: ${restBody.length}`)
	}

	async loadEvents() {
		const folderPath = path.join(__dirname, 'events')
		const eventFiles = readdirSync(folderPath).filter(file => file.endsWith('.ts'))

		for (const fileName of eventFiles) {
			const filePath = path.join(folderPath, fileName)

			const event = (await import(filePath)).event as IEvent

			this.on(event.name, (...args) => event.run(this, ...args))
		}

		console.log(`Eventos Carregados: ${eventFiles.length}`)
	}
}

export default Bot
