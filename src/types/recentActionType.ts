import {Price} from "./giftTypes";

export interface RecentAction {
    name: string;
    type: RecentActionType;
    img: string;

}


export type RecentActionType = BuyGiftType | SentGiftType | ReceiveGiftType

export interface BuyGiftType{
    type: 'BuyGift';
    name: 'Buy'
    price: Price;
}

export interface SentGiftType {
    type: 'SentGift'
    name: 'Sent'
    toId: string;
    toName: string;
}

export interface ReceiveGiftType {
    type: 'ReceiveGift'
    name: 'Receive'
    fromId: string;
    fromName: string;
}