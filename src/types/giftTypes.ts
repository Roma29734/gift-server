import {CurrencyType} from "./paymentType";

export interface Price {
    value: number;
    imgCurrency: string;
    nameCurrency: string;
    currencyType: CurrencyType;
}

export interface GiftArea {
    id: string;
    img: string;
    name: string;
    description: string;
    price: Price;
    bgColor: string;
    from: number;
    to: number;
    date: Date;
}

export interface GiftTypes {
    id?: string;
    img: string;
    name: string;
    description: string;
    price: Price;
    bgColor: string;
}


// types/giftTypes.ts
export interface GiftTransaction {
    from: number;
    to: number;
    date: Date;
    price: Price;
    giftId: string;
}

export interface GiftTransactionResult {
    insertedId: string;
}

