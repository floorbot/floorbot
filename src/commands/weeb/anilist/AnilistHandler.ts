import { ChatInputHandler } from '../../../discord/handler/abstracts/ChatInputHandler.js';
import { AniListCommandData } from './AniListCommandData.js';
import { AniListAPI } from './api/AniListAPI.js';
import { CommandInteraction } from 'discord.js';
import path from 'path';
import fs from 'fs';

export class AnilistHandler extends ChatInputHandler {

    private readonly api: AniListAPI;

    constructor() {
        super({ data: AniListCommandData, group: 'Weeb' });
        this.api = new AniListAPI();
    }

    public async execute(command: CommandInteraction<'cached'>): Promise<any> {

        const subCommand = command.options.getSubcommand(true);

        switch (subCommand) {
            case 'media': {
                await command.deferReply();
                const search = command.options.getString('search', true);
                const gql = fs.readFileSync(`${path.resolve()}/res/queries/media.gql`, 'utf8');
                const vars = {
                    ...(parseInt(search) ?
                        { id: parseInt(search) } :
                        { search: search }
                    )
                }
                const res = await this.api.request(gql, vars);
                console.log(res);
            }
        }
        return null;
    }
}
