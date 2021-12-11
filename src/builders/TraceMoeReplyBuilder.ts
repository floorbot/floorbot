import { TraceMoeResult } from "../apis/tracemoe/interfaces/TraceMoeResult.js";
import { HandlerUtil, NonEmptyArray } from "../discord/HandlerUtil.js";
import { EmbedBuilder } from "../discord/builders/EmbedBuilder.js";
import { ReplyBuilder } from "../discord/builders/ReplyBuilder.js";
import humanizeDuration from "humanize-duration";
import { ProbeResult } from "probe-image-size";
import { AttachmentBuilder } from "../discord/builders/AttachmentBuilder.js";

export class TraceMoeReplyBuilder extends ReplyBuilder {

    protected override createEmbedBuilder(pageData?: { pages: number; page: number; }): EmbedBuilder {
        const embed = super.createEmbedBuilder();
        if (pageData) {
            const page = HandlerUtil.resolvePage(pageData.page, pageData.pages);
            embed.setFooter(`${page + 1}/${pageData.pages} - Powered by Trace Moe`);
        } else {
            embed.setFooter(`Powered by Trace Moe`);
        }
        return embed;
    }

    public addTraceMoeEmbed(metadata: ProbeResult, results: NonEmptyArray<TraceMoeResult>, page: number): this {
        const result = HandlerUtil.resolveArrayPage(results, page);
        const anilistID = typeof result.anilist === 'string' ? result.anilist : result.anilist.id;
        const embed = this.createEmbedBuilder({ page: page, pages: results.length })
            .setTitle(typeof result.anilist === 'string' ? result.filename : result.anilist.title.romaji)
            .setURL(`https://anilist.co/anime/${anilistID}`)
            .setThumbnail(metadata.url)
            .setDescription([
                `Episode: **${result.episode}**`,
                `Similarity: **${HandlerUtil.formatDecimal(result.similarity * 100, 2)}%**`,
                `Scene Time: **${humanizeDuration(Math.round(result.from) * 1000)}**`
            ]);
        return this.addEmbed(embed);
    }

    public addTraceMoeLoadingEmbed(): this {
        const embed = this.createEmbedBuilder()
            .setTitle('Trace Moe Loading...')
            .setDescription('*Please wait while I upload the scene!*');
        return this.addEmbed(embed);
    }

    public addTraceMoePageActionRow(results: NonEmptyArray<TraceMoeResult>, page: number): this {
        const result = HandlerUtil.resolveArrayPage(results, page);
        const anilistID = typeof result.anilist === 'string' ? result.anilist : result.anilist.id;
        const url = `https://anilist.co/anime/${anilistID}`;
        return this.addPageActionRow(url, undefined, results.length <= 1);
    }

    public addTraceMoeFile(results: NonEmptyArray<TraceMoeResult>, page: number): this {
        const result = HandlerUtil.resolveArrayPage(results, page);
        const attachment = new AttachmentBuilder(`${result.video}&size=l`);
        return this.addFile(attachment);
    }
}
