import express from "express";
import {createUser, deleteUser, getTop100UsersByGifts, getUserById, updateUser} from "../service/UserService";
import {authMiddleware} from "../auth/authMiddleware";
// @ts-ignore
import {InitDataParsed} from "@telegram-apps/init-data-node";
import {authFromCode} from "../auth/AuthFromCode";

const router = express.Router();

function userRouter() {

    // create users
    router.post('/users', authMiddleware, async (req, res) => {
        try {
            const initData = res.locals.initData as InitDataParsed;
            const userId = initData.user?.id
            const name = initData.user?.firstName
            const userIdResult = await createUser(userId, name, 0);
            res.status(201).json({message: 'User created', userIdResult});
        } catch (error) {
            console.log("err createUser- ", error)
            res.status(500).json({error: error});
        }
    });

    // get userById
    router.get('/users', authMiddleware, async (req, res) => {
        try {
            const initData = res.locals.initData as InitDataParsed;
            const userId = initData.user?.id
            const user = await getUserById(userId);
            console.log("user", user)
            if (!user) {
                return res.status(404).json({error: 'User not found'});
            }
            res.json(user);
        } catch (error) {
            console.log("eror", error)
            res.status(500).json({error: 'Failed to get user'});
        }
    });


    router.put('/users', authMiddleware, async (req, res) => {
        try {
            const initData = res.locals.initData as InitDataParsed;
            const userId = initData.user?.id
            const success = await updateUser(userId, req.body);
            if (!success) {
                return res.status(404).json({error: 'User not found'});
            }
            res.json({message: 'User updated'});
        } catch (error) {
            res.status(500).json({error: 'Failed to update user'});
        }
    });

    router.get(`/getLeaderboard`, async (req, res) => {
        try {
            const isResult = await getTop100UsersByGifts()
            return res.status(200).json(isResult)
        } catch (e) {
            res.status(500).json({error: e})
        }
    })

    router.delete('/deleteUser', authFromCode, async (req, res) => {
        try {
            const {userId} = req.body;
            const isResult = await deleteUser(userId)
            res.status(200).json(isResult)
        } catch (e) {
            res.status(500).json({error: e})
        }
    })

    return router;
}


export default userRouter;