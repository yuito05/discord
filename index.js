require('dotenv').config();
console.log("TOKEN:", process.env.TOKEN);
const express = require('express');
const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const REQUIRED_ROLE_ID = process.env.REQUIRED_ROLE_ID;

const groupMembers = {
  "TWICE": ["Nayeon", "Jeongyeon", "Momo", "Sana", "Jihyo", "Mina", "Dahyun", "Chaeyoung", "Tzuyu"],
  // ...省略、全て同じ
  "NIZIU": ["Mako", "Rio", "Maya", "Riku", "Ayaka", "Mayuka", "Rima", "Miihi", "Nina"]
};

function createGroupButtons() {
  const rows = [];
  let currentRow = new ActionRowBuilder();
  let count = 0;
  for (const group of Object.keys(groupMembers)) {
    if (count >= 5) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder();
      count = 0;
    }
    currentRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`group_${group}`)
        .setLabel(group)
        .setStyle(ButtonStyle.Primary)
    );
    count++;
  }
  if (count > 0) rows.push(currentRow);
  return rows;
}

let lastMessage = null;

async function sendOrUpdateEmbed() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel) return console.error('❌ チャンネルが見つかりません');

    if (lastMessage) {
      try {
        await lastMessage.delete();
        console.log('🗑️ 前のメッセージ削除完了');
      } catch (err) {
        console.warn('⚠️ メッセージ削除失敗:', err.message);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('🎵 グループを選択してください')
      .setDescription('ボタンを押すと、そのグループのメンバー選択ができます！')
      .setColor(0x00AEFF)
      .setImage('https://i.imgur.com/dpvNDs6.jpeg');

    const sentMessage = await channel.send({
      embeds: [embed],
      components: createGroupButtons(),
    });

    lastMessage = sentMessage;
    console.log('📤 新しいメッセージ送信完了');
  } catch (error) {
    console.error('❌ sendOrUpdateEmbed() エラー:', error.message);
  }
}

client.once('ready', () => {
  console.log(`${client.user.tag} ログイン完了`);
  sendOrUpdateEmbed();
  setInterval(sendOrUpdateEmbed, 5 * 60 * 1000);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const customId = interaction.customId;

  if (customId.startsWith("group_")) {
    const groupName = customId.replace("group_", "");
    const members = groupMembers[groupName];
    if (!members) return;

    const hasAccess = interaction.member.roles.cache.has(REQUIRED_ROLE_ID);
    if (!hasAccess) {
      await interaction.reply({
        content: `You need the required role to select members.`,
        flags: 64
      });
      return;
    }

    const memberRows = [];
    let row = new ActionRowBuilder();
    let count = 0;
    for (const member of members) {
      if (count >= 5) {
        memberRows.push(row);
        row = new ActionRowBuilder();
        count = 0;
      }
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`member_${member}`)
          .setLabel(member)
          .setStyle(ButtonStyle.Secondary)
      );
      count++;
    }
    if (count > 0) memberRows.push(row);

    await interaction.reply({
      content: `Select a member from **${groupName}**:`,
      components: memberRows,
      flags: 64
    });
  }

  if (customId.startsWith("member_")) {
    const memberName = customId.replace("member_", "");
    const role = interaction.guild.roles.cache.find(r => r.name === memberName);
    if (!role) {
      await interaction.reply({ content: `Role "${memberName}" not found.`, flags: 64 });
      return;
    }

    const member = interaction.member;
    if (member.roles.cache.has(role.id)) {
      await interaction.reply({ content: `You already have the "${memberName}" role.`, flags: 64 });
    } else {
      await member.roles.add(role);
      await interaction.reply({ content: `Role "${memberName}" has been added to you!`, flags: 64 });
    }
  }
});

client.login(TOKEN);

// ✅ ExpressによるUptimeRobotのPing対応
const app = express();
app.get('/', (_, res) => res.send('Bot is alive!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Webサーバー起動済み on port ${PORT}`));
