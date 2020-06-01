import { Command, CommandParams, EMOJIS } from "../utils/structs";

export default class CBCCommand extends Command {
    name = 'create-bot-channel';
    desc = `Vous permez de choisir quels salons vous souhaitez créer en fonction des bots que vous utilisez. ${EMOJIS.WARNINGEMOJI} Assurez vous que le bot peut vous envoyer un message privé.`;
    usage = 'cbc';
    aliases = ['cbc']
    categorie = 'Autre';

    async execute(args: CommandParams): Promise<void> {
        if (args.message.guild.member(args.message.author).hasPermission("ADMINISTRATOR") && !args.message.mentions.members.first()) { args.message.channel.send(`${EMOJIS.XEMOJI} **Cette commande n'est pas disponible pour une personne possédant les permissions administrateur.**`); return; };
        args.bot.emit("guildMemberAdd", args.message.mentions.members.first() ? args.message.guild.member(args.message.mentions.members.first()) : args.message.guild.member(args.message.author));
        args.message.channel.send(`${EMOJIS.OKEMOJI} **Vérifiez vos messages privés.**`);
    };
};