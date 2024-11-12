import express from "express";
import {createUser, getUserById, updateUser} from "../service/UserService";
import {GiftService} from "../service/GiftUserService";
import {authMiddleware} from "../auth/authMiddleware";
import {authFromCode} from "../auth/AuthFromCode";
// @ts-ignore
import {InitDataParsed} from "@telegram-apps/init-data-node";

const router = express.Router();

function giftUserRouter() {

    const service = new GiftService();
    router.post('/getGiftsForUser', authMiddleware,async (req, res) => {
        try {

            const {userId} = req.body;
            if(userId != undefined) {
                const result = await service.getGiftsForUser(userId);
                res.status(201).json(result);
            } else {
                const initData = res.locals.initData as InitDataParsed;
                const isUserId = initData.user?.id
                const result = await service.getGiftsForUser(isUserId);
                res.status(201).json(result);
            }
        } catch (error) {
            res.status(500).json({error: 'Failed to create user'});
        }
    });

    router.post('/createGiftTransaction', authMiddleware, async (req, res) => {
        try {

            const {fromUserId, toUserId, giftId} = req.body;

            const result = await service.createGiftTransaction(fromUserId, toUserId, giftId);
            res.status(201).json({result});
        } catch (error) {
            res.status(500).json({error: error});
        }
    });


    router.get('/getAllGifts', async (req, res) => {
        try {
            const result = service.getAllGifts()
            res.status(200).json(result)
        } catch (e) {
            res.status(500).json({error: 'Failed to create user'});
        }
    })


    router.post('/addGiftToUser', authFromCode, async (req, res) => {
        try {
             const {userId, giftId} = req.body;
             const result = await service.addGiftToUser(userId, giftId)
            res.status(200).json(result)
        } catch (e) {

        }
    })

    return router;
}


export default giftUserRouter;