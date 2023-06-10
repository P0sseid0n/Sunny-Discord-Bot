import { IEvent } from '../types'

export const event: IEvent<'interactionCreate'> = {
	name: 'interactionCreate',
	run: async (client, interaction) => {
		if (!interaction.isCommand()) return

		const command = client.commands.get(interaction.commandName)

		if (!command) return interaction.reply({ content: 'Comando não encontrado', ephemeral: true })

		try {
			command.run(client, interaction)
		} catch (error) {
			console.error(error)
			interaction.reply({ content: 'Erro ao executar o comando', ephemeral: true })
		}
	},
}
