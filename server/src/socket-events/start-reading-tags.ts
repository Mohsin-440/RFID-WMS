
import { Server as SocketServer } from "socket.io"
import db from "../utils/db";
import { redisClient } from "../utils/redis";
import { Reader } from "../types/reader";


type Props = { readerRole: "Reader" | "Writer" }


export const startReadingTags = async (baseIo: SocketServer, socket: Socket, props: Props) => {

    if (!socket.user)
        return

    const warehouseId = socket.handshake.auth.warehouseId as string

    const warehouseUser = socket.user.warehouseUsers.find((warehouseUser) => warehouseUser.warehouse.id === warehouseId)

    if (warehouseUser) {
        const readers = await db.reader.findMany({
            where: {
                warehouseId: warehouseUser.warehouse.id
            }
        })

        const reader = readers.find((reader) => reader.role === props?.readerRole)

        if (reader) {

            const readerServerStringified = await redisClient.get(`reader:${reader.readerServerId}`)

            if (readerServerStringified) {

                const readerServerParsed = JSON.parse(readerServerStringified) as { reader: Reader; readerSeverSocketId: string }

                baseIo.to(readerServerParsed.readerSeverSocketId).emit("server-to-reader:start-reading-tags", {
                    userId: socket.user.id,
                    socketId: socket.id
                })
            }

        }
    }

}


