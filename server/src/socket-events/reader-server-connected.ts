
import { Server as SocketServer } from "socket.io"
import { redisClient } from "../utils/redis";
import db from "../utils/db";
import { Reader } from "../types/reader";


type Props = {
    readerServerId: string;
    address: string;
    role: "Writer" | "Reader";
    connectionStatus?: "connected" | "not-connected";
}



export const readerServerConnected = async (baseIo: SocketServer, socket: Socket, props: Props) => {

    let reader: Omit<Reader, "connectionStatus"> | null = null;

    let readerSeverSocketId: string | null = null;

    try {

        const readerServerStringified = await redisClient.get(`reader:${props.readerServerId}`)
        if (!readerServerStringified)
            throw new Error()


        const redisRes = JSON.parse(readerServerStringified) as { reader: Reader; readerSeverSocketId: string }

        reader = redisRes.reader

        readerSeverSocketId = redisRes.readerSeverSocketId
        await redisClient.set(`reader:${props.readerServerId}`, JSON.stringify({ reader, readerSeverSocketId: socket.id }))

    } catch (error) {

        reader = await db.reader.findUnique({
            where: {
                readerServerId: props.readerServerId
            }
        })
        if (reader) {
            await redisClient.set(`reader:${props.readerServerId}`, JSON.stringify({
                reader: {
                    ...reader,
                    connectionStatus: props.connectionStatus
                },
                readerSeverSocketId: socket.id
            }))
            return

        } else {

            const warehouse = await db.warehouse.findUnique({
                where: {
                    warehouseAddress: props.address
                }
            })
            if (warehouse) {
                reader = await db.reader.create({
                    data: {
                        address: props.address,
                        readerServerId: props.readerServerId,
                        role: props.role,
                        warehouseId: warehouse.id
                    }
                })
                await redisClient.set(`reader:${props.readerServerId}`, JSON.stringify({
                    reader: {
                        ...reader,
                        connectionStatus: props.connectionStatus
                    },
                    readerSeverSocketId: socket.id
                }))
            }


        }

    }

}