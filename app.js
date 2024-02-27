const express = require('express');
const multer = require('multer');
const app = express();
const port = 3000;
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cors = require('cors');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'rasmlar', req.body.chatId);
    fs.promises.mkdir(uploadDir, { recursive: true })
      .then(() => cb(null, uploadDir))
      .catch(err => {
        console.error(err);
        cb(err);
      });
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  }
});

const upload = multer({ storage: storage });

app.use(cors());

app.use('/rasmlar', express.static('rasmlar'));

app.get('/data.json', (req, res) => {
  const filePath = path.join(__dirname, 'data.json');
  res.sendFile(filePath);
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const token = '6887028094:AAGketUPEIU49n_9n9Q7ewljRBEoSuaRiNg';
const bot = new TelegramBot(token, { polling: true });
const rasmlarFolder = path.join(__dirname, 'rasmlar');
fs.promises.mkdir(rasmlarFolder, { recursive: true })
  .catch(err => console.error(err));


  bot.on('message', async msg => {
    const chatId = msg.chat.id;
    const text = msg.text;
  
    if (text === '/start') {
      await bot.sendMessage(
        chatId,
        'Assalomu Alaykum Bot Foydalanuvchisi "Ma\'lumotlarni kiriting" degan joyga bosing va ma\'lumotlarni yuboring ✅',
        {
          reply_markup: {
            keyboard: [
              [
                {
                  text: "Ma'lumotlarni kiriting",
                  web_app: {
                    url: 'https://webmas.uz',
                  },
                },
              ],
            ],
          },
        }
      );
    }
  
    if (text === '/izlash') {
      await bot.sendMessage(
        chatId,
        'Ma\'lumotlarni kiriting',
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Ma\'lumotlarni kiriting",
                  web_app: {
                    url: 'https://webmas.uz',
                  },
                },
              ],
            ],
          },
        }
      );
    }
  
    if (msg.web_app_data?.data) {
      try {
        const data = JSON.parse(msg.web_app_data?.data);
  
        await bot.sendMessage(
          chatId,
          "Bizga ishonch bildirganingiz uchun raxmat"
        );
  
        for (item of data) {
          await bot.sendPhoto(chatId, item.Image);
          await bot.sendMessage(
            chatId,
            `${item.title} - ${item.quantity}x`
          );
        }
  
        await bot.sendMessage(
          chatId,
          `Umumiy narx - ${data
            .reduce((a, c) => a + c.price * c.quantity, 0)
            .toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
            })}`
        );
      } catch (error) {
        console.log(error);
      }
    }
  });







function getOriginalFilename(link) {
  const urlParts = link.split('/');
  return urlParts[urlParts.length - 1];
}

async function downloadImage(url, filePath) {
  const response = await axios({ url, responseType: 'stream' });
  response.data.pipe(fs.createWriteStream(filePath));
}

async function saveUserData(userData) {
  const dataFilePath = path.join(__dirname, 'data.json');
  try {
    const dataContent = await fs.promises.readFile(dataFilePath, 'utf8');
    const data = dataContent ? JSON.parse(dataContent) : [];
    data.push(userData);
    await fs.promises.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error saving user data: ${error}`);
  }
}

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

