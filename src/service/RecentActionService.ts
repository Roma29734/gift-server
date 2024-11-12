import { getDb } from "../mongo/driver";
import { RecentAction } from "../types/recentActionType";
import { ObjectId } from "mongodb";

export class RecentActionService {
    private db;

    constructor() {
        this.db = getDb();
    }

    async addAction(userId: string | number, action: RecentAction) {
        const collection = this.db.collection("recentActions");

        // Добавляем дату действия
        const result = await collection.insertOne({
            ...action,
            userId: userId.toString(),
            date: new Date()  // текущая дата
        });
        return result.insertedId;
    }

    async getActions(userId: string, limit: number = 10) {
        const collection = this.db.collection("recentActions");
        return await collection
            .find({ userId: userId.toString() })
            .sort({ _id: -1 })
            .limit(limit)
            .toArray();
    }

    async getActionsByDateRange(userId: string, startDate: Date, endDate: Date) {
        const collection = this.db.collection("recentActions");

        // Найдём действия в диапазоне дат
        return await collection
            .find({
                userId: userId.toString(),
                date: {
                    $gte: startDate,  // начиная с startDate
                    $lt: endDate      // до endDate (не включая endDate)
                }
            })
            .sort({ date: -1 })
            .toArray();
    }

    async deleteAction(userId: string, actionId: string) {
        const collection = this.db.collection("recentActions");
        const result = await collection.deleteOne({
            _id: new ObjectId(actionId),
            userId: userId.toString(),
        });
        return result.deletedCount === 1;
    }
}
