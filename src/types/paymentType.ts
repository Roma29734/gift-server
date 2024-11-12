import { ObjectId } from "mongodb";

export type CurrencyType = "crypto" | "fiat";

export interface Payment {
    userId: number;
    giftId: string;
    amount: string;
    currencyType: CurrencyType;
    asset?: string;
    fiat?: string;
    invoiceId: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}