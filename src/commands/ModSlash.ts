import { ActionRowBuilder, CommandInteraction, ModalBuilder, PermissionFlagsBits, TextInputBuilder, TextInputStyle, TextChannel, ModalSubmitInteraction, EmbedBuilder, ButtonBuilder, MessageActionRowComponentBuilder, ButtonInteraction, ChannelType, PermissionsBitField, User, StringSelectMenuBuilder, StringSelectMenuInteraction, Role, GuildMemberRoleManager, GuildMember } from 'discord.js';
import { Discord, Slash, SlashOption, SlashGroup, ModalComponent, ButtonComponent, SelectMenuComponent } from 'discordx';
import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import { EMOJI_VALUES } from '../constants/greetings_constant.js';

const overloads = {
  'application': 'Application',
};

const rolesAvailable = [
  { label: 'Entry', value: 'entry' },
  { label: 'Learning to Raid', value: 'earlyraid' },
  { label: 'Experienced Raider', value: 'raider' },
  { label: 'First Mega Rare', value: 'megahunter' },
];

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
    await interaction.deferUpdate();
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

  @SelectMenuComponent({ id:/(role-select-*)\w+/ })
  async roleSelection(interaction: StringSelectMenuInteraction) : Promise<unknown> {
    await interaction.deferReply({ ephemeral: true });
    const role = interaction.values[0];
    const roleLabel = rolesAvailable.find((roleObj) => roleObj.value == role)?.label;
    const parameters = interaction.customId.split('-');
    const userId = parameters[2];
    const guild = await interaction.guild?.fetch();
    const user = guild!.members.cache.get(userId);
    this.addRole(interaction, user!, role);
    const approvalLog = new EmbedBuilder()
      .setTitle('**New Approval**') 
      .setDescription(`User <@${user!.id}> has been approved for ${roleLabel} by <@${interaction.user.id}>`);
    const logChannel = guild?.channels.cache.get('1281481441141592085') as TextChannel;
    logChannel.send({ embeds: [approvalLog] });
    user?.send({ content: `You have been approved for ${roleLabel} by <@${interaction.user.id}>` });
    return interaction.followUp({ content: `Role ${roleLabel} added to ${user!.displayName}`, ephemeral: true });
  }

  private async addRole(interaction: StringSelectMenuInteraction, user: GuildMember, roleName: string) {
    let guild = await interaction.guild?.fetch();

    let role = guild?.roles.cache.find( (r: Role) => r.name == roleName);
    if (!role) {
      await guild?.roles.create({
        name: roleName,
      });
      role = guild?.roles.cache.find((r: Role) => r.name == roleName);
    }
    const rolesAva = rolesAvailable.map((temprole) => temprole.value);
    // Get current roles
    let currentRoles = (user.roles as GuildMemberRoleManager).cache.filter((roleFilter: Role) => (rolesAva.includes(roleFilter.name)));
    // 
    currentRoles.forEach((current_role: Role) => {
      if (current_role.name != roleName) {
        (user.roles as GuildMemberRoleManager).remove(current_role);
      }
    });
    if (role) {
      (user.roles as GuildMemberRoleManager).add(role);
    }
  }

  @ModalComponent({ id:/(denyform-*)\S+/ })
  async denyModal(interaction: ModalSubmitInteraction): Promise<void> {
    await interaction.deferUpdate();
    const [reasonInternal, reasonExternal] = ['reasonInternal', 'reasonExternal'].map((id) =>
      interaction.fields.getTextInputValue(id),
    );

    const userId = interaction.customId.split('-')[1];
    const guild = await interaction.guild?.fetch();
    const user = guild!.members.cache.get(userId);
    
    const denyLog = new EmbedBuilder()
      .setTitle('**New Denial**') 
      .setDescription(`User <@${user!.id}> has been denied by <@${interaction.user.id}>`)
      .addFields([{ name:'Internal Reason', value: reasonInternal },
        { name:'External Reason', value: reasonExternal }]);
    const logChannel = guild?.channels.cache.get('1281481441141592085') as TextChannel;
    logChannel.send({ embeds: [denyLog] });
    user?.send({ content: `You have been denied by <@${interaction.user.id}>\n\n Reason: ${reasonExternal}` });
    interaction.followUp({ content: `<@${user!.id}> has been denied`, ephemeral: true });
  }
  
  @Slash({ name: 'application-handle', description: 'Approve/deny user' })
  @SlashGroup('mod')
  async approvePlayer(
    @SlashOption({
      description: 'What player to approve',
      name: 'username',
      required: true,
      type: ApplicationCommandOptionType.User,
    })
    user: User,
    @SlashOption({
      description: 'Approve or deny',
      name:'aproved',
      required: true,
      type: ApplicationCommandOptionType.Boolean,
    })
    approved: boolean,
    interaction: CommandInteraction,
  ) {
    if (approved) {
      await interaction.deferReply({ ephemeral: true });
      const roleSelect = new StringSelectMenuBuilder()
        .addOptions(rolesAvailable)
        .setCustomId(`role-select-${user.id}`);
      const buttonRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(roleSelect);

      interaction.editReply({ content: `Select role to assign ${user.displayName}`, components: [buttonRow] });
    } else {
      const modal = new ModalBuilder()
        .setTitle('Application Deny Form')
        .setCustomId(`denyform-${user.id}`);
      const reasonInternal = new TextInputBuilder()
        .setCustomId('reasonInternal')
        .setLabel('Reason for denial (internal)')
        .setStyle(TextInputStyle.Paragraph);
      const reasonExternal = new TextInputBuilder()
        .setCustomId('reasonExternal')
        .setLabel('Reason for denial (external)')
        .setStyle(TextInputStyle.Paragraph);
      const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(
        reasonInternal,
      );
      const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(
        reasonExternal,
      );
      modal.addComponents(row1, row2);

      interaction.showModal(modal);
    }
    
  }
}