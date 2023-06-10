import {
	EmbedBuilder,
	SlashCommandBuilder,
	ButtonBuilder,
	StringSelectMenuBuilder,
	ButtonStyle,
	ComponentType,
	italic,
	inlineCode,
	bold,
} from 'discord.js'
import { ICommand } from '../types'

import { elos, tiers, yesNo } from '../utils/questionOptions'

interface IQuestion {
	title: string
	id: string
	options?: {
		text: string
		value: string
	}[]
}

const elosPrices: { [key: string]: { tier: number; elo: number } } = {
	iron: {
		tier: 2,
		elo: 5,
	},
	bronze: {
		tier: 5,
		elo: 10,
	},
	silver: {
		tier: 9,
		elo: 14,
	},
	gold: {
		tier: 14,
		elo: 19,
	},
	platinum: {
		tier: 19,
		elo: 24,
	},
	diamond: {
		tier: 60,
		elo: 100,
	},
}

const questions: IQuestion[] = [
	{
		title: 'Qual é a liga atual?',
		id: 'currentElo',
		options: elos,
	},
	{
		title: 'Qual é o tier atual?',
		id: 'currentTier',
		options: tiers,
	},
	{
		title: 'Qual liga desejada?',
		id: 'desiredElo',
		options: elos,
	},
	{
		title: 'Qual tier desejado?',
		id: 'desiredTier',
		options: tiers,
	},
	// {
	// 	title: 'Qual seu PDL atual?',
	// 	input: '0 ~ 100',
	// },
	/*
	{
		title: 'Quanto PDL ganha por vitória?',
		id: 'pdlPerWin',
		options: [
			{
				text: 'Abaixo de 15',
				value: '-15',
			},
			{
				text: 'Acima de 15',
				value: '+15',
			},
		],
	},
	{
		title: 'Qual o modo de jogo desejado?',
		id: 'gameMode',
		options: [
			{
				text: 'Solo/Duo',
				value: 'solo',
			},
			{
				text: 'Flex',
				value: 'flex',
			},
		],
	},
	{
		title: 'Deseja que o serviço seja feito com o chat offline?',
		id: 'offlineChat',
		options: yesNo,
	},
	{
		title: 'Tecla do Flash?',
		id: 'flashKey',
		options: [
			{
				text: 'D',
				value: 'd',
			},
			{
				text: 'F',
				value: 'f',
			},
		],
	},
	{
		title: 'Deseja que o jobber jogue em uma lane específica?',
		id: 'specificLane',
		options: [
			{
				text: 'Não',
				value: 'no',
			},
			{
				text: 'Top',
				value: 'top',
			},
			{
				text: 'Jungle',
				value: 'jungle',
			},
			{
				text: 'Mid',
				value: 'mid',
			},
			{
				text: 'ADC',
				value: 'adc',
			},
			{
				text: 'Suporte',
				value: 'support',
			},
		],
	},
	{
		title: 'Deseja uma vitória extra ao final do serviço?',
		id: 'extraWin',
		options: yesNo,
	},
	{
		title: 'Deseja que seja feito em um horário específico?',
		id: 'specificSchedule',
		options: [
			{
				text: 'Não',
				value: 'no',
			},
			{
				text: 'Manhã',
				value: 'morning',
			},
			{
				text: 'Tarde',
				value: 'afternoon',
			},
			{
				text: 'Noite',
				value: 'night',
			},
		],
	},
	{
		title: 'Deseja um serviço expresso? (redução no prazo de entrega)',
		id: 'expressService',
		options: yesNo,
	},
	{
		title: 'Deseja que as partidas sejam jogadas APENAS solo?',
		id: 'soloOnly',
		options: yesNo,
	},
	{
		title: 'Deseja prioridade na fila?',
		id: 'priorityQueue',
		options: yesNo,
	},
   */
]

function getQuestionReply(question: IQuestion, index: number) {
	const embed = new EmbedBuilder({
		title: `${question.title}`,
		footer: {
			text: `Pergunta ${index + 1} de ${questions.length}`,
		},
	})

	const components: Array<StringSelectMenuBuilder | ButtonBuilder> = []

	if (question.options) {
		if (question.options.length > 5) {
			components.push(
				new StringSelectMenuBuilder({
					placeholder: 'Selecione...',
					options: question.options.map(option => ({ label: option.text, value: option.value })),
					customId: 'Q' + index,
				})
			)
		} else {
			question.options.forEach(option => {
				components.push(
					new ButtonBuilder({
						customId: 'Q' + index + ':' + option.value,
						label: option.text,
						style: ButtonStyle.Secondary,
					})
				)
			})
		}
	}

	return {
		embeds: [embed],
		components: [
			{
				type: ComponentType.ActionRow,
				components,
			},
			{
				type: ComponentType.ActionRow,
				components: [
					new ButtonBuilder({
						customId: 'back',
						label: 'Voltar',
						style: ButtonStyle.Secondary,
						emoji: '⬅️',
						disabled: index === 0,
					}),
				],
			},
		],
		ephemeral: true,
	}
}

