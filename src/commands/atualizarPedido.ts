import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js'
import { ICommand } from '../types'
import { OrderStatus } from '@prisma/client'

function getNextOrderStatus(currentStatus: string) {
	switch (currentStatus) {
		case 'Pending':
			return 'In Progress'
		case 'In Progress':
			return 'Completed'
	}
}

export const command: ICommand = {
	data: new SlashCommandBuilder()
		.setName('atualizar-pedido')
		.setDescription('Atualiza um pedido')
		.addStringOption(option => option.setName('id').setDescription('ID do pedido').setRequired(true))

		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async run(client, interaction) {
		const orderId = interaction.options.get('id')?.value

		if (!orderId || typeof orderId !== 'string') {
			interaction.reply('Você precisa informar o ID do pedido')
			return
		}

		const currentOrder = await client.database.orders.findUnique({
			where: {
				id: orderId,
			},
		})

		if (!currentOrder) {
			interaction.reply('Pedido não encontrado')
			return
		}

		let nextOrderStatus: OrderStatus = 'AwaitingPayment'

		if (currentOrder.status === 'AwaitingPayment') nextOrderStatus = 'Pending'
		else if (currentOrder.status === 'Pending') nextOrderStatus = 'InProgress'
		else if (currentOrder.status === 'InProgress') nextOrderStatus = 'Completed'

		const confirmEmbed = new EmbedBuilder()
			.setTitle('Atualização do status do pedido')
			.setDescription('**Confirma a atualização do status do pedido?**')
			.addFields(
				{
					name: 'Status atual',
					value: currentOrder.status,
					inline: true,
				},
				{
					name: 'Novo status',
					value: nextOrderStatus,
					inline: true,
				}
			)

		const confirmMessage = await interaction.reply({
			embeds: [confirmEmbed],
			components: [
				{
					type: ComponentType.ActionRow,
					components: [
						new ButtonBuilder().setCustomId('confirm').setLabel('Confirmar').setStyle(ButtonStyle.Success),
						new ButtonBuilder().setCustomId('cancel').setLabel('Cancelar').setStyle(ButtonStyle.Danger),
					],
				},
			],
		})

		const collector = confirmMessage.createMessageComponentCollector({
			time: 30_000,
		})

		collector.on('collect', async interaction => {
			await interaction.deferUpdate()

			if (interaction.customId === 'confirm') {
				const updatedOrder = await client.database.orders.update({
					where: {
						id: orderId,
					},
					data: {
						status: nextOrderStatus,
					},
				})

				interaction.editReply({
					content: 'Status atualizado com sucesso ✅',
					components: [],
				})
			} else if (interaction.customId === 'cancel') {
				interaction.editReply({
					content: 'Atualização cancelada ❌',
					components: [],
				})
			}
		})

		collector.on('end', async collected => {
			if (collected.size === 0) {
				await confirmMessage.edit({
					components: [],
				})
			}
		})
	},
}
