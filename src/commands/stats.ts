import { Command, CommandParams, statsDb, EMOJIS } from "../utils/structs";
import { MessageEmbed } from "discord.js";
import { Stats } from "../utils/stats";
import { QuickChart } from "../utils/chart";

export default class StatsCommand extends Command {
    name = 'stats';
    desc = 'Affiche des stats sur le serveur';
    usage = 'stats';
    categorie = 'Informations';

    async execute(args: CommandParams): Promise<void> {
        var embed = new MessageEmbed();
        var chart = new QuickChart();

        if (!args.args[0]
            || ['server', 'serveur'].includes(args.args[0].toLowerCase())) {
            const data = statsDb.monthly;
            const ds = Stats.Monthly.getLast();

            chart.setType('line')
                .setXLabels(data.map((v) => v.monthName))
                .addData('Membres',
                    data.map((v) => v.members),
                    { fill: false, borderColor: '#19CF55' })
                .addData('Messages (en milliers)',
                    data.map((v) => (v.messages / 1000).toFixed(2)),
                    { fill: false, borderColor: '#FF5' })
                .addData('Salons',
                    data.map((v) => v.channels),
                    { fill: false, borderColor: '#00F' })
                .setTextColor('#FFF')
                .setBackgroundColor('transparent');

            embed.setAuthor(`Données de ${ds.monthName} ${ds.year} (${data.length} mois enregistrés)`,
                args.message.guild.iconURL({ dynamic: true }),
                'https://github.com/Lukaribou/PoltergeistBot')
                .addField('Membres:', ds.members, true)
                .addField('Messages:', ds.messages, true)
                .addField('Salons', ds.channels, true)
                .setImage(await chart.requestShortUrl());
        } else {
            switch (args.args[0].toLowerCase()) {
                case 'activity':
                case 'activité':
                    
                    break;
                default:
                    const dispos = ['activité/activity', 'server/serveur']
                    args.message.channel.send(`${EMOJIS.XEMOJI} **Le graphique \`${args.args[0]}\` m'est inconnu.**\n${EMOJIS.RIGHTARROW} Voici les graphiques disponibles: \`${dispos.join("`, `")}\``);
                    return;
            }
        }

        args.message.channel.send(embed);
    }
}