function getCheckoutPrice(responses: IQuestionResponses) {
	let price = 0

	// Calculate distance between current and desired elo

	let eloPrice = 0

	let currentElo = responses['currentElo']
	let currentTier = Number(responses['currentTier'])

	while (currentElo !== responses['desiredElo'] || String(currentTier) !== responses['desiredTier']) {
		if (currentTier === 1) {
			eloPrice += elosPrices[currentElo].elo
			currentTier = 4
			const eloIndex = elos.findIndex(elo => elo.value === currentElo)
			currentElo = elos[eloIndex + 1].value
		} else {
			eloPrice += elosPrices[currentElo].tier
			currentTier -= 1
		}
	}

	price += eloPrice

	if (responses['pdlPerWin'] === '-15') price *= 1.25
	if (responses['specificLane'] !== 'no') price *= 1.1
	if (responses['extraWin'] === 'yes') price *= 1.15
	if (responses['specificSchedule'] !== 'no') price *= 1.2
	if (responses['expressService'] === 'yes') price *= 1.25
	if (responses['soloOnly'] === 'yes') price *= 1.2
	if (responses['priorityQueue'] === 'yes') price *= 1.15

	return price
}

function getCheckoutReply(responses: IQuestionResponses) {
	const textResponses = []

	for (const [key, value] of Object.entries(responses)) {
		const keysToIgnore = ['currentElo', 'currentTier', 'desiredElo', 'desiredTier']

		if (keysToIgnore.includes(key)) continue

		const question = questions.find(question => question.id === key)

		if (question) {
			const option = question.options?.find(option => option.value === value)

			if (option) {
				textResponses.push(`${italic(question.title)} \n${inlineCode(option.text)}`)
			}
		}
	}

	const totalPrice = getCheckoutPrice(responses)

	const currentElo = elos.find(elo => elo.value === responses.currentElo)?.text + ' ' + responses.currentTier
	const desiredElo = elos.find(elo => elo.value === responses.desiredElo)?.text + ' ' + responses.desiredTier

	const embed = new EmbedBuilder({
		title: 'Dados da Compra',
		description: `\n${textResponses.join('\n')}`,
		fields: [
			{
				name: 'Serviço',
				value: bold(inlineCode('EloBoost')),
				inline: false,
			},
			{
				name: 'Elo atual',
				value: bold(inlineCode(currentElo)),
				inline: true,
			},
			{
				name: 'Elo desejado',
				value: bold(inlineCode(desiredElo)),
				inline: true,
			},
			{
				name: 'Preço',
				value: bold(inlineCode(`${totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`)),
				inline: true,
			},
		],
	})

	return {
		embeds: [embed],
		components: [
			{
				type: ComponentType.ActionRow,
				components: [
					new ButtonBuilder({
						customId: 'confirm',
						label: 'Confirmar',
						style: ButtonStyle.Success,
					}),
					new ButtonBuilder({
						customId: 'cancel',
						label: 'Cancelar',
						style: ButtonStyle.Danger,
					}),
				],
			},
		],
	}
}

type IQuestionResponses = { [key: (typeof questions)[number]['id']]: string }

export const command: ICommand = {
	data: new SlashCommandBuilder()
		.setName('comprar')
		.setDescription('Comprar um serviço')
		.addSubcommand(subcommand => subcommand.setName('elojob').setDescription('Comprar um serviço de elojob')),
	async run(client, interaction) {
		async function getJobbersOnline() {
			const registered = await client.database.jobber.findMany({})

			return registered.reduce((acc, jobber) => {
				const member = interaction.guild?.members.cache.get(jobber.id)

				return member?.presence?.status !== 'offline' ? acc + 1 : acc
			}, 0)
		}

		await interaction.deferReply({ ephemeral: true })

		const responses: IQuestionResponses = {}

		async function replyQuestion(index: number) {
			const replied = await interaction.editReply(getQuestionReply(questions[index], index))

			const collector = replied.createMessageComponentCollector({
				time: 60_000,
			})

			collector.on('collect', async collected => {
				await collected.deferUpdate()

				if (collected.customId === 'back') {
					collector.stop()
					await replyQuestion(index - 1)
				} else {
					const response = collected.isStringSelectMenu() ? collected.values[0] : collected.customId.split(':')[1]
					responses[questions[index].id] = response

					collector.stop()

					if (questions[index + 1]) await replyQuestion(index + 1)
					else {
						console.log(responses)

						const replied = await interaction.editReply(getCheckoutReply(responses))

						const collector = replied.createMessageComponentCollector({
							time: 30_000,
						})

						collector.on('collect', async collected => {
							await collected.deferUpdate()
							collector.stop()
							if (collected.customId === 'confirm') {
								checkout()
							} else if (collected.customId === 'cancel') {
								await interaction.editReply({
									content: 'Compra cancelada ❌',
									components: [],
								})
							}
						})
					}
				}
			})

			collector.on('end', async collected => {
				if (collected.size === 0) {
					await interaction.editReply({
						components: [],
					})
				}
			})
		}

		function checkout() {
			// Generate PIX QR Code and send to customer DM

			console.log('User', interaction.user.id, 'bought elojob service')

			client.database.orders
				.create({
					data: {
						type: 'EloJob',
						customerId: interaction.user.id,
						status: 'AwaitingPayment',
					},
				})
				.then(async result => {
					await interaction.editReply({
						content:
							bold('Seu pedido foi registrado com sucesso ✅') +
							'\n\nO dados do seu pedido foram enviados na sua DM' +
							`\nCaso não tenha recebido use ${bold(inlineCode('/pedidos'))}` +
							`\n\n${italic('Logo um jobber entrará em contato com você')}`,
						components: [],
					})
				})
				.catch(error => {
					interaction.editReply({
						content: `${bold('Ocorreu um erro ao registrar seu pedido ❌')} \nTente novamente mais tarde.`,
						components: [],
					})

					console.error(error)
				})
		}

		await replyQuestion(0)
	},
}
