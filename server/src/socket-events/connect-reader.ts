
import { Server as SocketServer } from "socket.io"
import db from "../utils/db"
import { redisClient } from "../utils/redis"
import { Reader } from "../types/reader"

export const connectReader = async (baseIo: SocketServer, socket: Socket, props: { readerRole: "Reader" | "Writer" }) => {

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
                
                console.log("sent", readerServerParsed.readerSeverSocketId)

                baseIo.to(readerServerParsed.readerSeverSocketId).emit("server-to-reader:connect-reader", {
                    userId: socket.user.id
                })

            }
        }
    }

}