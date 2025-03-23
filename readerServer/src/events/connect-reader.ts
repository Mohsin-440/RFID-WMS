import { clientSocket, tcpClientSocket } from "../app";
import { connectReader } from "../helpers/connectReader";
import { redisClient } from "../libs/redis";
import { ReaderDetails } from "../types/readerDetails";
import { establishConnection } from "../utilts/establishConnection";
let connecting = false;
export async function connectReaderEvent(props: { userId: string }) {

    console.log("reader connection requested")
    
    if (connecting === true)
        return

    try {
        connecting = true;
        const readerDetails = await redisClient.get("reader-details")
        if (readerDetails) {
            const readerDetailsParsed = JSON.parse(readerDetails) as ReaderDetails;
            if (readerDetailsParsed.connectionStatus === "connected") {
                clientSocket.emit("reader-to-server:reader-connected", { readerDetails: readerDetailsParsed, userId: props.userId })
                connecting = false;
                return
            }
        }
        await connectReader(tcpClientSocket);
        const prop = await establishConnection(tcpClientSocket);
        connecting = false;
        await redisClient.set("reader-details", JSON.stringify(prop))

        if (!prop)
            throw new Error("reader prop empty")
        console.log("reader connected")
        await clientSocket.emit("reader-to-server:reader-connected", { readerDetails: prop, userId: props.userId });


    } catch (error) {
        connecting = false;
        console.log(`error occurred while connecting reader: ${error}`, error)
    }
}