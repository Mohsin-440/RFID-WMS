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

            socket.on("client-to-server:stop-reading-tags", async (prop) => await stopReadingTags(baseIo, socket, prop))

            socket.on("reader-to-server:tags-reading-stopped", async (prop) => await tagsReadingStopped(baseIo, socket, prop))

        })

    } catch (error) {
        console.log(`error occurred while socketing error:${error}`)
    }
}