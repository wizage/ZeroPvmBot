import { ActionRowBuilder, CommandInteraction, ModalBuilder, PermissionFlagsBits, TextInputBuilder, TextInputStyle, TextChannel, ModalSubmitInteraction, EmbedBuilder, ButtonBuilder, MessageActionRowComponentBuilder, ButtonInteraction, ChannelType, PermissionsBitField, Emoji } from 'discord.js';
import { Discord, Slash, SlashOption, SlashGroup, ModalComponent, ButtonComponent } from 'discordx';
import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import { EMOJI_VALUES } from '../constants/greetings_constant.js';

const overloads = {
  'application': 'Application',
}
const adminBits = PermissionFlagsBits.KickMembers;

@Discord()
@SlashGroup({ name: 'mod', description: 'Commands for oyster competition', defaultMemberPermissions: adminBits })
export abstract class ClueSlash {

  @ModalComponent({ id:/(setupappchannel-*)\S+/ })
  async setupappchannel(interaction: ModalSubmitInteraction): Promise<void> {
    await interaction.deferUpdate();
    const [info, type] = ['info', 'type'].map((id) =>
      interaction.fields.getTextInputValue(id),
    );

    const channelId = interaction.customId.split('-')[1];
    const channel = interaction.guild!.channels.cache.get(channelId) as TextChannel;
    
    const signup = new EmbedBuilder()
      .setTitle('**Apply now**') 
      .setDescription(info);
    const applyNow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket-${type}`)
        .setLabel('Apply Now')
        .setStyle(1),
    );
    channel!.send({ embeds: [signup], components: [applyNow] });
  }

  @ButtonComponent({ id:/(ticket-*)\S+/ })
  async ticketCreate(interaction: ButtonInteraction): Promise<void> {
    await interaction.deferUpdate({ ephemeral: true });
    let guild = await interaction.guild?.fetch();
    const type = interaction.customId.split('-')[1];
    const user = interaction.user;

    const newChannel = await guild?.channels.create({
      name: `${user.username}-${type}`,
      type: ChannelType.GuildText,
      parent: '1281481495818666015',
      permissionOverwrites:
      [
        {
          id: guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: user.id,
          allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: '1281498522830508032',
          allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel],
        },
        //Add council eventually
      ],
      // your permission overwrites or other options here
    });

    const ticket = new EmbedBuilder()
      .setTitle(`**${overloads[type]} for ${user.username}**`)
      .setDescription(`Hello <@${user.id}>! Please review the requirments below and upload a screenshot of your skills and gear! \n \n__Requirements__:`)
      .addFields([{ name:'Magic', value:`
        ⬥ ${EMOJI_VALUES.mystic} Mystic Set
        ⬥ ${EMOJI_VALUES.iban} Iban's Staff
        ⬥ ${EMOJI_VALUES.godCape} God Cape
        ⬥ ${EMOJI_VALUES.runePouch} Rune Pouch` },
      { name:'Range Gear', value:`
        ⬥ ${EMOJI_VALUES.blackDhide} Black D'hide Set
        ⬥ ${EMOJI_VALUES.ava} Ava's Accumulator
        ⬥ ${EMOJI_VALUES.blackDhide} Blessed/Black D'Hide
        ⬥ ${EMOJI_VALUES.glory} Amulet of Glory` },
      { name:'Melee Gear', value:`
        ⬥ ${EMOJI_VALUES.fireCape} Fire Cape
        ⬥ ${EMOJI_VALUES.neitz} Helm of Neitiznot
        ⬥ ${EMOJI_VALUES.torso} Fighter Torso
        ⬥ ${EMOJI_VALUES.zombieAxe} Zombie Axe
        ⬥ ${EMOJI_VALUES.dDefender} Dragon Defender
        ⬥ ${EMOJI_VALUES.bring} Berserker's Ring` },
      ]);
    newChannel!.send({ embeds: [ticket] });
  }

  @Slash({ name: 'setup-app-channel', description: 'Setup Application Channel' })
  @SlashGroup('mod')
  async createTicketSystem(
    @SlashOption({
      description: 'Provide the channel',
      name: 'channel',
      required: true,
      type: ApplicationCommandOptionType.Channel,
    })
    channel: TextChannel,
    interaction: CommandInteraction,
  ) {
    const modal = new ModalBuilder()
      .setTitle('Application Channel Setup')
      .setCustomId(`setupappchannel-${channel.id}`);
    const ticketInfo = new TextInputBuilder()
      .setCustomId('info')
      .setLabel('Apply now message')
      .setStyle(TextInputStyle.Paragraph);
    const ticketType = new TextInputBuilder()
      .setCustomId('type')
      .setLabel('What should be the ticket type be')
      .setStyle(TextInputStyle.Short);
    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      ticketInfo,
    );
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      ticketType,
    );
    modal.addComponents(row1, row2);

    interaction.showModal(modal);
  }
}