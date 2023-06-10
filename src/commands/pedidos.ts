import { EmbedBuilder, SlashCommandBuilder, inlineCode } from 'discord.js'
import { ICommand } from '../types'

function formatDateHour(date: Date) {
	const day = date.getDate().toString().padStart(2, '0')
	const month = (date.getMonth() + 1).toString().padStart(2, '0')
	const year = date.getFullYear().toString().padStart(2, '0')
	const hour = date.getHours().toString().padStart(2, '0')
	const minute = date.getMinutes().toString().padStart(2, '0')
	const second = date.getSeconds().toString().padStart(2, '0')

	return `${day}/${month}/${year} ${hour}:${minute}:${second}`
}

function translateStatus(status: string) {
	switch (status) {
		case 'Pending':
			return 'Pendente'
		case 'InProgress':
			return 'Em progresso'
		case 'Completed':
			return 'Finalizado'
		case 'Canceled':
			return 'Cancelado'
		default:
			return 'Desconhecido'
	}
}

export const command: ICommand = {
	data: new SlashCommandBuilder()
		.setName('pedidos')
		.setDescription('Mostra os pedidos do usuário')
		.addStringOption(option => option.setName('id').setDescription('ID do pedido')),
	async run(client, interaction) {
		const orderId = interaction.options.get('id')?.value

		if (orderId && typeof orderId === 'string') {
			const order = await client.database.orders.findUnique({
				where: {
					id: orderId,
				},
			})
			if (!order) return interaction.reply('Nenhum pedido encontrado com esse ID')
			const reply = new EmbedBuilder()
				.setTitle(`Pedido #${order.id}`)
				.addFields({ name: 'Data de criação', value: inlineCode(formatDateHour(order.createdAt)), inline: true })
				.addFields({ name: 'Status atual', value: inlineCode(translateStatus(order.status)), inline: true })
			await interaction.reply({
				embeds: [reply],
			})
		} else {
			const orders = await client.database.orders.findMany({
				where: {
					customerId: interaction.user.id,
				},
			})

			const ordersText = orders
				.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
				.map(order => {
					const date = formatDateHour(order.createdAt)
					const id = order.id
					const status = translateStatus(order.status)

					return inlineCode(`${date} | ${id} | ${status}`)
				})
				.join('\n')

			const reply = new EmbedBuilder()
				.setTitle('Seus Pedidos')
				.addFields({ name: 'Data de criação | ID do pedido | Status atual', value: ordersText || '\nNenhum pedido encontrado' })
				.setFooter({ text: `${orders.length} pedidos encontrados` })

			interaction.reply({
				embeds: [reply],
			})
		}
	},
}
