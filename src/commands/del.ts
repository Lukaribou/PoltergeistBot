import { Command, CommandParams, EMOJIS } from "../utils/structs";
import { isBotAdmin } from "../utils/functions";
import { MessageReaction, User, CategoryChannel } from "discord.js";

export default class DelCommand extends Command {
    name = 'del';
    desc = 'Supprime les salons et la catégorie spécifiée';
    usage = 'del <id de la catégorie>';
    categorie = 'Modération';

    async execute(args: CommandParams): Promise<void> {
        if (!args.message.member.hasPermission('ADMINISTRATOR')) { args.message.channel.send(`${EMOJIS.XEMOJI} **Seul un administrateur peut faire cela !**`); return; }
        if (!args.args[0]) { args.message.channel.send(`${EMOJIS.XEMOJI} **Il faut passer l'id de la catégorie en paramètre.**`); return; }

        var c = args.message.guild.channels.cache.get(args.args[0]) as CategoryChannel;
        if (!c) { args.message.channel.send(`${EMOJIS.XEMOJI} **L'id spécifié ne correspond pas à une catégorie valide.**`); return; }

        args.message.channel.send(`${EMOJIS.WARNINGEMOJI} **Etes vous certain(e) de vouloir supprimer la catégorie \`${c.name}\` ?**`)
            .then(async (msg) => {
                await msg.react(EMOJIS.OKEMOJI).catch(() => { });
                await msg.react(EMOJIS.XEMOJI).catch(() => { });

                const fl = (r: MessageReaction, u: User) =>
                    [EMOJIS.OKEMOJI.toString(), EMOJIS.XEMOJI.toString()].includes(r.emoji.name)
                    && u.id == args.message.author.id;

                const coll = msg.createReactionCollector(fl, { time: 30e3 });
                coll.on('collect', r => r.emoji.name == EMOJIS.XEMOJI ?
                    msg.edit(`${EMOJIS.XEMOJI} **Suppression de \`${c.name}\` annulée.**`).catch(() => { })
                    : (function () {
                        c.children.forEach(async (ch) => await ch.delete(`Supprimé par ${args.message.author.tag}`).catch(() => { }));
                        c.delete(`Supprimée par ${args.message.author.tag}`);
                        msg.edit(`${EMOJIS.OKEMOJI} **La catégorie \`${c.name}\` a bien été supprimée !**`).catch(() => { });
                    })());
            });
    }
}