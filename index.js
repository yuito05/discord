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
  "ITZY": ["Yeji", "Lia", "Ryujin", "Chaeryeong", "Yuna"],
  "NMIXK": ["Haewon", "Lily", "Sullyoon", "Jinni", "Bae", "Jiwoo", "Kyujin"],
  "ILLIT": ["Yunah", "Minju", "Moka", "Wonhee", "Iroha"],
  "KISS OF LIFE": ["Julie", "Natty", "Belle", "Haneul"],
  "TRIPLE S": ["Yubin", "Kaede", "SeoYeon", "Hyerin"],
  "FROMIS 9": ["Saerom", "Hayoung", "Gyuri", "Jiwon", "Jisun", "Seoyeon", "Chaeyoung", "Nagyung", "Jiheon"],
  "LOONA": ["Heejin", "Hyunjin", "Haseul", "Yeojin", "Vivi", "Kim Lip", "Jinsoul", "Choerry", "Yves", "Chuu", "Go Won", "Olivia Hye"],
  "H1KEY": ["Seoi", "Riina", "Hwiseo", "Yel"],
  "STAYC": ["Sumin", "Sieun", "Isa", "Seeun", "Yoon", "J"],
  "(G)I-DLE": ["Soyeon", "Minnie", "Miyeon", "Yuqi", "Shuhua"],
  "XG": ["Jurin", "Chisa", "Cocona", "Hinata", "Juria", "Maya", "Harvey"],
  "BLACKPINK": ["Jisoo", "Jennie", "Rosé", "Lisa"],
  "KEPLER": ["Yujin", "Mashiro", "Xiaoting", "Chaehyun", "Dayeon", "Hikaru", "Bahiyyih", "Youngeun", "Yeseo"],
  "NIZIU": ["Mako", "Rio", "Maya", "Riku", "Ayaka", "Mayuka", "Rima", "Miihi", "Nina"]
};

function createGroupButtons() {
  const rows = [];
  let currentRow = new ActionRowBuilder();
  let count = 0;
  let total = 0;

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
    total++;
  }

  if (count > 0) rows.push(currentRow);
  console.log(`🧩 ボタン数: ${total}, 行数: ${rows.length}`);
  return rows;
}

async function sendOrUpdateEmbed() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel) return console.error('❌ チャンネルが見つかりません');

    const messages = await channel.messages.fetch({ limit: 10 });
    const botMessages = messages.filter(msg => msg.author.id === client.user.id);
    const lastMessage = botMessages.first();

    if (lastMessage) {
      try {
        await lastMessage.delete();
        console.log('🗑️ 古いメッセージ削除完了');
      } catch (err) {
        console.warn('⚠️ 削除失敗:', err.message);
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

// ✅ ExpressでUptimeRobotのPingに応答
const app = express();
app.get('/', (_, res) => res.send('Bot is alive!'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Webサーバー起動済み on port ${PORT}`));
