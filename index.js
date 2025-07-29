console.log("🔐 TOKEN:", process.env.TOKEN);
require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const express = require('express');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const REQUIRED_ROLE_ID = process.env.REQUIRED_ROLE_ID;

const groupMembers = {
  // グループ名とメンバー（省略せず記述）
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
  return rows.slice(0, 5); // Discordは最大5行まで
}

let lastMessage = null;

async function sendOrUpdateEmbed() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel) return console.log('❌ チャンネルが見つかりません');

    if (lastMessage) {
      try {
        await lastMessage.delete();
        console.log("🗑️ 旧メッセージ削除完了");
      } catch (err) {
        console.error("❗ メッセージ削除失敗:", err.message);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle("🎵 グループを選択してください")
      .setDescription("ボタンを押すと、そのグループのメンバー選択ができます！")
      .setColor(0x00AEFF)
      .setImage("https://i.imgur.com/dpvNDs6.jpeg");

    const sent = await channel.send({
      embeds: [embed],
      components: createGroupButtons(),
    });

    lastMessage = sent;
    console.log("📤 Embed再送信完了");
  } catch (err) {
    console.error("❗ Embed送信失敗:", err.message);
  }
}

client.once('ready', () => {
  console.log(`✅ ログイン完了: ${client.user.tag}`);
  sendOrUpdateEmbed();
  setInterval(sendOrUpdateEmbed, 5 * 60 * 1000);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const id = interaction.customId;
  const member = interaction.member;

  if (id.startsWith("group_")) {
    const group = id.replace("group_", "");
    const members = groupMembers[group];
    if (!members) return;

    const hasAccess = member.roles.cache.has(REQUIRED_ROLE_ID);
    if (!hasAccess) {
      return await interaction.reply({
        content: `❌ 必要なロールがありません。`,
        flags: 64
      });
    }

    const rows = [];
    let row = new ActionRowBuilder();
    let count = 0;

    for (const name of members) {
      if (count >= 5) {
        rows.push(row);
        row = new ActionRowBuilder();
        count = 0;
      }
      row.addComponents(
        new ButtonBuilder().setCustomId(`member_${name}`).setLabel(name).setStyle(ButtonStyle.Secondary)
      );
      count++;
    }
    if (count > 0) rows.push(row);

    return await interaction.reply({
      content: `👤 **${group}** のメンバーを選んでください：`,
      components: rows.slice(0, 5),
      flags: 64
    });
  }

  if (id.startsWith("member_")) {
    const name = id.replace("member_", "");
    const role = interaction.guild.roles.cache.find(r => r.name === name);
    if (!role) {
      return await interaction.reply({ content: `❌ ロール "${name}" が見つかりません`, flags: 64 });
    }

    if (member.roles.cache.has(role.id)) {
      return await interaction.reply({ content: `⚠️ すでに "${name}" のロールを持っています`, flags: 64 });
    }

    await member.roles.add(role);
    return await interaction.reply({ content: `✅ ロール "${name}" を付与しました！`, flags: 64 });
  }
});

client.login(TOKEN);

// --- Express for Ping ---
const app = express();
app.get('/', (_, res) => res.send('✅ Bot is alive'));
app.listen(3000, () => console.log("🌐 Webサーバー起動完了（スリープ回避用）"));
