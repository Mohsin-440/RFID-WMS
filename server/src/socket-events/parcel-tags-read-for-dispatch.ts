
import { Server as SocketServer } from "socket.io"
import db from "../utils/db";
import { getCachedUser } from "../utils/getCachedUser";
import { redisClient } from "../utils/redis";
import { ParcelDetailsWithStatus } from "shared/types/parcelDetailsWithStatus";
import { TagWithParcelDetails } from "shared/types/tagWithParcelDetails";



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


export const parcelTagsReadForDispatch = async (baseIo: SocketServer, socket: Socket, props: Props) => {
    try {

        const { user, sessionSocketIds, error } = await getCachedUser({ userId: props.userId })
        if (error) {
            console.log(`error occurred while getting cached user in tags monitored event: ${error}`)
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
                if (!Array.isArray(props.tags)) {
                    resolve(true)
                    return
                }

                const tagsWithParcel: TagWithParcelDetails[] = []

                for (const tag of props.tags) {
                    const parcelString = await redisClient.get(`wsm-parcelFromTagId:${tag.epcId}`)

                    if (!parcelString) {

                        const parcelDetailsWithStatus = await db.parcelDetails.findUnique({
                            where: {
                                rfidTagId: tag.epcId
                            },
                            select: {
                                id: true,
                                parcelTrackingNumber: true,
                                parcelWeight: true,
                                parcelDate: true,
                                rfidTagId: true,
                                warehouseId: true,
                                createdAt: true,
                                parcelName: true,
                                parcelPrice: true,
                                receiverAddress: true,
                                receiverEmail: true,
                                receiverFirstName: true,
                                receiverLastName: true,
                                receiverPhoneNumber: true,
                                senderAddress: true,
                                senderEmail: true,
                                senderFirstName: true,
                                senderLastName: true,
                                senderPhoneNumber: true,

                                parcelStatuses: {
                                    select: {
                                        id: true,
                                        status: true,
                                        createdAt: true,
                                    },
                                    orderBy: [{ createdAt: "desc" }],

                                }
                            }
                        })

                        if (parcelDetailsWithStatus)
                            tagsWithParcel.push({ ...tag, parcel: parcelDetailsWithStatus })

                        continue;
                    }

                    const parcel: ParcelDetailsWithStatus = JSON.parse(parcelString);

                    tagsWithParcel.push({ ...tag, parcel: parcel })

                }

                baseIo.to(sessionSocketId).emit("server-to-client:parcel-tags-read-for-dispatch", tagsWithParcel)
                resolve(true)
            })
        }

    } catch (error) {

    }

}


