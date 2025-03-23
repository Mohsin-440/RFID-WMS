import { Socket } from "socket.io-client";
import { connectReaderEvent } from "../events/connect-reader";
import { disconnectReader } from "../events/disconnect-reader";
import { startReadingTags } from "../events/startReadingTags";
import { stopReadingTags } from "../events/stopReadingTags";
import { startMonitoring } from "../events/startMonitoring";


export const events = (socket: Socket) => {
    socket.on("server-to-reader:connect-reader", connectReaderEvent)
    socket.on("server-to-reader:disconnect-reader", disconnectReader)
    socket.on("server-to-reader:start-reading-tags", startReadingTags)
    socket.on("server-to-reader:start-monitoring", startMonitoring)
    socket.on("server-to-reader:stop-reading-tags", stopReadingTags)
}