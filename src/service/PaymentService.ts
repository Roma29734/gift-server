import { getDb } from "../mongo/driver";
import { ObjectId, Collection } from "mongodb";
import {  Payment } from "../types/paymentType";
import { GiftService } from "./GiftUserService";
import {CreateInvoiceOptions} from "crypto-bot-api/lib/helpers/utils";
import {CRYPTO_PAY_TOKEN} from "../../config";
import {CryptoCurrencyCode} from "crypto-bot-api/lib/helpers/casts";
import {WebhookPayload} from "../routers/PaymentRouter";

export class PaymentService {

    CryptoBotAPI = require('crypto-bot-api');

    client = new this.CryptoBotAPI(CRYPTO_PAY_TOKEN);


    private db;
    private paymentsCollection: Collection<Payment>;
    private base_url = "https://testnet-pay.crypt.bot/api/";
    private serviceGift = new GiftService();

    constructor() {
        this.db = getDb();
        this.paymentsCollection = this.db.collection<Payment>("payments");
    }

    async createPayment(userId: number, giftId: string, options: { asset?: string, fiat?: string } = {}): Promise<{ miniAppInvoiceUrl: string; invoiceId: string }> {

        const gift = await this.serviceGift.getGiftById(giftId);
        if (!gift) throw new Error("Gift not found");

        const { value: amount, currencyType, nameCurrency } = gift.price;

        console.log("currency_type", currencyType);
        console.log("asset", currencyType === "crypto" ? nameCurrency : undefined);
        console.log("amount", amount.toString());

        try {
            // @ts-ignore
            const options: CreateInvoiceOptions = {
                amount: amount,
                asset: currencyType === "crypto" && isValidCryptoCurrency(nameCurrency) ? nameCurrency : undefined,
                // currencyType: currencyType == "crypto" ? CurrencyType.Crypto: CurrencyType.Fiat
            };

            const invoce = await this.client.createInvoice(options);

            const invoiceId = invoce.id;
            const miniAppInvoiceUrl = invoce.miniAppPayUrl;

            const newPayment: Payment = {
                userId,
                giftId,
                amount: amount.toString(),
                currencyType,
                asset: nameCurrency,
                fiat: currencyType === "fiat" ? options.fiat : undefined,
                invoiceId: invoiceId.toString(),
                status: "created",
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            console.log("Attempting to insert payment with invoiceId:", newPayment.invoiceId);
            const insertResult = await this.paymentsCollection.insertOne(newPayment);
            console.log("Insert result:", insertResult);

            const allPayments = await this.paymentsCollection.find().toArray();
            console.log("All payments after insert:", allPayments);

            return { miniAppInvoiceUrl, invoiceId: invoiceId.toString() };
        } catch (error) {
            console.error("Error creating payment:", error);
            throw error;
        }
    }



    async handleWebhookUpdate(payload: WebhookPayload): Promise<boolean> {
        try {
            // Извлекаем данные из payload
            const { invoice_id } = payload.payload;  // Получаем invoice_id из payload
            const {update_type} = payload

            // Проверяем тип обновления
            if (update_type === "invoice_paid") {
                // Если invoice был оплачен, обновляем статус платежа
                return await this.updatePaymentStatus(invoice_id, "completed");
            }

            // Если тип обновления не был "invoice_paid", выводим предупреждение
            console.warn(`Unhandled update type: ${update_type}`);
            return false;
        } catch (error) {
            console.error("Error handling webhook update:", error);
            throw error;
        }
    }

    async updatePaymentStatus(invoiceId: string, status: "created" | "completed" | "failed"): Promise<boolean> {
        // Find the payment by invoiceId first
        const payment = await this.paymentsCollection.findOne({ invoiceId });

        if (!payment) {
            console.warn(`Payment with invoiceId ${invoiceId} not found`);
            return false;
        }

        // Update the payment status
        const result = await this.paymentsCollection.updateOne(
            { invoiceId },
            { $set: { status, updatedAt: new Date() } }
        );

        if (result.modifiedCount === 1) {
            // Access userId and giftId for further processing
            const { userId, giftId } = payment;

            // Call the required function with userId and giftId here
            await this.serviceGift.addGiftToUser(userId, giftId);

            return true;
        }

        return false;
    }

    async getPayment(invoiceId: string): Promise<Payment | null> {
        console.log("Looking for payment with invoiceId:", invoiceId);
        const payment = await this.paymentsCollection.findOne({ invoiceId: invoiceId });
        console.log("Found payment:", payment);
        return payment;
    }


    async getUserPayments(userId: number, limit: number = 10): Promise<Payment[]> {
        return await this.paymentsCollection
            .find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .toArray();
    }
}

function isValidCryptoCurrency(currency: string): currency is CryptoCurrencyCode {
    return ['USDT', 'TON', 'BTC', 'ETH', 'LTC', 'BNB', 'TRX', 'USDC', 'JET'].includes(currency);
}
