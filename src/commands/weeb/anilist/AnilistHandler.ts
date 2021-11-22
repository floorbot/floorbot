import { ChatInputHandler } from '../../../discord/handler/abstracts/ChatInputHandler.js';
import { AniListCommandData } from './AniListCommandData.js';
import { AniListAPI, MediaType } from './api/AniListAPI.js';
import { CommandInteraction } from 'discord.js';
import path from 'path';
import fs from 'fs';

export class AnilistHandler extends ChatInputHandler {

    private readonly api: AniListAPI;

    constructor() {
        super({ data: AniListCommandData, group: 'weeb' });
        this.api = new AniListAPI();
    }

    public async execute(command: CommandInteraction<'cached'>): Promise<any> {

        const subCommand = command.options.getSubcommand(true);

        switch (subCommand) {
            case 'media': {
                const query = command.options.getString('query', true);
                const gql = fs.readFileSync(`${path.resolve()}/res/queries/media.gql`, 'utf8');

                const vars = {
                    page: page,
                    perPage: 1,
                    type: MediaType.ANIME,
                    ...(typeof query === 'number' ?
                        { id: query } :
                        { search: query }
                    )
                }

            }
        }
        return null;
    }
}
