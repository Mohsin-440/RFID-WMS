import { clientSocket } from "../app";
import { redisClient } from "../libs/redis";
import { ReaderDetails } from "../types/readerDetails";
import { stopReadingInventory } from "../utilts/stopReadingInventory";

export const stopReadingTags = async (props: { userId: string, socketId: string }) => {
    try {
        const readingTags = await redisClient.get("reading-tags");
        if (!Number(readingTags)) {
            return
        }

        const readerDetails = await redisClient.get("reader-details")

        if (!readerDetails) {
            return
        }
        const readerDetailsParsed = JSON.parse(readerDetails) as ReaderDetails;
        if (readerDetailsParsed.connectionStatus !== "connected") {
            return
        }

        await stopReadingInventory()
        clientSocket.emit("reader-to-server:tags-reading-stopped", props)
    } catch (error) {
        console.log(`error occurred while stopping reading tags`, error)
    }
}

