import express from "express";
import {RecentActionService} from "../service/RecentActionService";
import {authFromCode} from "../auth/AuthFromCode";
import {authMiddleware} from "../auth/authMiddleware";
// @ts-ignore
import {InitDataParsed} from "@telegram-apps/init-data-node";

const router = express.Router();

function recentActionRouter() {

    const service = new RecentActionService()
    router.post("/actions", authMiddleware, async (req, res) => {
        const {limit} = req.body
        const initData = res.locals.initData as InitDataParsed;
        const userId = initData.user?.id
        try {
            const actions = await service.getActions(userId, limit);
            res.json(actions);
        } catch (error) {
            res.status(500).json({error: "Failed to retrieve actions"});
        }
    });


    router.delete('/actions', authFromCode, async (req, res) => {
        const {userId, actionsId} = req.body
        try {
            const result = await service.deleteAction(userId, actionsId);
            res.status(200).json(result)
        } catch (e) {
            res.status(500).json({error: e})
        }
    })

    return router
}


export default recentActionRouter;