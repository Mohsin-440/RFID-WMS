
import { Server as SocketServer } from "socket.io"
import db from "../utils/db";
import { getCachedUser } from "../utils/getCachedUser";
import { redisClient } from "../utils/redis";

interface Metadata {
    readCount?: number;  // Number of times the tag was read
    rssi?: number;       // Signal strength in dBm
    antennaId?: number;  // Antenna that read the tag
    frequency?: number;  // Frequency in kHz
    timestamp?: number;  // Time when the tag was read (ms)
}

type Props = {
    tags: {
        readCount: number;
        rssiValue: number;
        antennaId: number;
        frequency: number;
        timestamp: number;
        tagdatalength: number;
        epclength: number;
        pc: number;
        epcId: string;
        epcCrc: string;
    }[];
    userId: string;
    socketId: string;
    readerDetails: {
        readerServerId: string;
        readerYearModel: number;
        serialNumber: string;
        address: string;
        role: string | undefined;
        connectionStatus: "connected" | "not-connected";
    };
}

export const tagsRead = async (baseIo: SocketServer, socket: Socket, props: Props) => {
    try {

        const { user, sessionSocketIds, error } = await getCachedUser({ userId: props.userId })
        if (error) {
            console.log(`error occurred while getting cached user in tags read event: ${error}`)
            return
        }
        if (!sessionSocketIds)
            return;

        const tagDataStringed = await redisClient.get(`data-to-write:${props.readerDetails.readerServerId}`)

        if (props.socketId) {
            await new Promise(async (resolve) => {
                baseIo.to(props.socketId).emit("server-to-client:tags-read", props.tags)
                resolve(true)
            })
        }

        for (const sessionSocketId of sessionSocketIds) {
            await new Promise(async (resolve) => {
                baseIo.to(sessionSocketId).emit("server-to-client:tags-read", props.tags)
                resolve(true)
            })
        }

    } catch (error) {

    }

}


