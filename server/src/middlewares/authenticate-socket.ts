import { parse } from "cookie";
import { ExtendedError } from "socket.io/dist/namespace";
import jwt, { JwtPayload } from "jsonwebtoken"
import { getCachedUser } from "../utils/getCachedUser";
import { redisClient } from "../utils/redis";

type SocketNext = (err?: ExtendedError | undefined) => void

interface UserIDJwtPayload extends JwtPayload {
    userId: string,
}

export async function authenticateSocket(socket: Socket, next: SocketNext) {

    try {
        if (socket.handshake.auth.readerServerId) {
            await redisClient.set(`wsm-socketId:${socket.id}`, JSON.stringify({ type: "Reader", id: socket.handshake.auth.readerServerId }))
            next()
            return
        }
        const authToken = parse(socket.handshake.headers.cookie as string || socket.request.headers.cookie as string || "")["authToken"]

        if (!authToken)
            return


        const decodedParam = jwt.verify(authToken, process.env.JWT_SECRET as string) as UserIDJwtPayload;

        if (!decodedParam) {
            return
        }

        const { sessionSocketIds, user, error } = await getCachedUser({
            userId: decodedParam.userId,
            socketId: socket.id,
        });

        if (error) {
            console.log(`error occurred while getting cached user in authenticate socket middleware: ${error}`)
            return
        }

        (socket).user = user;

        (socket).sessionSocketId = sessionSocketIds as string[];
        await redisClient.set(`wsm-socketId:${socket.id}`, JSON.stringify({ type: "User", id: user?.id }))
        next()

    } catch (error) {
        console.log(`error occurred while authenticating socket: ${error}`)
    }

}
