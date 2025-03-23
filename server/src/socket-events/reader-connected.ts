import { Server as SocketServer } from "socket.io"
import { redisClient } from "../utils/redis";
import db from "../utils/db";
import { getCachedUser } from "../utils/getCachedUser";


type Props = {
    readerDetails: {
        readerServerId: string;
        address: string;
        role: string;
        connectionStatus?: "connected" | "not-connected";
    }
    userId: string
}

type Reader = {
    id: string;
    readerServerId: string;
    serialNumber: string | null;
    readerYearModel: bigint | null;
    address: string;
    role: string;
    warehouseId: string;
    connectionStatus: "connected" | "not-connected";
}


export const readerConnected = async (baseIo: SocketServer, socket: Socket, props: Props) => {
    console.log("here connected")

    let reader: Omit<Reader, "connectionStatus"> | null = null;

    let readerSeverSocketId: string | null = null;
    if (!props.readerDetails) {
        console.log(props)
    }
    try {

        const readerServerStringified = await redisClient.get(props.readerDetails.readerServerId)
        if (!readerServerStringified)
            throw new Error()

        const redisRes = JSON.parse(readerServerStringified) as { reader: Reader; readerSeverSocketId: string }

        reader = redisRes.reader

        readerSeverSocketId = redisRes.readerSeverSocketId

        await redisClient.set(reader.readerServerId, JSON.stringify({ reader, readerSeverSocketId: socket.id }))

    } catch (error) {
        console.log("reader connected response", props)
        reader = await db.reader.findUnique({
            where: {
                readerServerId: props.readerDetails.readerServerId
            }
        })

        if (reader) {

            await redisClient.set(reader.readerServerId, JSON.stringify({
                reader: {
                    ...reader,
                    connectionStatus: props.readerDetails.connectionStatus
                },
                readerSeverSocketId: socket.id
            }))


        }

    }

    if (props.readerDetails.connectionStatus === "connected") {
        const { sessionSocketIds, error } = await getCachedUser({ userId: props.userId })
        if (error) {
            console.log(`error occurred while getting cached user in reader connected event: ${error}`)
            return
        }
        if (sessionSocketIds) {
            for (const sessionSocketId of sessionSocketIds) {
                await new Promise(async (resolve) => {
                    await baseIo.to(sessionSocketId).emit("server-to-client:reader-connected", props.readerDetails)
                    resolve(true)
                })
            }

        }
    }

}