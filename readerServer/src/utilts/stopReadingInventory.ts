import { socketWriteWithResponse } from "../helpers/socketWriteWithResponse";
import { redisClient } from "../libs/redis";

export const stopReadingInventory = async () => {
    // Chapter 5.5.3 Stop Asynchronous inventory (0xAA49)

    // Send command:
    // Header   Data-length     Command code        Subcommand Marker (Moduletech)          Sub Command Code  
    // ff	    0E		        AA		            4D 6F 64 75 6C 65 74 65 63 68           AA 49

    // Subcommand Code      SubCRC      Terminator      CRC
    // AA 49f	            F3		    BB              03 91


    // Receive Command:
    // Header  Data length  	Command Code    Status Code     Subcommand Marker (Moduletech)      Subcommand Code     CRC
    // FF	   00		        AA              00 00           4D 6F 64 75 6C 65 74 65 63 68       AA 49               0f 23

    // purpose: Stop async inventory


    const stopAsyncInvenSenCmd = Buffer.from([
        0xff, // Header 
        0x0e, // Data-length
        0xaa, // Command code
        0x4d, 0x6f, 0x64, 0x75, 0x6c, 0x65, 0x74, 0x65, 0x63, 0x68,// Subcommand Marker (Moduletech) 
        0xaa, 0x49, // Sub Command Code
        0xf3, // SubCRC
        0xBB, // Terminator
        0x03, 0x91
    ]);

    const readingTags = await redisClient.get("reading-tags");
    if (Number(readingTags)) {
        console.log("stopped reading tags", Number(readingTags))
        await redisClient.set("reading-tags", "0");

        const response = await socketWriteWithResponse(stopAsyncInvenSenCmd, { wait: true, })

        return response
    } else {
        return null
    }
}