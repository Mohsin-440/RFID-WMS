
import { Server as SocketServer } from "socket.io"
import db from "../utils/db";
import { getCachedUser } from "../utils/getCachedUser";
import { redisClient } from "../utils/redis";
import { Reader } from "../types/reader";

type Props = {
    userId: string;
    socketId: string;
}

export const tagsReadingStopped = async (baseIo: SocketServer, socket: Socket, props: Props) => {


    const { user, sessionSocketIds, error } = await getCachedUser({ userId: props.userId })
    if (error) {
        console.log(`error occurred while getting cached user in tags reading stopped event: ${error}`)
        return
    }
    if (!sessionSocketIds)
        return;
    for (const sessionSocketId of sessionSocketIds) {
        await new Promise(async (resolve) => {
            baseIo.to(sessionSocketId).emit("server-to-client:tags-reading-stopped")
            resolve(true)
        })
    }

}


