/* eslint-disable @typescript-eslint/no-loop-func */
import { ActionRowBuilder, CommandInteraction, ModalBuilder, PermissionFlagsBits, TextInputBuilder, TextInputStyle, TextChannel, ModalSubmitInteraction, EmbedBuilder, ButtonBuilder, MessageActionRowComponentBuilder, ButtonInteraction, ChannelType, PermissionsBitField, User, StringSelectMenuBuilder, StringSelectMenuInteraction, Role, GuildMemberRoleManager, GuildMember, AttachmentBuilder, ThreadAutoArchiveDuration } from 'discord.js';
import { Discord, Slash, SlashOption, SlashGroup, ModalComponent, ButtonComponent, SelectMenuComponent } from 'discordx';
import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import { EMOJI_VALUES, EMOJI_VALUES_PROD } from '../constants/greetings_constant.js';
import { Readable } from 'stream';
import { Archive } from '../types/Mod.js';

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
    const [info] = ['info'].map((id) =>
      interaction.fields.getTextInputValue(id),
    );

    const channelId = interaction.customId.split('-')[1];
    const channel = interaction.guild!.channels.cache.get(channelId) as TextChannel;
    
    const signup = new EmbedBuilder()
      .setTitle('**Apply now**') 
      .setDescription(info);
    const applyNow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket-Application')
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
    let emojis = EMOJI_VALUES;
    let parentCategory = '';
    let leadershipRole = '';
    if (guild!.id == '1230517503554486362') {
      emojis = EMOJI_VALUES_PROD;
      parentCategory = '1230517505815216260';
      leadershipRole = '1230517503772590110';
    } else if (guild!.id == '1281481181828747318') {// Test server
      parentCategory = '1281481495818666015';
      leadershipRole = '1281498522830508032';
    }

    const newChannel = await guild?.channels.create({
      name: `${user.username}-${type}`,
      type: ChannelType.GuildText,
      parent: parentCategory,
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
          id: leadershipRole,
          allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ViewChannel],
        },
        //Add council eventually
      ],
      // your permission overwrites or other options here
    });

    const ticket = new EmbedBuilder()
      .setTitle(`**Application for ${user.username}**`)
      .setDescription(`Hello <@${user.id}>! Please review the requirments below and upload a screenshot of your skills and gear! \n \n__Requirements__:`)
      .addFields([
        { name:'Skills', value:`
          ⬥ Lvl 60+ ${emojis.defence} ${emojis.attack} ${emojis.strength} ${emojis.range} ${emojis.magic} ${emojis.prayer} ${emojis.hitpoints}
          ⬥ Lvl 52+ ${emojis.herblore}` },
        { name:'Magic', value:`
        ⬥ ${emojis.mystic} Mystic Set
        ⬥ ${emojis.iban} Iban's Staff
        ⬥ ${emojis.godCape} God Cape
        ⬥ ${emojis.runePouch} Rune Pouch` },
        { name:'Range Gear', value:`
        ⬥ ${emojis.blackDhide} Black D'hide Set
        ⬥ ${emojis.rcbow} Rune Crossbow
        ⬥ ${emojis.ava} Ava's Accumulator
        ⬥ ${emojis.blackDhide} Blessed/Black D'Hide
        ⬥ ${emojis.glory} Amulet of Glory` },
        { name:'Melee Gear', value:`
        ⬥ ${emojis.fireCape} Fire Cape
        ⬥ ${emojis.neitz} Helm of Neitiznot
        ⬥ ${emojis.torso} Fighter Torso
        ⬥ ${emojis.zombieAxe} Zombie Axe
        ⬥ ${emojis.dDefender} Dragon Defender
        ⬥ ${emojis.bring} Berserker's Ring` },
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
    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(
      ticketInfo,
    );
    modal.addComponents(row1);

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
    let logChannelId = '';
    if (guild!.id == '1230517503554486362') {
      logChannelId = '1283134429258186866';
    } else if (guild!.id == '1281481181828747318') {// Test server
      logChannelId = '1281481441141592085';
    }
    this.addRole(interaction, user!, role);

    const archive = await this.archiveChannel({ channel: interaction.channel });
    const file = new AttachmentBuilder(archive.chatLog, { name: 'archive.txt' });
    let fileArray: AttachmentBuilder[] = [];
    archive.files.forEach((url) => {
      const ssFile = new AttachmentBuilder(url);
      fileArray.push(ssFile);
    });

    const approvalLog = new EmbedBuilder()
      .setTitle('**New Approval**') 
      .setDescription(`User <@${user!.id}> has been approved for ${roleLabel} by <@${interaction.user.id}>`);
    const logChannel = guild?.channels.cache.get(logChannelId) as TextChannel;
    const approveThread = await logChannel.threads.create({
      name: `${user!.displayName} application`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
    });
    await approveThread.send({ embeds: [approvalLog] });
    await approveThread.send({ files: [file] });
    if (fileArray.length > 0) {
      await approveThread.send({ files: fileArray });
    }
    await user?.send({ content: `You have been approved for ${roleLabel} by <@${interaction.user.id}>` });
    await interaction.followUp({ content: `Role ${roleLabel} added to ${user!.displayName}`, ephemeral: true });
    await interaction.channel?.delete();
    return;
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

  private async archiveChannel({ channel: Channel }): Promise<Archive> {
    const messages = await Channel.messages.fetch({ limit: 100 });
    let archive: Archive = { chatLog: new Readable(), files: [] };
    let textFile = 'Log file\n';
    let attachmentCount = 1;
    for (const message of messages.reverse().values()) {
      textFile += `${message.author.username}: ${message.content}`;
      if (message.attachments.size > 0 && message.attachments !== undefined) {
        message.attachments.forEach(attachment => {
          textFile += `<Attachment ${attachmentCount}>`;
          archive.files.push(attachment.url);
          attachmentCount += 1;
        });
      }
      textFile += '\n';
    }
    var stream = new Readable();
    stream._read = () => {};
    stream.push(textFile);
    stream.push(null);
    archive.chatLog = stream;
    return archive;
  }

  @ModalComponent({ id:/(denyform-*)\S+/ })
  async denyModal(interaction: ModalSubmitInteraction): Promise<void> {
    await interaction.deferUpdate();
    const [reasonInternal, reasonExternal] = ['reasonInternal', 'reasonExternal'].map((id) =>
      interaction.fields.getTextInputValue(id),
    );
    const archive = await this.archiveChannel({ channel: interaction.channel });
    const file = new AttachmentBuilder(archive.chatLog, { name: 'archive.txt' });
    let fileArray: AttachmentBuilder[] = [];
    archive.files.forEach((url) => {
      const ssFile = new AttachmentBuilder(url);
      fileArray.push(ssFile);
    });

    const userId = interaction.customId.split('-')[1];
    const guild = await interaction.guild?.fetch();
    const user = guild!.members.cache.get(userId);
    let logChannelId = '';
    if (guild!.id == '1230517503554486362') {
      logChannelId = '1283134429258186866';
    } else if (guild!.id == '1281481181828747318') {// Test server
      logChannelId = '1281481441141592085';
    }
    
    const denyLog = new EmbedBuilder()
      .setTitle('**New Denial**')
      .setDescription(`User <@${user!.id}> has been denied by <@${interaction.user.id}>`)
      .addFields([{ name:'Internal Reason', value: reasonInternal },
        { name:'External Reason', value: reasonExternal }]);
    const logChannel = guild?.channels.cache.get(logChannelId) as TextChannel;
    const denyThread = await logChannel.threads.create({
      name: `${user!.displayName} application`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
    });
    await denyThread.send({ embeds: [denyLog] });
    await denyThread.send({ files: [file] });
    if (fileArray.length > 0) {
      await denyThread.send({ files: fileArray });
    }
    await user?.send({ content: `You have been denied by <@${interaction.user.id}>\n\n Reason: ${reasonExternal}` });
    await interaction.followUp({ content: `<@${user!.id}> has been denied`, ephemeral: true });
    await interaction.channel?.delete();
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