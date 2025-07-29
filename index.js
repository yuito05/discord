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

const TOKEN ='MTM5OTQ5NjQ1MDAxNDA1NjYwOQ.G3MgXx.M7zt-GLF8cGYclm1pwt2nCGK9q3UjsAut54M08';
const CHANNEL_ID = '1399260177177509980';
const REQUIRED_ROLE_ID = '1396532031428497419';

// グループとメンバー一覧
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

client.once('ready', async () => {
  console.log(`${client.user.tag} ログイン完了`);

  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel) return console.log('チャンネルが見つかりません');

  const embed = new EmbedBuilder()
    .setTitle('🎵 グループを選択してください')
    .setDescription('ボタンを押すと、そのグループのメンバー選択ができます')
    .setColor(0x00AEFF)
.setImage('https://i.imgur.com/c3JyvaB.jpeg'); // 
  await channel.send({
    embeds: [embed],
    components: createGroupButtons()
  });
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const customId = interaction.customId;

  // グループ選択
  if (customId.startsWith("group_")) {
    const groupName = customId.replace("group_", "");
    const members = groupMembers[groupName];
    if (!members) return;

    // ロールチェック（IDで確認）
    const hasAccess = interaction.member.roles.cache.has(REQUIRED_ROLE_ID);
    if (!hasAccess) {
      await interaction.reply({
        content: `You need the required role to select members.`,
        flags: 64
      });
      return;
    }

    // メンバーボタン生成（5つずつ）
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

  // メンバー選択 → ロール付与
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
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Bot is alive!');
});

app.listen(3000, () => {
  console.log('✅ Webサーバー起動済み');
});
let lastMessage = null;

async function sendOrUpdateEmbed() {
  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel) return console.log('チャンネルが見つかりません');

  // 前のメッセージを削除（存在すれば）
  if (lastMessage) {
    try {
      await lastMessage.delete();
    } catch (err) {
      console.error('メッセージの削除に失敗:', err);
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

  // 次回削除のため保存
  lastMessage = sentMessage;
}

// Bot起動時に1回送信
client.once('ready', () => {
  sendOrUpdateEmbed(); // 初回送信
  setInterval(sendOrUpdateEmbed, 5 * 60 * 1000); // 5分ごと
});
client.login(TOKEN);