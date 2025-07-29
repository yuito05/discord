require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const express = require('express');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const REQUIRED_ROLE_ID = process.env.REQUIRED_ROLE_ID;

const groupMembers = {
  "TWICE": ["Nayeon", "Jeongyeon", "Momo", "Sana", "Jihyo", "Mina", "Dahyun", "Chaeyoung", "Tzuyu"],
  "LE SSERAFIM": ["Kim Chaewon", "Sakura", "Huh Yunjin", "Kazuha", "Hong Eunchae"],
  "IVE": ["An Yujin", "Gaeul", "Rei", "Jang Wonyoung", "Liz", "Leeseo"],
  "AESPA": ["Karina", "Giselle", "Winter", "Ningning"],
  "NEWJEANS": ["Minji", "Hanni", "Danielle", "Haerin", "Hyein"],
  "ITZY": ["Yeji", "Lia", "Ryujin", "Chaeryeong", "Yuna"],
  "NMIXX": ["Haewon", "Lily", "Sullyoon", "Bae", "Jiwoo", "Kyujin"],
  "ILLIT": ["Yunah", "Minju", "Moka", "Wonhee", "Iroha"],
  "KISS OF LIFE": ["Julie", "Natty", "Belle", "Haneul"],
  "TRIPLE S": ["Kim YooYeon", "Mayu", "Xinyu", "Kim NaKyoung", "Park SoHyun", "Seo DaHyun", "Nien", "Yoon SeoYeon", "JiYeon", "Kotone", "Kim ChaeYeon", "Gong YuBin", "Lee JiWoo", "Kim SooMin", "Kwak YeonJi", "JooBin", "Jeong HaYeon", "Kim ChaeWon"],
  "FROMIS 9": ["Song Ha‑young", "Park Ji‑won", "Lee Chae‑young", "Lee Na‑gyung", "Baek Ji‑heon"],
  "LOONA": ["HeeJin", "HyunJin", "HaSeul", "ViVi", "Kim Lip", "JinSoul", "Chuu", "Go Won", "Choerry", "Yves", "YeoJin", "HyeJu"],
  "H1KEY": ["Seoi", "Riina", "Hwiseo", "Yel"],
  "STAYC": ["Sumin", "Sieun", "Isa", "Seeun", "Yoon", "J"],
  "(G)I-DLE": ["Miyeon", "Minnie", "Soyeon", "Yuqi", "Shuhua"],
  "XG": ["Jurin", "Chisa", "Hinata", "Harvey", "Juria", "Maya", "Cocona"],
  "BLACKPINK": ["Jisoo", "Jennie", "Rosé", "Lisa"],
  "KEPLER": ["Choi Yu‑jin", "Shen Xiaoting", "Kim Chae‑hyun", "Kim Da‑yeon", "Ezaki Hikaru", "Huening Bahiyyih", "Seo Young‑eun"],
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
      new ButtonBuilder().setCustomId(`group_${group}`).setLabel(group).setStyle(ButtonStyle.Primary)
    );
    count++;
  }
  if (count > 0) rows.push(currentRow);
  return rows;
}

let lastMessageId = null;

async function sendOrUpdateEmbed() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel) return console.log('❌ チャンネルが見つかりません');

    // 古いメッセージ削除（IDが記録されていれば）
    if (lastMessageId) {
      try {
        const oldMessage = await channel.messages.fetch(lastMessageId);
        if (oldMessage) await oldMessage.delete();
        console.log('🗑️ 前のメッセージを削除しました');
      } catch (err) {
        console.warn('⚠️ 古いメッセージ削除時にエラー:', err.message);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('🎵 グループを選択してください')
      .setDescription('ボタンを押すと、そのグループのメンバー選択ができます！')
      .setColor(0x00AEFF)
      .setImage('https://i.imgur.com/dpvNDs6.jpeg');

    const sent = await channel.send({
      embeds: [embed],
      components: createGroupButtons(),
    });

    lastMessageId = sent.id;
    console.log('✅ 新しいEmbedを送信しました');
  } catch (e) {
    console.error('❌ Embed送信失敗:', e);
  }
}

client.once('ready', () => {
  console.log(`${client.user.tag} 起動完了`);
  sendOrUpdateEmbed();
  setInterval(sendOrUpdateEmbed, 5 * 60 * 1000); // 5分ごとに更新
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const customId = interaction.customId;

  try {
    const member = await interaction.guild.members.fetch(interaction.user.id);

    if (customId.startsWith("group_")) {
      const groupName = customId.replace("group_", "");
      const members = groupMembers[groupName];
      if (!members) return;

      const hasAccess = member.roles.cache.has(REQUIRED_ROLE_ID);
      if (!hasAccess) {
        await interaction.reply({
          content: `この操作には特定のロールが必要です。`,
          ephemeral: true
        });
        return;
      }

      const memberRows = [];
      let row = new ActionRowBuilder();
      let count = 0;
      for (const m of members) {
        if (count >= 5) {
          memberRows.push(row);
          row = new ActionRowBuilder();
          count = 0;
        }
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`member_${m}`)
            .setLabel(m)
            .setStyle(ButtonStyle.Secondary)
        );
        count++;
      }
      if (count > 0) memberRows.push(row);

      await interaction.reply({
        content: `**${groupName}** のメンバーを選んでください：`,
        components: memberRows,
        ephemeral: true
      });
    }

    if (customId.startsWith("member_")) {
      const memberName = customId.replace("member_", "");
      const role = interaction.guild.roles.cache.find(r => r.name === memberName);
      if (!role) {
        await interaction.reply({ content: `ロール「${memberName}」が見つかりません。`, ephemeral: true });
        return;
      }

      if (member.roles.cache.has(role.id)) {
        await interaction.reply({ content: `あなたはすでに「${memberName}」ロールを持っています。`, ephemeral: true });
      } else {
        await member.roles.add(role);
        await interaction.reply({ content: `「${memberName}」ロールを付与しました！`, ephemeral: true });
      }
    }
  } catch (err) {
    console.error('💥 interaction エラー:', err);
    await interaction.reply({ content: 'エラーが発生しました。', ephemeral: true });
  }
});

client.login(TOKEN);

// Express (Render対策)
const app = express();
app.get('/', (_, res) => res.send('Bot is alive!'));
app.listen(3000, () => console.log('🌐 Expressサーバー起動完了（ポート3000）'));
