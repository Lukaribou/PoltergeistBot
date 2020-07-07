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

        let chart = new QuickChart()
            .setType('line')
            .setXLabels(data.map((v) => v.monthName))
            .addData(
                'Membres',
                data.map((v) => v.members),
                { fill: false, borderColor: '#19CF55' })
            .addData(
                'Messages (en milliers)',
                data.map((v) => (v.messages / 1000).toFixed(2)),
                { fill: false, borderColor: '#FF5' })
            .addData(
                'Salons',
                data.map((v) => v.channels),
                { fill: false, borderColor: '#00F' })
            .setTextColor('#FFF')
            .setBackgroundColor('transparent');

        args.message.channel.send(new MessageEmbed()
            .setAuthor(`Données de ${ds.monthName} ${ds.year} (${data.length} mois enregistrés)`,
                args.message.guild.iconURL({ dynamic: true }),
                'https://github.com/Lukaribou/PoltergeistBot')
            .addField('Membres:', ds.members, true)
            .addField('Messages:', ds.messages, true)
            .addField('Salons', ds.channels, true)
            .setImage(await chart.getUrl()));
    }
}