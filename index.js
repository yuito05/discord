require('dotenv').config();
const express = require('express');
const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');

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

// グループとメンバー一覧（省略なし）
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

// グループボタン生成
function createGroupButtons() {
  const rows = [];
  let row = new ActionRowBuilder();
  let count = 0;

  for (const group of Object.keys(groupMembers)) {
    if (count >= 5) {
      rows.push(row);
      row = new ActionRowBuilder();
      count = 0;
    }
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`group_${group}`)
        .setLabel(group)
        .setStyle(ButtonStyle.Primary)
    );
    count++;
  }
  if (count > 0) rows.push(row);
  return rows;
}

// 前のメッセージ削除＆再送信
async function sendOrUpdateEmbed() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel) return console.log('❌ チャンネルが見つかりません');

    // 古いEmbedメッセージ削除（Botが送信した最大20件まで）
    const messages = await channel.messages.fetch({ limit: 20 });
    const botMessages = messages.filter(
      m => m.author.id === client.user.id && m.embeds.length > 0
    );

    for (const [_, msg] of botMessages) {
      await msg.delete().catch(err => console.warn('⚠️ 削除失敗:', err.message));
    }

    console.log(`🗑️ 古いメッセージを ${botMessages.size} 件削除しました`);

    const embed = new EmbedBuilder()
      .setTitle('🎵 グループを選択してください')
      .setDescription('ボタンを押すと、そのグループのメンバー選択ができます！')
      .setColor(0x00AEFF)
      .setImage('https://i.imgur.com/dpvNDs6.jpeg');

    const sent = await channel.send({
      embeds: [embed],
      components: createGroupButtons(),
    });

    console.log(`✅ 新しいメッセージを送信しました: ${sent.id}`);
  } catch (err) {
    console.error('❌ sendOrUpdateEmbedエラー:', err);
  }
}

// ボット起動時
client.once('ready', () => {
  console.log(`🚀 ${client.user.tag} 起動完了`);
  sendOrUpdateEmbed();
  setInterval(sendOrUpdateEmbed, 5 * 60 * 1000); // 5分ごと更新
});

// ボタンインタラクション処理
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;
  const customId = interaction.customId;

  if (customId.startsWith("group_")) {
    const groupName = customId.replace("group_", "");
    const members = groupMembers[groupName];
    if (!members) return;

    if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
      return interaction.reply({
        content: `この操作には特定のロールが必要です。`,
        flags: 64
      });
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
      content: `**${groupName}** のメンバーを選んでください：`,
      components: memberRows,
      flags: 64
    });
  }

  if (customId.startsWith("member_")) {
    const memberName = customId.replace("member_", "");
    const role = interaction.guild.roles.cache.find(r => r.name === memberName);
    if (!role) {
      return interaction.reply({ content: `ロール「${memberName}」が見つかりません。`, flags: 64 });
    }

    if (interaction.member.roles.cache.has(role.id)) {
      return interaction.reply({ content: `あなたはすでに「${memberName}」ロールを持っています。`, flags: 64 });
    } else {
      await interaction.member.roles.add(role);
      return interaction.reply({ content: `ロール「${memberName}」を付与しました！`, flags: 64 });
    }
  }
});

// Ping用Expressサーバー
const app = express();
app.get('/', (_, res) => res.send('Bot is running!'));
app.listen(3000, () => console.log('🌐 Expressサーバー起動完了'));

client.login(TOKEN);
