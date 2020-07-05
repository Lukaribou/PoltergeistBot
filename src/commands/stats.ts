import { Command, CommandParams, statsDb } from "../utils/structs";
import { MessageEmbed } from "discord.js";
import QuickChart = require("quickchart-js");

export default class StatsCommand extends Command {
    name = 'stats';
    desc = 'Affiche des stats sur le serveur';
    usage = 'stats';
    categorie = 'Informations';

    async execute(args: CommandParams): Promise<void> {
        const data = statsDb.stats;

        args.message.channel.send(new MessageEmbed()
            .setImage(
                await new QuickChart()
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
                            }]
                        },
                        options: {
                            legend: {
                                labels: {
                                    fontColor: '#FFF'
                                },
                            },
                            scales: {
                                yAxes: [{
                                    ticks: {
                                        fontColor: '#FFF'
                                    },
                                }],
                                xAxes: [{
                                    ticks: {
                                        fontColor: '#FFF'
                                    },
                                }]
                            }
                        }
                    })
                    .setBackgroundColor('transparent')
                    .getShortUrl()
            ));
    };
}