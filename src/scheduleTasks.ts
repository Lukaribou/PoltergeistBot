import { scheduleJob } from "node-schedule";
import { bot } from ".";
import { daysBetween, getMemberCategory, saveDB } from "./utils/functions";
import { GuildMember, CategoryChannel, TextChannel, Collection } from "discord.js";
import { EMOJIS, statsDb } from "./utils/structs";

scheduleJob('0 0 0 * * *', () => { // Suppression salons inutilisés
    bot.guilds.cache.first().members.cache
        .filter(gm => daysBetween(gm.joinedTimestamp) > 7) // Rejoint +7j
        .forEach(async (gm: GuildMember) => {
            var categ: CategoryChannel = getMemberCategory(gm);

            if (categ) {
                var liste: string[] = [];

                categ.children
                    .filter((c: TextChannel) => daysBetween(c.createdTimestamp) > 7) // Salons vieux +7j
                    .forEach(async (c: TextChannel) => {
                        if ((await c.messages.fetch({ limit: 1 }).catch(() => new Collection)).size === 0) {// => 0 message
                            c.delete('[Suppression automatique] - Salon inutilisé').catch(() => { });
                            liste.push(c.name);
                        }
                    });

                categ.fetch()
                    .then((c) => {
                        if (c.children.size === 0) {
                            categ.delete('[Suppression automatique] - 0 salon').catch(() => { }); // On supprime aussi la catégorie
                            gm.user.send(`${EMOJIS.WARNINGEMOJI} [__Message automatique__] - Votre catégorie et ses salons ont été **supprimés** de \`${categ.guild.name}\` car vous ne les avez **jamais utilisés**.`).catch(() => { });
                            return;
                        }
                    })
                    .catch(() => { })

                if (liste.length !== 0) // Salons supprimés mais pas tous
                    gm.user.send(`${EMOJIS.WARNINGEMOJI} [__Message automatique__] - Le(s) salon(s) "\`${liste.join('`, `')}\`" a/ont été **supprimé(s)** de votre catégorie sur \`${categ.guild.name}\` car vous ne les avez **jamais utilisés.**`).catch(() => { });
            }
        });
});

scheduleJob('0 0 0 1 * *', () => { // Chaque nouveau mois
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const guild = bot.guilds.cache.first();
    statsDb.monthly.push({
        monthName: months[new Date().getMonth()],
        year: new Date().getFullYear(),
        members: guild.members.cache.filter(m => !m.user.bot).size,
        messages: 0,
        channels: guild.channels.cache.size
    });
    saveDB('stats');
});