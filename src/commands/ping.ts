import { SlashCommandBuilder } from 'discord.js'
import { ICommand } from '../types'

export const command: ICommand = {
	data: new SlashCommandBuilder().setName('ping').setDescription('Pong!'),
	async run(client, interaction) {
		const replied = await interaction.reply('Pong!')

		const time = replied.createdTimestamp - interaction.createdTimestamp

		await replied.edit(`Pong! \n\nLatência: ${time}ms`)
	},
}
