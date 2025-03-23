import { Server as SocketServer } from "socket.io"
import { readerConnected } from "../socket-events/reader-connected"
import { connectReader } from "../socket-events/connect-reader"
import { authenticateSocket } from "../middlewares/authenticate-socket"
import { readerServerConnected } from "../socket-events/reader-server-connected"
import { startReadingTags } from "../socket-events/start-reading-tags"
import { tagsRead } from "../socket-events/tags-read"
import { readerDisconnected } from "../socket-events/reader-disconnected"
import { stopReadingTags } from "../socket-events/stop-reading-tags"
import { tagsReadingStopped } from "../socket-events/tags-reading-stopped"
import { tagsMonitored } from "../socket-events/tags-monitored"
import { startMonitoring } from "../socket-events/start-monitoring"
import { redisClient } from "../utils/redis"
import { getCachedUser } from "../utils/getCachedUser"
import { startReadingParcelTagsForDispatch } from "../socket-events/start-reading-parcel-tags-for-dispatch"
import { parcelTagsReadForDispatch } from "../socket-events/parcelTagsReadForDispatch"


export const socketIoRegister = (baseIo: SocketServer) => {
    try {

        baseIo.use(authenticateSocket)

        baseIo.on("connection", async (socket) => {

            socket.on("reader-to-server:reader-server-connected", async (prop) => await readerServerConnected(baseIo, socket, prop))

            socket.on("client-to-server:connect-reader", async (prop) => await connectReader(baseIo, socket, prop))

            socket.on("reader-to-server:reader-connected", async (prop) => await readerConnected(baseIo, socket, prop))

            socket.on("reader-to-server:reader-disconnected", async (prop) => await readerDisconnected(baseIo, socket, prop))

            socket.on("client-to-server:start-reading-tags", async (prop) => await startReadingTags(baseIo, socket, prop))

            socket.on("reader-to-server:tags-read", async (prop) => await tagsRead(baseIo, socket, prop))

            // monitoring
            socket.on("client-to-server:start-monitoring", async (prop) => await startMonitoring(baseIo, socket, prop))

            socket.on("reader-to-server:tags-monitored", async (prop) => await tagsMonitored(baseIo, socket, prop))
            // monitoring //


            // read for dispatch
            socket.on("client-to-server:start-reading-parcel-tags-for-dispatch", async (prop) =>
                await startReadingParcelTagsForDispatch(baseIo, socket, prop))

            socket.on("reader-to-server:parcel-tags-read-for-dispatch", async (prop) => await parcelTagsReadForDispatch(baseIo, socket, prop))
            // read for dispatch //

            socket.on("client-to-server:stop-reading-tags", async (prop) => await stopReadingTags(baseIo, socket, prop))

            socket.on("reader-to-server:tags-reading-stopped", async (prop) => await tagsReadingStopped(baseIo, socket, prop))




            socket.on("disconnect", async () => {
                try {
                    const socketEntityStringed = await redisClient.get(`wsm-socketId:${socket.id}`)
                    await redisClient.del(`wsm-socketId:${socket.id}`)
                    if (!socketEntityStringed)
                        return

                    const socketEntity = JSON.parse(socketEntityStringed) as { id: string, type: "Reader" | "User" };
                    if (socketEntity.type === "User") {
                        const { user, sessionSocketIds, error } = await getCachedUser({ userId: socketEntity.id })
                        if (error) {
                            console.log(`error occurred while getting cached user in socketIo register: ${error}`)
                            return
                        }
                        if (!user || !sessionSocketIds)
                            return

                        const newSessionSocketIds = sessionSocketIds?.filter((sessionSocketId) => sessionSocketId !== socket.id);
                        await redisClient.set(`wms-user:${user?.id}`, JSON.stringify({
                            user,
                            sessionSocketIds: newSessionSocketIds,
                        }))

                    } else if (socketEntity.type === "Reader") {

                        const readerServerStringified = await redisClient.get(`reader:${socketEntity.id}`)

                        if (!readerServerStringified)
                            return;

                        const deleteReaderFromCache = await redisClient.del(`reader:${socketEntity.id}`)
                    }
                } catch (error) {

                }

            })
        })

    } catch (error) {
        console.log(`error occurred while socketing error:${error}`)
    }
}