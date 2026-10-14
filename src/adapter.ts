import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  type Client,
  type Interaction,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import type { Port } from "./flow.js";
import { copy, type Language } from "./review.js";
export const required =
  PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages;
export function permitted(
  type: number,
  actualGuild: string,
  guild: string,
  user: bigint | undefined,
  bot: bigint | undefined,
) {
  const has = (bits: bigint | undefined) =>
    bits !== undefined &&
    ((bits & PermissionFlagsBits.Administrator) !== 0n ||
      (bits & required) === required);
  return (
    actualGuild === guild &&
    (type === ChannelType.GuildText ||
      type === ChannelType.GuildAnnouncement) &&
    has(user) &&
    has(bot)
  );
}
export function command() {
  return new SlashCommandBuilder()
    .setName("altsprout")
    .setDescription(
      "Privately review an image description, then choose whether to share",
    )
    .setDescriptionLocalizations({
      tr: "Görsel açıklamasını özel olarak gözden geçir, sonra paylaşmayı seç",
    })
    .setDefaultMemberPermissions(required)
    .addStringOption((o) =>
      o
        .setName("language")
        .setDescription("Review language / İnceleme dili")
        .addChoices(
          { name: "English", value: "en" },
          { name: "Türkçe", value: "tr" },
        ),
    );
}
export function modal(lang: Language) {
  const c = copy[lang];
  return new ModalBuilder()
    .setCustomId(`as:write:${lang}`)
    .setTitle(c.title)
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("description")
          .setLabel(c.label)
          .setStyle(TextInputStyle.Paragraph)
          .setMinLength(1)
          .setMaxLength(600)
          .setRequired(true)
          .setPlaceholder(c.placeholder),
      ),
    );
}
export function controls(nonce: string, lang: Language) {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`as:share:${nonce}`)
        .setStyle(ButtonStyle.Primary)
        .setLabel(copy[lang].share),
      new ButtonBuilder()
        .setCustomId(`as:discard:${nonce}`)
        .setStyle(ButtonStyle.Secondary)
        .setLabel(copy[lang].discard),
    ),
  ];
}
export async function publisher(
  client: Client,
  guildId: string,
  channelId: string,
  userId: string,
) {
  const guild = await client.guilds.fetch(guildId);
  await guild.roles.fetch();
  const channel = await guild.channels.fetch(channelId, {
    force: true,
    cache: false,
  });
  if (!channel || !client.user) return null;
  const member = await guild.members.fetch({
    user: userId,
    force: true,
    cache: false,
  });
  const me = await guild.members.fetch({
    user: client.user.id,
    force: true,
    cache: false,
  });
  if (
    !permitted(
      channel.type,
      channel.guildId,
      guildId,
      channel.permissionsFor(member)?.bitfield,
      channel.permissionsFor(me)?.bitfield,
    )
  )
    return null;
  if (
    channel.type !== ChannelType.GuildText &&
    channel.type !== ChannelType.GuildAnnouncement
  )
    return null;
  return async (content: string) => {
    await channel.send({
      content,
      allowedMentions: { parse: [], repliedUser: false },
      flags: MessageFlags.SuppressEmbeds,
    });
  };
}
export function adapt(
  i: Interaction,
  client: Client,
  guildId: string,
): Port | null {
  if (!i.isChatInputCommand() && !i.isModalSubmit() && !i.isButton())
    return null;
  const port: Port = {
    kind: i.isChatInputCommand()
      ? "command"
      : i.isModalSubmit()
        ? "modal"
        : "button",
    name: i.isChatInputCommand() ? i.commandName : i.customId,
    binding: {
      owner: i.user.id,
      guild: i.guildId ?? "",
      channel: i.channelId ?? "",
      application: i.applicationId,
    },
    bot: client.user?.id ?? "",
    locale: i.locale,
    message: i.isButton()
      ? {
          id: i.message.id,
          author: i.message.author.id,
          webhook: i.message.webhookId,
          ephemeral: i.message.flags.has(MessageFlags.Ephemeral),
        }
      : null,
    getLanguage: () =>
      i.isChatInputCommand() ? i.options.getString("language") : null,
    getText: () =>
      i.isModalSubmit() ? i.fields.getTextInputValue("description") : "",
    modal: async (lang) => {
      if (i.isChatInputCommand()) await i.showModal(modal(lang));
    },
    reply: async (content) => {
      await i.reply({
        content,
        flags: MessageFlags.Ephemeral | MessageFlags.SuppressEmbeds,
        allowedMentions: { parse: [] },
      });
    },
    defer: async () => {
      await i.deferReply({ flags: MessageFlags.Ephemeral });
    },
    edit: async (content, buttons) => {
      const message = await i.editReply({
        content,
        components: buttons ? controls(buttons.nonce, buttons.lang) : [],
        allowedMentions: { parse: [] },
        flags: MessageFlags.SuppressEmbeds,
      });
      return message.id;
    },
    acknowledge: async () => {
      if (i.isButton()) await i.deferUpdate();
    },
    publisher: () => publisher(client, guildId, i.channelId ?? "", i.user.id),
  };
  return port;
}
