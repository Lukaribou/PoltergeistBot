import { Command, CommandParams, EMOJIS } from "../utils/structs";
import { GuildChannel, Message, Collection } from "discord.js";
import { isBotAdmin } from "../utils/functions";

export default class ClearCommand extends Command {
    name = 'clear';
    desc = 'Permet de purger un salon, en laissant les messages épinglés';
    usage = 'clear <nombre/all>';
    categorie = 'Modération';

    async execute(args: CommandParams): Promise<void> {
        if (!(args.message.channel as GuildChannel).permissionsFor(args.message.author).any(['MANAGE_MESSAGES', 'MANAGE_CHANNELS'])
            && !isBotAdmin(args.message.author)) {
            args.message.channel.send(`${EMOJIS.XEMOJI} **Vous devez avoir la permission de gérer les messages dans ce salon (ou gérer le salon) pour utiliser cette commande.**`);
            return;
        } else if (!args.args[0]
            || (isNaN(parseInt(args.args[0])) && args.args[0] !== 'all')
            || parseInt(args.args[0]) < 1) {
            args.message.channel.send(`${EMOJIS.XEMOJI} **Le paramètre 1 doit être un nombre positif ou \`all\``);
            return;
        };

        var compteur: number = 0;
        var mes: Message[] = null;
        do {
            mes = (await args.message.channel.messages.fetch({ limit: 100 })
                .catch(() => new Collection<string, Message>()))
                .filter(m => !m.pinned && !isOlder14Days(m))
                .array(); // On enlève les messages épinglés de la liste et ceux vieux de + de 2 semaines
            if (args.args[0] !== 'all'
                && (parseInt(args.args[0]) - compteur < 100)) mes = mes.slice(0, parseInt(args.args[0]) - compteur);
            if (mes.length === 0) break;
            args.message.channel.bulkDelete(mes, true)
                .then(x => compteur += x.size) // Le bulkDelete n'accepte pas plus de 100 messages à supprimer
                .catch(() => { })
        } while (mes.length !== 0);
        args.message.channel.send(`${EMOJIS.OKEMOJI} **${compteur} messages ont été supprimés. Les messages de plus de 14 jours ne peuvent pas être supprimés avec le bot.**`)
            .then(m => setTimeout(() => m.delete().catch(() => { }), 2500))
            .catch(() => {}); // On supprime le message au bout de 5 secondes
    };
};

/**
 * Renvoie true si le message est vieux de plus de deux semaines
 */
export const isOlder14Days = (message: Message): boolean => <number><unknown>(Date.now() / 8.64e7 - message.createdAt.getTime() / 8.64e7).toFixed(0) > 14;