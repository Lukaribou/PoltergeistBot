import { bot } from './index';
import { Message, TextChannel, MessageReaction, User } from 'discord.js';
import { Command, EMOJIS, mutedRole, botsListDb } from './utils/structs';
import { sendDM } from './utils/functions'

export function onReady(): void {
  (<TextChannel>bot.guilds.cache.first().channels.cache
    .get("712578364577153024")).messages.fetch("712580174360739871")
    .catch(() => { });
  (<TextChannel>bot.guilds.cache.first().channels.cache
    .get("747048325068357652")).messages.fetch("747076120033230929")
    .catch(() => { });
  console.log(`Connecté sur ${bot.guilds.cache.first()}, ${bot.guilds.cache.first().memberCount} membres et ${bot.guilds.cache.first().channels.cache.size} salons.`);

  updateStatus();
}

export async function onMessage(message: Message): Promise<void> {
  if (message.author.bot
    || !["text", "news", "shop"].includes(message.channel.type)) return;
  if (message.content.trim() === `<@!${bot.user.id}>`) {
    message.channel.send(`${EMOJIS.RIGHTARROW} \`${bot.config.prefix}help\``);
    return;
  };

  if (!message.member.hasPermission("ADMINISTRATOR")
    && message.channel.id != '706498863158263828') {
    if (!bot.cooldown.fast.includes(message.author.id)) {
      bot.cooldown.fast.push(message.author.id);
      setTimeout(() =>
        bot.cooldown.fast = bot.cooldown.fast
          .filter(x => x !== message.author.id),
        1e3);
    } else {
      if (bot.cooldown.warns.has(message.author.id)) {
        bot.cooldown.warns.set(
          message.author.id,
          bot.cooldown.warns.get(message.author.id) + 1)
        switch (bot.cooldown.warns.get(message.author.id)) {
          case 3:
            message.channel.send(`${EMOJIS.WARNINGEMOJI} ${message.author.id} **Si vous continuez de spammer vous serez sanctionné(e) !**`);
            break;
          case 5:
            message.guild.members.cache
              .filter(m => m.hasPermission("ADMINISTRATOR")
                && !m.user.bot
                && m.user.presence.status !== "offline"
                && m.id !== bot.config.ownerId)
              .forEach(m =>
                sendDM(m, `${message.author} **(Pseudo: \`${message.author.username}\`, ID: \`${message.author.id}\`) a atteint les 5 warns du système anti-spam !**`)
                  .catch(() => { }));

            sendDM(bot.config.ownerId, `${message.author} **(Pseudo: \`${message.author.username}\`, ID: \`${message.author.id}\`) a atteint les 5 warns du système anti-spam !**`)
              .catch(() => { });
            message.channel.send(`${EMOJIS.ADMINSEMOJI} **Un membre du staff a été prévenu.**`);
            break;
          case 7:
            message.member.roles
              .add(mutedRole, "[Système anti-spam] Palié 4 atteint, sanction automatique.")
              .then(() => {
                message.channel.send(`${EMOJIS.ADMINSEMOJI} ${message.author} **s'est fait mute pour spam.**`);
                setTimeout(() =>
                  message.member.roles.remove(mutedRole)
                    .catch(() => { }),
                  1.8e6);
              })
              .catch(() => { });
            break;
          default:
          //
        }
        setTimeout(() => decCooldownWarn(message.author), 3e5);
      } else {
        bot.cooldown.warns.set(message.author.id, 1);
        setTimeout(() => decCooldownWarn(message.author), 2e4)
      }
      await message.delete().catch(() => { });
      message.channel.send(`${EMOJIS.WARNINGEMOJI} ${message.author} **Le salon général possède un cooldown de 1 seconde.**`)
        .then((m) => m.delete({ timeout: 2e3 }).catch(() => { }));
      return;
    }
  }

  if (message.content.includes('discord.gg/')
    && !message.member.hasPermission('ADMINISTRATOR')) {
    message.delete({ reason: 'Comporte une invitation Discord' })
      .catch(() => { });
    message.channel.send(`${EMOJIS.ADMINSEMOJI} **Les invitations Discord sont interdites sur le serveur.**`);
    return;
  }

  if (!message.content.toLowerCase().startsWith(bot.prefix)) return;

  const command: string = message.content
    .split(" ")[0]
    .substring(bot.prefix.length)
    .toLowerCase();
  const args: string[] = message.content.split(" ").slice(1);

  if (bot.commands.has(command) || bot.aliases.has(command)) {
    const comm: Command = bot.commands.get(command)
      || bot.aliases.get(command);
    message.delete().catch(() => { });
    comm.execute({ args: args, message: message, bot: this })
      .catch(() => { });
  }
}

export async function onReactionAdd(reaction: MessageReaction, user: User): Promise<void> {
  var em = botsListDb.reactionRoles.list.filter(x => x[1] == reaction.emoji.name)[0]
  if (!reacTest(reaction)
    || bot.guilds.cache.first().member(user).roles.cache.has(em[0])) return;
  bot.guilds.cache.first().member(user).roles.add(em[0]).catch(() => { });
}

export async function onReactionRemove(reaction: MessageReaction, user: User): Promise<void> {
  var em = botsListDb.reactionRoles.list.filter(x => x[1] == reaction.emoji.name)[0]
  if (!reacTest(reaction)
    || !bot.guilds.cache.first().member(user).roles.cache.has(em[0])) return;
  bot.guilds.cache.first().member(user).roles.remove(em[0]).catch(() => { });
}

const reacTest = (reaction: MessageReaction) =>
  reaction.message.channel.type === 'text'
  && (reaction.message.id === botsListDb.reactionRoles.messageId || reaction.message.id === "747076120033230929")
  && botsListDb.reactionRoles.list.map(x => x[1]).includes(reaction.emoji.name);

/**
 * Actualise le statut du bot
 */
export function updateStatus(): void {
  bot.user.setActivity(`${bot.config.prefix}help, ${bot.guilds.cache.first().channels.cache.size} salons pour ${bot.guilds.cache.first().memberCount} membres`, { type: "WATCHING", }); // Configurer le "Joue à"
}

function decCooldownWarn(u: User) {
  let temp = bot.cooldown.warns.get(u.id);
  temp === 1 ? bot.cooldown.warns.delete(u.id) : bot.cooldown.warns.set(u.id, temp - 1);
}