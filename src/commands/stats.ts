import { Command, CommandParams, statsDb } from "../utils/structs";
import { MessageEmbed } from "discord.js";
import { Stats } from "../utils/stats";
import { QuickChart } from "../utils/chart";

export default class StatsCommand extends Command {
    name = 'stats';
    desc = 'Affiche des stats sur le serveur';
    usage = 'stats';
    categorie = 'Informations';

    async execute(args: CommandParams): Promise<void> {
        const data = statsDb.stats;
        const ds = Stats.getLast();

        args.message.channel.send(new MessageEmbed()
            .setAuthor(`Données de ${ds.monthName} ${ds.year} (${data.length} mois enregistrés)`,
                args.message.guild.iconURL({ dynamic: true }),
                'https://github.com/Lukaribou/PoltergeistBot')
            .addField('Membres:', ds.members, true)
            .addField('Messages:', ds.messages, true)
            .addField('Salons', ds.channels, true)
            .setImage(new QuickChart()
                .setConfig({
                    type: 'line',
                    data: {
                        labels: data.map((v) => v.monthName),
                        datasets: [{
                            label: 'Membres',
                            data: data.map((v) => v.members),
                            fill: false,
                            borderColor: '#19cf55'
                        }, {
                            label: 'Messages (en milliers)',
                            data: data.map((v) => (v.messages / 1000).toFixed(2)),
                            fill: false,
                            borderColor: '#FF5'
                        }, {
                            label: 'Salons',
                            data: data.map((v) => v.channels),
                            fill: false,
                            borderColor: '#00F'
                        }]
                    }
                })
                .setTextColor('#FFF')
                .setBackgroundColor('transparent')
                .generateUrl()));
    }
}