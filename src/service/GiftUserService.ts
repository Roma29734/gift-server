import { getDb } from "../mongo/driver";
import { Collection } from "mongodb";
import { GiftTypes, GiftTransaction, GiftTransactionResult, GiftArea } from "../types/giftTypes";
import * as fs from "fs";
import * as path from "path";
import { incrementUserGifts } from "./UserService";
import { RecentActionService } from "./RecentActionService";

export class GiftService {
    private giftsUsersCollection: Collection<GiftTransaction>;
    private gifts: GiftTypes[] = [];
    private actionService = new RecentActionService();

    constructor() {
        const db = getDb();
        this.giftsUsersCollection = db.collection<GiftTransaction>("giftsUsers");
        this.loadGiftsFromFile();
    }

    // Загрузка данных из JSON-файла
    private loadGiftsFromFile() {
        try {
            const filePath = path.join(__dirname, '../../data/gifts.json');
            console.log("filePath - ", filePath)
            const data = fs.readFileSync(filePath, 'utf-8');

            // Проверка на пустой файл
            if (!data.trim()) {
                console.warn('Gifts JSON file is empty.');
                this.gifts = [];
                return;
            }

            // Попытка парсинга JSON
            this.gifts = JSON.parse(data);
            console.log('Gifts loaded successfully.', this.gifts);
        } catch (error) {
            console.error('Error loading gifts from JSON file:', error);
            this.gifts = [];
        }
    }

    // Получение всех доступных подарков
    public getAllGifts(): GiftTypes[] {
        return this.gifts;
    }

    // Получение подарка по ID
    public getGiftById(giftId: string): GiftTypes | undefined {
        return this.gifts.find(gift => gift.id === giftId);
    }

    // Создание транзакции подарка
    public async createGiftTransaction(fromUserId: number, toUserId: number, giftId: string): Promise<GiftTransactionResult> {
        try {
            const gift = await this.getGiftById(giftId);
            if (!gift) {
                throw new Error("Gift not found");
            }

            const newGiftTransaction: GiftTransaction = {
                from: fromUserId,
                to: toUserId,
                date: new Date(),
                price: gift.price,
                giftId,
            };

            const result = await this.giftsUsersCollection.insertOne(newGiftTransaction);
            console.log(`Gift transaction created with id: ${result.insertedId}`);

            // Увеличение количества подарков для получателя
            await incrementUserGifts(toUserId);


            // Приводим toId и fromId к строкам
            await this.actionService.addAction(fromUserId, {
                name: `Sent a gift to ${toUserId}`,
                type: {
                    type: 'SentGift',
                    toId: String(toUserId),  // Преобразуем в строку
                    toName: "Получатель",
                    name: 'Sent'
                },
                img: gift.img
            });

            await this.actionService.addAction(toUserId, {
                name: `Received a gift from ${fromUserId}`,
                type: {
                    type: 'ReceiveGift',
                    fromId: String(fromUserId),  // Преобразуем в строку
                    fromName: "Отправитель",
                    name: 'Receive'
                },
                img: gift.img
            });

            return { insertedId: result.insertedId.toString() };
        } catch (error) {
            console.error("Error creating gift transaction:", error);
            throw error;
        }
    }

    public async getGiftsForUser(userId: number): Promise<GiftArea[]> {
        try {
            const giftTransactions = await this.giftsUsersCollection.find({ to: userId }).toArray();
            const giftIds = giftTransactions.map(transaction => transaction.giftId);

            const userGifts = this.gifts.filter(gift => giftIds.includes(gift.id ?? ""));

            // Шаг 4: Преобразуем данные в формат GiftArea, включая поля из транзакции
            const giftAreas: GiftArea[] = giftTransactions.map(transaction => {
                // Находим соответствующий подарок по ID
                const gift = userGifts.find(g => g.id === transaction.giftId);

                // Если подарок найден, то создаем объект GiftArea
                if (gift) {
                    return {
                        id: gift.id ?? "",
                        img: gift.img,
                        name: gift.name,
                        description: gift.description,
                        price: gift.price,
                        bgColor: gift.bgColor,
                        from: transaction.from,  // Число
                        to: transaction.to,      // Число
                        date: transaction.date,
                    };
                }

                // Если подарок не найден, возвращаем null
                return null;
            }).filter((giftArea): giftArea is GiftArea => giftArea !== null);

            return giftAreas;
        } catch (error) {
            console.error("Error fetching gifts for user:", error);
            throw error;
        }
    }


    public async addGiftToUser(userId: number, giftId: string) {
        try {
            const gift = await this.getGiftById(giftId);
            if (!gift) {
                throw new Error("Gift not found");
            }

            const newGiftTransaction: GiftTransaction = {
                from: 0,
                to: userId,
                date: new Date(),
                price: gift.price,
                giftId,
            };
            const result = await this.giftsUsersCollection.insertOne(newGiftTransaction);
            console.log(`Gift transaction created with id: ${result.insertedId}`);

            // Увеличение количества подарков для получателя
            await incrementUserGifts(userId);

            await this.actionService.addAction(userId, {
                name: `Buy gift ${gift.name}`,
                type: {
                    type: 'BuyGift',
                    name: 'Buy',
                    price: gift.price
                },
                img: gift.img
            });

        } catch (e) {

        }
    }

}
