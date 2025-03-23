
import { Server as SocketServer } from "socket.io"
import { redisClient } from "../utils/redis";
import db from "../utils/db";
import { Reader } from "../types/reader";
import { getCachedUser } from "../utils/getCachedUser";
import { getUserFromDb } from "../utils/getUserFromDb";


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
                const warehouseUsers = await db.user.findMany({
                    where: {
                        warehouseUsers: {
                            some: {
                                warehouseId: warehouse.id
                            }
                        }
                    }
                })
                for (const warehouseUser of warehouseUsers) {
                    const { sessionSocketIds, error } = await getCachedUser({ userId: warehouseUser.id });
                    if (error) {
                        console.log(`error occurred while getting cached user in reader server connected event: ${error}`)
                        continue;
                    }
                    if (!sessionSocketIds)
                        continue;

                    const latestUserDetails = await getUserFromDb({ userId: warehouseUser.id })
                    if (!latestUserDetails) {
                        console.log("latestUserDetails not found in reader server connected event.")
                        continue;
                    }
                    await redisClient.set(`wms-user:${latestUserDetails?.id}`, JSON.stringify({ user: latestUserDetails, sessionSocketIds }));

                    delete (latestUserDetails as any)?.password;

                    for (const sessionSocketId of sessionSocketIds) {
                        console.log("server-to-client:updated-user-details called")
                        await new Promise((resolve) => {
                            baseIo.to(sessionSocketId).emit("server-to-client:updated-user-details", { user: latestUserDetails })
                            resolve(true)
                        })
                    }
                }
            }


        }

    }

}