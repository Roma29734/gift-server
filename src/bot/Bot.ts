import TelegramBot, {InlineQueryResultArticle} from 'node-telegram-bot-api';
import { botToken } from '../../config';

export const myBot = new TelegramBot(botToken, { polling: true });

// Обработка инлайн-запроса
myBot.on('inline_query', async (query) => {
    const { id, query: userQuery, from } = query;


    if (from.is_bot) {

        await myBot.answerInlineQuery(id, [{
            type: 'article',
            id: 'invalid_chat',
            title: 'Недоступно',
            input_message_content: {
                message_text: 'Этот бот работает только от пользователей, а не от ботов.',
            }
        }]);
        return;
    }

    // Получаем цифры после '='
    const match = userQuery.match(/^=(\d+)$/);
    const targetId = match ? match[1] : null;

    if (!targetId) {
        // Если не нашли подходящее значение, отправляем сообщение об ошибке
        await myBot.answerInlineQuery(id, [{
            type: 'article',
            id: 'no_results',
            title: 'Неверный формат',
            input_message_content: {
                message_text: 'Используйте формат: @bot_name=число',
            }
        }]);
        return;
    }

    // Если нашли, отправляем сообщение с полученным ID
    const results: InlineQueryResultArticle[] = [{
        type: 'article',
        id: '1',
        title: "Подарок отправлен!",
        input_message_content: {
            message_text: `Вы выбрали подарок для ID: ${targetId}`,
        },
        reply_markup: {
            inline_keyboard: [
                [{
                    text: 'Открыть',
                    url: `https://example.com/${targetId}`  // Подставляем ID в URL, если нужно
                }]
            ],
        },
    }];

    try {
        await myBot.answerInlineQuery(id, results);
    } catch (error) {
        console.error('Ошибка при отправке инлайн-ответа:', error);
    }
});






// Обработчик сообщений
myBot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    if (msg.text?.startsWith('/start')) {
        await myBot.sendMessage(chatId, 'Добро пожаловать! Напишите мне, чтобы выбрать подарок.');
    }
});
