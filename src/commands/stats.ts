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

        if (!args.args[0] || ['server', 'serveur'].includes(args.args[0].toLowerCase())) {
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
                    let data = Object.keys(statsDb.activity.peoples)
                        .map(x => [x, statsDb.activity.peoples[x]])
                        .filter(x => args.bot.users.cache.get(x[0] as string))
                        .sort((a, b) => b[1].length - a[1].length); // + messages => - messages
                    data = data.splice(0, (data.length > 5 ? 5 : data.length));

                    chart.createSpecial({
                        type: 'doughnut',
                        data: {
                            labels: data.map((x) => args.bot.users.cache.get(x[0] as string).username),
                            datasets: [{ data: data.map((x) => x[1].length) }],
                        },
                        options: { plugins: { doughnutlabel: { labels: [{ text: data.map((x) => x[1].length).reduce((acc, x) => acc + x), font: { size: 20 } }] } } }
                    });
                    embed.setTitle('5 membres les plus actifs des 7 derniers jours')
                        .setImage(chart.generateUrl());
                    break;
                default:
                    const dispos = ['activité/activity', 'server/serveur'];
                    args.message.channel.send(`${EMOJIS.XEMOJI} **Le graphique \`${args.args[0]}\` m'est inconnu.**\n${EMOJIS.RIGHTARROW} Voici les graphiques disponibles: \`${dispos.join("`, `")}\``);
                    return;
            }
        }

        args.message.channel.send(embed);
    }
}