import type { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from '@discordjs/builders'
import { ClientEvents, CommandInteraction } from 'discord.js'
import Bot from './bot'

export interface ICommand {
	data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | SlashCommandSubcommandsOnlyBuilder
	run(client: Bot, interaction: CommandInteraction): Promise<any> | any
}

export interface IEvent<T extends keyof ClientEvents = keyof ClientEvents> {
	name: T
	run(client: Bot, ...args: ClientEvents[T]): Promise<any> | any
}
