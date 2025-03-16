import db from "./db";
import { getUserFromDb } from "./getUserFromDb";
import { redisClient } from "./redis";

type GetCachedUser = {
    userId: string;
    socketId?: string;
    userBody?: User
}

export const getCachedUser = async ({ userId, socketId, userBody }: GetCachedUser) => {

    try {

        let user: User | null = null;

        let sessionSocketIds: string[] | undefined = undefined;

        const redisUserStringed = await redisClient.get(userId);

        if (redisUserStringed) {

            const userParsed = JSON.parse(redisUserStringed)
            
            sessionSocketIds = userParsed.sessionSocketIds as string[];
            
            if (userBody) {
                user = userBody
                redisClient.set(userId, JSON.stringify({
                    user,
                    sessionSocketIds,
                }))
            }
            else
                user = userParsed.user


            if (socketId) {

                const id = sessionSocketIds.indexOf(socketId)
                if (id <= -1) {
                    sessionSocketIds.push(socketId)
                    redisClient.set(userId, JSON.stringify({
                        user,
                        sessionSocketIds,
                    }))
                }

            }

        } else {

            user = await getUserFromDb({ userId })


            if (user) {
                await redisClient.set(user?.id, JSON.stringify({
                    user,
                    sessionSocketIds: socketId ? [socketId] : [],
                }))
            }

        }

        if (!user)
            return { error: "user not found" }


        return { user, sessionSocketIds }
    } catch (error) {
        return { error: `${(error as any).message}` }
    }
}