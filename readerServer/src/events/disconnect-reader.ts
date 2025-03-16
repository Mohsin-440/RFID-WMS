import { clientSocket, tcpClientSocket } from "../app";
import { socketWriteWithResponse } from "../helpers/socketWriteWithResponse";
import { wait } from "../helpers/wait";
import { redisClient } from "../libs/redis";
import { ReaderDetails } from "../types/readerDetails";

export async function disconnectReader(props: any) {

    try {

        const readerDetails = await redisClient.get("reader-details")

        if (readerDetails) {
            const readerDetailsParsed = JSON.parse(readerDetails) as ReaderDetails;
            if (readerDetailsParsed.connectionStatus === "not-connected") {
                clientSocket.emit("reader-disconnected", readerDetailsParsed)
                return
            }
        }

        else {

            await socketWriteWithResponse(Buffer.from([0x00]), { wait: true, }).catch((err) => "disconnected")

            const readerDetails = await socketWriteWithResponse(Buffer.from([0xFF, 0x02, 0x10, 0x00, 0x00,]), {
                wait: true,
                appendCrcToInput: true
            });

            const readerYearModel = Number(Array.from(readerDetails.subarray(5, 9)).join(""));

            const serialNumber = Array.from(readerDetails.subarray(9, 17)).join("")

            const prop = {
                readerYearModel,
                serialNumber,
                address: "Sialkot",
                connectionStatus: "not-connected"
            }

            
            tcpClientSocket.destroy();
            
            const redisReaderDetails = await redisClient.get("reader-details")
            
            if (redisReaderDetails) {
                const readerDetailsParsed = JSON.parse(redisReaderDetails) as ReaderDetails
                readerDetailsParsed.connectionStatus = "not-connected"
                await redisClient.set("reader-details", JSON.stringify(readerDetailsParsed))
            }
            await wait(300)
            
            clientSocket.emit("reader-disconnected", prop)
        }

    } catch (error) {

    }
}