import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js'
import { ICommand } from '../types'

export const command: ICommand = {
	data: new SlashCommandBuilder()
		.setName('adicionar')
		.setDescription('Adiciona algo')
		.addSubcommand(subcommand =>
			subcommand
				.setName('jobber')
				.setDescription('Adiciona um jobber')
				.addMentionableOption(option => option.setName('user').setDescription('Usuário').setRequired(true))
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async run(client, interaction) {
		const jobber = interaction.options.get('user')
		const jobberUser = jobber?.user

		if (!jobberUser) {
			interaction.reply('Você precisa mencionar um usuário')
			return
		}

		client.database.jobber
			.create({
				data: {
					id: jobberUser.id,
				},
			})
			.then(result => {
				console.log('Jobber adicionado com sucesso', result)
				interaction.reply(`${jobberUser.username} adicionado como jobber com sucesso`)
			})
			.catch(error => {
				interaction.reply(`Ocorreu um erro ao adicionar ${jobberUser.username} como jobber`)
				console.error(error)
			})
	},
}
