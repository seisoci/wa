const express = require('express')
const app = express();
const port = 3000;
const qrcode = require('qrcode-terminal');
const cors = require('cors');

app.use(cors({
    'origin': '*',
    'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
}));

const {Client, LocalAuth} = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false,
        // args: [
        //     '--no-sandbox',
        //     '--disable-setuid-sandbox',
        //     '--disable-dev-shm-usage',
        //     '--disable-accelerated-2d-canvas',
        //     '--no-first-run',
        //     '--no-zygote',
        //     '--single-process', // <- this one doesn't works in Windows
        //     '--disable-gpu'
        // ],
    }
});


client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Whatsapp Siap digunakan!');
});


client.on('message', async msg => {
    if (msg.body == '!ping') {
        msg.reply('pong');
    } else if (msg.body.startsWith('!sendto ')) {
        // Direct send a new message to specific id
        let number = msg.body.split(' ')[1];
        let messageIndex = msg.body.indexOf(number) + number.length;
        let message = msg.body.slice(messageIndex, msg.body.length);
        number = number.includes('@c.us') ? number : `${number}@c.us`;
        let chat = await msg.getChat();
        chat.sendSeen();
        client.sendMessage(number, message);

    }
});

app.get("/api", (req, res) => {
    let phone = req.query.phone;
    let text = req.query.text;
    phone = phone.includes('@c.us') ? phone : `${phone}@c.us`;
    let checkUser = client.isRegisteredUser(phone);
    if (checkUser) {
        try {
            client.sendMessage(phone, text);
        } catch (err) {
            res.json({status: 'success', message: err})
        }
        res.json({status: 'success', message: 'Data Berhasil Dikirim'})
    } else {
        res.json({status: 'error', message: 'Data Tidak Berhasil Dikirim, Mohon cek kembali'})
    }
});

app.listen(port, () => {
    console.log(`Akses Aplikasi dengan Port ${port}`);
})

client.initialize();
