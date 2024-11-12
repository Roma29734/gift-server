import express from 'express';
import { connectDB } from './mongo/driver';
import cors from 'cors';
import userRouter from "./routers/UserRouter";
import giftUserRouter from "./routers/GiftUserRouter";
import recentActionRouter from "./routers/RecentActionRouter";
import * as fs from "fs";
import path from "node:path";
import paymentRouter from "./routers/PaymentRouter";
import {myBot} from "./bot/Bot";

const app = express();

app.use(cors());
app.use(express.json());

// Подключение к базе данных
connectDB();
myBot;
app.use('/api/users', userRouter());
app.use('/api/gift', giftUserRouter());
app.use('/api/recent', recentActionRouter());
app.use('/api/payment', paymentRouter());


app.get('/api/animation/:name', (req, res) => {
    const animationName = req.params.name;
    const filePath = path.join(__dirname, 'lottie', `${animationName}.json`);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(404).send('Анимация не найдена');
        }
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.parse(data));
    });
});

// Обработчик для статических файлов фронтенда
app.use(express.static(path.join(__dirname, 'build')));

// Маршрут для отправки index.html для фронтенда
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
