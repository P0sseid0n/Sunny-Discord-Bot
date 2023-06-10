import { SlashCommandBuilder } from 'discord.js'
import { ICommand } from '../types'

export const command: ICommand = {
	data: new SlashCommandBuilder()
		.setName('say')
		.setDescription('Diz algo no chat')
		.addStringOption(option => option.setName('message').setDescription('Texto a ser dito')),
	async run(client, interaction) {
		const message = interaction.options.get('message')?.value

		console.log('message', message)

		if (message) {
			await interaction.reply(message + '')
		} else {
			await interaction.reply('Não entendi o que você quis dizer')
		}
	},
}
