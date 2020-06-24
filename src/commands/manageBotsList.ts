import { Command, CommandParams, EMOJIS, botsListDb } from "../utils/structs";
import { isBotAdmin, saveDB } from "../utils/functions";
import { GuildMember } from "discord.js";

export default class ManageBotsListCommand extends Command {
    name = 'manage-bots-list';
    desc = "Permet de gérer l'association des bots et des émojis pour la création des salons";
    usage = "mbl <add/rem/list> <mention du bot> <émoji>";
    categorie = 'Système';
    botAdminsOnly = true;
    aliases = ['mbl'];

    async execute(args: CommandParams): Promise<void> {
        var regex: RegExp = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
        /**
          * Renvoie l'id de l'émoji. Renvoie undefined si ce n'est pas un émoji valide
          */
        const getEmoji = (str: string): string | undefined => str.startsWith('<:') ? (args.message.guild.emojis.cache.has(str.split(/(\d+)/)[1]) ? str.split(/(\d+)/)[1] : undefined) : (str.match(regex) ? str : undefined);

        if (!args.args[0] || !['add', 'rem', 'list'].includes(args.args[0])) { args.message.channel.send(`${EMOJIS.XEMOJI} **L'argument 1 doit être \`add\`, \`rem\` ou \`list\`.**`); return; };

        if (args.args[0] === 'list') {
            args.message.channel.send(`**__Association "bot <-> émoji:"__**\n${botsListDb.list.map(x => `<@${x[0]}> : ${getEmoji(x[1]) ? getEmoji(x[1]) : `${args.bot.emojis.cache.get(x[1])}`}`).join('\n')}`);
            return
        }

        if (!args.args[1] || !args.message.mentions.members.first() || !args.message.mentions.members.first().user.bot) { args.message.channel.send(`${EMOJIS.XEMOJI}**L'argument 2 doit être la mention du bot.**`); return; }
        if (!isBotAdmin(args.message.author)) { args.message.channel.send(`${EMOJIS.XEMOJI} **Cette commande est réservée aux administrateurs du bot.**`); return; };

        var selectedBot: GuildMember = args.message.mentions.members.first();
        if (args.args[0] === 'add') {
            if (!args.args[2] || !getEmoji(args.args[2])) { args.message.channel.send(`${EMOJIS.XEMOJI} **L'argument 3 doit être l'émoji à associer au bot.**`); return; };
            if (botsListDb.list.find(x => x[1] == getEmoji(args.args[2]))) { args.message.channel.send(`${EMOJIS.XEMOJI} **Cet émoji est déjà utilisé pour un autre bot.**`); return; };
            // Si le bot est déjà dans la bdd on change l'émoji sinon on ajoute les deux
            botsListDb.list.find(x => x[0] == selectedBot.id) ? botsListDb.list[botsListDb.list.findIndex(x => x[0] == selectedBot.id)][1] = getEmoji(args.args[2]) : botsListDb.list.push([selectedBot.id, getEmoji(args.args[2])]);
            saveDB('botsList');
            args.message.channel.send(`${EMOJIS.OKEMOJI} **Le bot ${selectedBot} est maintenant associé à l'émoji ${args.args[2]}.**`);
        } else {
            if (!botsListDb.list.find(x => x[0] == selectedBot.id)) { args.message.channel.send(`${EMOJIS.XEMOJI} **Le bot ${selectedBot} n'est pas présent dans la base de données**`); return; };
            botsListDb.list.splice(botsListDb.list.findIndex(x => x[0] == selectedBot.id), 1); // On supprime du tableau l'élément
            saveDB('botsList');
            args.message.channel.send(`${EMOJIS.OKEMOJI} **Le bot ${selectedBot} a bien été retiré de la base de données.**`);
        }
    };
};