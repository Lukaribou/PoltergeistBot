import { Command, CommandParams, EMOJIS } from '../utils/structs'
import { isBotAdmin } from '../utils/functions';

export default class EmitCommand extends Command {
    name = "emit";
    categorie = "Système";
    desc = "Simule l'évènement donné en paramètre si il est configuré dans le bot";
    usage = "emit <évènement>";
    botAdminsOnly = true;

    async execute(args: CommandParams) {
        if (!isBotAdmin(args.message.author)) { args.message.channel.send(`${EMOJIS.XEMOJI} **Cette commande est réservée aux administrateurs du bot.**`); return; };
        if (!args.args[0]) { args.message.channel.send(`${EMOJIS.XEMOJI} **L'évènement à émettre est requis en paramètre.**`); return; }; // Si il n'y a pas d'argument 0

        switch (args.args[0]) { // Hésite pas à aller sur le site de la MDN: https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Instructions/switch
            case 'join': // Si args.args[0] = 'join'
                args.bot.emit("guildMemberAdd", args.message.guild.member(args.message.author)); // Je lui donne l'évènement à émettre, et le paramètre à donner (ici il me faut un GuildMember)
                break;
            case 'leave':
                args.bot.emit("guildMemberRemove", args.message.guild.member(args.message.author));
                break;
            default: // Si ça n'a matché avec rien
                args.message.channel.send(`${EMOJIS.XEMOJI} **Cet évènement n'existe pas ou n'est pas implémenté dans le bot.**`);
        };
    };
};