import { startReading } from "../utilts/startReading";
import { socketWriteWithResponse } from "../helpers/socketWriteWithResponse";
import { printResponseInHex } from "../helpers/printResponseInHex";
import { clientSocket } from "../app";
import { redisClient } from "../libs/redis";
import { ReaderDetails } from "../types/readerDetails";

export const startReadingParcelTagsForDispatch = async (props: { userId: string, socketId: string }) => {
    try {
        const readingTags = await redisClient.get("reading-tags");
        if (Number(readingTags)) {
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

        await startReading();

        // Chapter 5.5.1 Asynchronous inventory (0xAA48)

        // Send command:
        // Header   Data-length     Command code        Subcommand Marker (Moduletech)          Sub Command Code  
        // ff	    13		        AA		            4D 6F 64 75 6C 65 74 65 63 68           AA 48

        // Metadata Flags       Option      Search Flags     Sub CRC        Terminator      CRC
        // 00 9f	            00		    08 03		     34             BB              29 04


        // Receive Command:
        // Header  Data length  	Command Code 	Sub command maker (Moduletech)          Sub command code        CRC
        // FF	   00		        AA		        4D 6F 64 75 6C 65 74 65 63 68           AA 48                   0f 23

        // purpose: Initiate async inventory

        const initAsyncInvenSenCmd = Buffer.from([
            0xff, // Header 
            0x13, //Data-length
            0xaa, //Command code
            0x4d, 0x6f, 0x64, 0x75, 0x6c, 0x65, 0x74, 0x65, 0x63, 0x68,//Subcommand Marker (Moduletech) 
            0xaa, 0x48,//Sub Command Code
            0x00, 0x9f, //Metadata Flags
            0x00, //Option
            0x80, 0x00,//Search Flags
            0x11,//Sub CRC
            0xbb,//Terminator
            0x0b, 0x22//CRC
        ]);
        await redisClient.set("reading-tags", "1")
        console.log("tag reading started")
        await socketWriteWithResponse(initAsyncInvenSenCmd, {
            onDataCb: async (data) => {
                const readingTags = await redisClient.get("reading-tags");
                if (!Number(readingTags)) {
                    return
                }
                const decodedData = parseBuffer(data);
                const redearDetails = await redisClient.get("reader-details")
                const parsedReaderDetails = redearDetails ? JSON.parse(redearDetails) as ReaderDetails : null
                const resBody = {
                    tags: decodedData,
                    userId: props.userId,
                    socketId: props.socketId,
                    readerDetails: parsedReaderDetails
                }
                // console.log(resBody)
                clientSocket.emit("reader-to-server:parcel-tags-read-for-dispatch", resBody)
            }
        })

    } catch (error) {

    }
}



// Parse multiple frames
function parseBuffer(buffer: Buffer) {


    const bufferFramesArray = splitByHeader(buffer)
    let i = []
    for (const bufferFrame of bufferFramesArray) {
        const header = bufferFrame[0];
        const length = bufferFrame[1];
        const commandCode = bufferFrame[2];
        const statusCode = bufferFrame.subarray(3, 5).toString("hex");
        const metadataFlags = bufferFrame.subarray(5, 7).toString("hex");

        const mainDataBuffer = bufferFrame.subarray(bufferFrame.length - length, bufferFrame.length)

        let offset = 0

        const readCount = mainDataBuffer[offset]
        offset += 1

        const rssiValue = -parseInt(mainDataBuffer.subarray(offset, offset + 1).toString("hex"), 16)
        offset += 1

        const antennaId = parseInt(mainDataBuffer.subarray(offset, offset + 1).toString("hex"), 16)
        offset += 1

        const frequency = parseInt(mainDataBuffer.subarray(offset, offset + 3).toString("hex"), 16)
        offset += 3

        const timestamp = parseInt(mainDataBuffer.subarray(offset, offset + 4).toString("hex"), 16)
        offset += 4

        const tagdatalength = parseInt(mainDataBuffer.subarray(offset, offset + 2).toString("hex"), 16)
        offset += 2

        const epclength = parseInt(mainDataBuffer.subarray(offset, offset + 1).toString("hex"), 16)
        offset += 1


        const pc = parseInt(mainDataBuffer.subarray(offset, offset + 2).toString("hex"), 16)
        offset += 2

        const epcId = mainDataBuffer.subarray(offset, offset + 12).toString("hex")
        offset += 12

        const epcCrc = mainDataBuffer.subarray(offset, offset + 2).toString("hex")
        offset += 2
        if (!epcId || !epclength) {
            continue;
        }
        i.push({
            readCount,
            rssiValue,
            antennaId,
            frequency,
            timestamp,
            tagdatalength,
            epclength,
            pc,
            epcId,
            epcCrc,
            bufferFrame
        })
    }


    return i;
}

function splitByHeader(buffer: Buffer, header: number = 0xFF): Buffer[] {
    const result: Buffer[] = [];
    let start: number | null = null;

    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] === header) {
            if (start !== null) {
                result.push(buffer.slice(start, i));
            }
            start = i; // Start a new chunk from this header
        }
    }

    // Add the last chunk if it exists
    if (start !== null && start < buffer.length) {
        result.push(buffer.slice(start));
    }

    return result;
}

function getTagFields(metadataFlags: number): string[] {
    const fields: { [key: number]: string } = {
        0x0000: "No metadata, only EPC",
        0x0001: "Read Count",
        0x0002: "RSSI (Received Signal Strength Indication)",
        0x0004: "Antenna ID",
        0x0008: "Frequency",
        0x0010: "Timestamp",
        0x0020: "Phase Value",
        0x0040: "Protocol ID",
        0x0080: "Tag Data Length",
    };

    const result: string[] = [];
    for (const [key, value] of Object.entries(fields)) {
        if (metadataFlags & Number(key)) {
            result.push(value);
        }
    }
    return result;
}

// Example usage:
// const metadataFlags = 0x009f; // Example flags value
// const tagFields = getTagFields(metadataFlags);
// console.log("Tag fields:", tagFields);