import { Redis } from "ioredis";
import { createClient } from "redis";
import { ReaderDetails } from "../types/readerDetails";
export const redisClient = createClient()

redisClient
    .on('error', err => console.log('Redis Client Error', err))
    .connect()
    .then(() => console.log("Redis connected."));


(async () => {
    const readerDetails = await redisClient.get("reader-details")
    if (readerDetails) {
        redisClient.set("reading-tags", "0")
        const readerDetailsParsed = JSON.parse(readerDetails) as ReaderDetails
        readerDetailsParsed.connectionStatus = "not-connected"
        await redisClient.set("reader-details", JSON.stringify(readerDetailsParsed))
    }
})()