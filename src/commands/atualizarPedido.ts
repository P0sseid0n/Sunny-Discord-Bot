import {
	SlashCommandBuilder,
	PermissionFlagsBits,
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	bold,
	inlineCode,
	userMention,
} from 'discord.js'
import { ICommand } from '../types'
import { OrderStatus } from '@prisma/client'

function translateStatus(status: OrderStatus) {
	switch (status) {
		case 'AwaitingPayment':
			return 'Aguardando pagamento'
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
					name: 'ID do pedido',
					value: bold(inlineCode(currentOrder.id)),
				},
				{
					name: 'Cliente',
					value: userMention(currentOrder.customerId),
				},
				{
					name: 'Status atual',
					value: bold(inlineCode(translateStatus(currentOrder.status))),
					inline: true,
				},
				{
					name: 'Novo status',
					value: bold(inlineCode(translateStatus(nextOrderStatus))),
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
