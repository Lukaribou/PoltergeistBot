import { Command, CommandParams, EMOJIS } from "../utils/structs";
import { isBotAdmin } from "../utils/functions";
import { updateStatus } from "../events";

export default class StatusCommand extends Command {
    name = 'status';
    desc = 'Actualise le statut du bot';
    usage = 'status';
    categorie = 'Système';
    aliases = ['statut'];
    botAdminsOnly = true;

    async execute(args: CommandParams) {
        if (!isBotAdmin(args.message.author)) { args.message.channel.send(`${EMOJIS.XEMOJI} **Cette commande est réservée aux administrateurs du bot.**`); return; }
        updateStatus();
        args.message.channel.send(`${EMOJIS.OKEMOJI} **Statut actualisé !**`);
    }

}