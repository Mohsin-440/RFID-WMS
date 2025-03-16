import { clientSocket, tcpClientSocket } from "../app";
import { connectReader } from "../helpers/connectReader";
import { redisClient } from "../libs/redis";
import { ReaderDetails } from "../types/readerDetails";
import { establishConnection } from "../utilts/establishConnection";

export async function connectReaderEvent(props: { userId: string }) {

    try {

        const readerDetails = await redisClient.get("reader-details")

        if (readerDetails) {
            const readerDetailsParsed = JSON.parse(readerDetails) as ReaderDetails;
            if (readerDetailsParsed.connectionStatus === "connected") {
                clientSocket.emit("reader-to-server:reader-connected", { readerDetails: readerDetailsParsed, userId: props.userId })
                return
            }
        }

        await connectReader(tcpClientSocket);

        const prop = await establishConnection(tcpClientSocket);

        await redisClient.set("reader-details", JSON.stringify(prop))

        await clientSocket.emit("reader-to-server:reader-connected", { readerDetails: prop, userId: props.userId });



    } catch (error) {

    }
}