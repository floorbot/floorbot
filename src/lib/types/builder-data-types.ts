import { ButtonBuilder, EmbedBuilder, ModalBuilder, SelectMenuBuilder, TextInputBuilder } from 'discord.js';

export type EmbedBuilderType = ConstructorParameters<typeof EmbedBuilder>[0];

export type SelectMenuBuilderData = ConstructorParameters<typeof SelectMenuBuilder>[0];
export type TextInputBuilderData = ConstructorParameters<typeof TextInputBuilder>[0];
export type ButtonBuilderData = ConstructorParameters<typeof ButtonBuilder>[0];

export type ModalBuilderData = ConstructorParameters<typeof ModalBuilder>[0];
