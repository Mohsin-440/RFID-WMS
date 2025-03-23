
import { Server as SocketServer } from "socket.io"
import db from "../utils/db";
import { redisClient } from "../utils/redis";
import { Reader } from "../types/reader";


type Props = { readerRole: "Reader" | "Writer" }


export const startReadingParcelTagsForDispatch = async (baseIo: SocketServer, socket: Socket, props: Props) => {

    if (!socket.user)
        return

    const warehouseId = socket.handshake.auth.warehouseId as string

    const warehouseUser = socket.user.warehouseUsers.find((warehouseUser) => warehouseUser.warehouse.id === warehouseId)

    if (!warehouseUser) {
        console.log("warehouse user not found in 'start Reading Parcel Tags For Dispatch'  event on server")
        return;
    }
    if (props.readerRole !== "Writer") {
        console.log("reader role is not 'writer' in 'start Reading Parcel Tags For Dispatch' event on server")
        return
    }

    const readers = await db.reader.findMany({
        where: {
            warehouseId: warehouseUser.warehouse.id
        }
    })

    const reader = readers.find((reader) => reader.role === props?.readerRole)

    if (!reader) {
        console.log("reader with role 'Reader' is not found in 'start Reading Parcel Tags For Dispatch' event on server")
        return
    }

    const readerServerStringified = await redisClient.get(`reader:${reader.readerServerId}`)

    if (readerServerStringified) {

        const readerServerParsed = JSON.parse(readerServerStringified) as { reader: Reader; readerSeverSocketId: string }

        baseIo.to(readerServerParsed.readerSeverSocketId).emit("server-to-reader:start-reading-parcel-tags-for-dispatch", {
            userId: socket.user.id,
            socketId: socket.id
        })
    }

}


