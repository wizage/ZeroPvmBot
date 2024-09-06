import dotenv from 'dotenv';
dotenv.config();
import { IntentsBitField } from 'discord.js';
import { Client } from 'discordx';
import { dirname, importx } from '@discordx/importer';

export class Main {
  private static _client: Client;

  static get Client(): Client {
    return this._client;
  }

  static async start(): Promise<void> {
    this._client = new Client({
      botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.MessageContent,
      ],
    });

    this._client.once('ready', async () => {
      // An example of how guild commands can be cleared
      //
      // await this._client.clearApplicationCommands(
      //   ...this._client.guilds.cache.map((guild) => guild.id)
      // );

      await this._client.initApplicationCommands();

      this._client.user?.setActivity('Welcome to ZerO PvM (Old School)');

      console.log('>> Bot started');
    });

    this._client.on('interactionCreate', (interaction) => {
      this._client.executeInteraction(interaction);
    });

    await importx(`${dirname(import.meta.url)}/commands/**/*.{js,ts}`);

    await this._client.login(process.env.DISCORDTOKEN ?? '');
  }
}

Main.start();
