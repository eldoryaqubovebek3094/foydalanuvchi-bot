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
    const uploadDir = path.join(__dirname, 'rasmlar');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdir(uploadDir, { recursive: true }, (err) => {
        if (err) {
          console.log(err);
          return cb(err);
        }
        cb(null, uploadDir);
      });
    } else {
      cb(null, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

app.use(cors({ origin: 'https://yangi-hayot.netlify.app' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://yangi-hayot.netlify.app');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

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
if (!fs.existsSync(rasmlarFolder)) {
  fs.mkdirSync(rasmlarFolder);
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Assalomu Alaykum, iltimos, pul miqdori yozilgan chekni rasmini yuboring.');
  
});

bot.on('message', async msg => {
	const chatId = msg.chat.id;
	const text = msg.text;

	if (text === '/start') {
		await bot.sendMessage(
			chatId,
			'Sammi.ac platformasida bor kurslarni sotib olishingiz mumkin',
			{
				reply_markup: {
					keyboard: [
						[
							{
								text: "Ma'lumotlarni ko'rish",
								web_app: {
									url: 'https://yangi-hayot.netlify.app/',
								},
							},
						],
					],
				},
			}
		);
	}

	if (text === '/courses') {
		await bot.sendMessage(
			chatId,
			'Sammi.ac platformasida bor kurslarni sotib olishingiz mumkin',
			{
				reply_markup: {
					inline_keyboard: [
						[
							{
								text: "Kurslarni ko'rish",
								web_app: {
									url: 'https://telegram-web-bot.vercel.app',
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
				"Bizga ishonch bildirganingiz uchun raxmat, siz sotib olgan kurslarni ro'yhati"
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

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  



  if (msg.photo) {
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    bot.getFileLink(fileId).then((link) => {
      const originalFilename = getOriginalFilename(link);
      const filename = `${chatId}_${Date.now()}_${originalFilename}`;
      const filePath = path.join(rasmlarFolder, filename);

      downloadImage(link, filePath, () => {
        const userData = {
          id: chatId,
          username: msg.from.username,
          first_name: msg.from.first_name,
          last_name: msg.from.last_name,
          image_name: filename,
        };

        saveUserData(userData);
      });
    });
  }
});

function getOriginalFilename(link) {
  const urlParts = link.split('/');
  return urlParts[urlParts.length - 1];
}

function downloadImage(url, filePath, callback) {
  axios({
    url,
    responseType: 'stream',
  })
    .then((response) => {
      response.data.pipe(fs.createWriteStream(filePath))
        .on('finish', () => {
          response.data.destroy();
          callback();
        })
        .on('error', (error) => {
          console.error(`Error downloading image: ${error}`);
        });
    })
    .catch((error) => {
      console.error(`Error downloading image: ${error}`);
    });
}

function saveUserData(userData) {
  const dataFilePath = path.join(__dirname, 'data.json');
  let data = [];
  try {
    if (fs.existsSync(dataFilePath)) {
      const dataContent = fs.readFileSync(dataFilePath, 'utf8');
      if (dataContent) {
        data = JSON.parse(dataContent);
      }
    }
    data.push(userData);
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error saving user data: ${error}`);
  }
}

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});