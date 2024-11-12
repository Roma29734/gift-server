import express from "express";
import {PaymentService} from "../service/PaymentService";
import {authMiddleware} from "../auth/authMiddleware";
// @ts-ignore
import {InitDataParsed} from "@telegram-apps/init-data-node";
import {authFromCode} from "../auth/AuthFromCode";
import {CRYPTO_PAY_TOKEN} from "../../config";
import {createHash, createHmac} from "node:crypto";
import {IncomingHttpHeaders} from "node:http";


interface Invoice {
    invoice_id: string;
    // другие поля, которые могут быть в payload
}

export interface WebhookPayload {
    update_id: number;
    update_type: string;
    request_date: string;
    payload: Invoice;  // payload содержит данные о счете
}


// Функция для проверки подписи
const checkSignature = (token: string, { body, headers }: { body: WebhookPayload; headers: IncomingHttpHeaders }) => {
    const secret = createHash('sha256').update(token).digest();
    const checkString = JSON.stringify(body);
    const hmac = createHmac('sha256', secret).update(checkString).digest('hex');
    return hmac === headers['crypto-pay-api-signature'];
};
const router = express.Router();

function paymentRouter() {

    const service = new PaymentService()

    router.post('/create', authMiddleware, async (req, res) => {
        try {

            const {giftId} = req.body;
            const initData = res.locals.initData as InitDataParsed;
            const userId = initData.user?.id

            const resultOperation = await service.createPayment(userId, giftId)
            console.log("resultOperation is create",resultOperation)
            res.status(200).json({url :resultOperation.miniAppInvoiceUrl, invoiceId: resultOperation.invoiceId})

        } catch (e) {
            console.log("error is create",e)
            res.status(500).json(e)
        }
    })

    router.post('/handleWebhookUpdate', async (req, res) => {
        try {

            console.log("")
            if (!checkSignature(CRYPTO_PAY_TOKEN,{ body: req.body, headers: req.headers })) {
                return res.status(400).json({ error: 'Invalid signature' });
            }
            const resultOperation = await service.handleWebhookUpdate(req.body);
            console.log("resultOperation is handleWebhookUpdate", resultOperation);
            res.status(200).json({ url: resultOperation });
        } catch (e) {
            console.log("error is handleWebhookUpdate", e);
            res.status(500).json(e);
        }
    });


    router.post('/getPayment', async (req, res) =>{
        try {
            const {invoiceId} = req.body;
            const resultOperation = await service.getPayment(invoiceId);
            console.log("resultOperation is getPayment",resultOperation)
            res.status(200).json({resultOperation})
        } catch (e) {
            console.log("error is handleWebhookUpdate",e)
            res.status(500).json(e)
        }
    })


    return router
}

export default paymentRouter;