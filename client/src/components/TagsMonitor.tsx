"use client";

import { useSocketStore } from '@/store/socket.store'
import { useUserStore } from '@/store/user.store';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ParcelDetailsWithStatus } from "@wsm/shared/types/parcelDetailsWithStatus"
const IGNORE_DURATION_MS = 10000; // 20 seconds


type TagWithParcel = {
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
    parcel: ParcelDetailsWithStatus;
}

const TagsMonitor = () => {

    const [audio] = useState(() => {
        if (typeof Audio !== 'undefined') {
            const newAudio = new Audio('/alarm.wav')
            newAudio.loop = true
            return newAudio
        }
        return null
    })

    const isPlayingRef = useRef(false);


    const { socket, socketStatuses } = useSocketStore()
    const { userInfo } = useUserStore();


    const [readerConnecting, setReaderConnecting] = useState(false)
    const [readerConnected, setReaderConnected] = useState(false)
    const [readingTags, setReadingTags] = useState(false)

    const [tags, setTags] = useState<(TagWithParcel & { timeAdded: Date })[]>([])
    const [ignore, setIgnore] = useState(false)

    const params = useParams<{ warehouseId: string }>()

    const currentWarehouse = userInfo?.warehouseUsers.find((warehouseUser) => warehouseUser.warehouse.id === params.warehouseId)
    const readers = currentWarehouse?.warehouse.readers?.filter((reader) => reader.role === "Reader")


    useEffect(() => {

        if (!readers?.length || !socketStatuses.connected || !socket)
            return
        if (readerConnecting || readerConnected)
            return

        if (readers?.length > 0) {
            console.log("connecting reader called")
            socket?.emit("client-to-server:connect-reader", { readerRole: "Reader" })
            setReaderConnecting(true)
            setReaderConnected(false)
        }
    }, [readerConnected, readerConnecting, readers, readers?.length, socket, socketStatuses.connected])

    // console.log({ readerConnected, readerConnecting, readingTags, socket, readers, tags })

    const onReaderConnected = () => {
        setReaderConnecting(false)
        setReaderConnected(true)
    }

    useEffect(() => {

        socket?.on("server-to-client:reader-connected", onReaderConnected)
        return () => {
            socket?.removeListener("server-to-client:reader-connected", onReaderConnected)
        }
    }, [socket])

    useEffect(() => {
        if (readerConnected) {
            setReadingTags(true)
            socket?.emit("client-to-server:start-monitoring", { readerRole: "Reader" })
        }
    }, [readerConnected, socket])


    const onTagsRead = useCallback((data: TagWithParcel[]) => {

        if (!data.length)
            return;

        const tempTags = structuredClone(tags)

        for (const datum of data) {
            const checkTagsExist = tempTags.find((tag) => tag.epcId === datum.epcId)
            if (!checkTagsExist) {
                tempTags.push({ ...datum, timeAdded: new Date() })
            }
        }
        const temp2Tags = tempTags.filter(tag => tag.timeAdded.getTime() > Date.now() - 10 * 1000)

        setTags(temp2Tags)

    }, [tags])

    useEffect(() => {

        if (!readingTags)
            return

        socket?.on("server-to-client:tags-monitored", onTagsRead)
        return () => {
            socket?.removeListener("server-to-client:tags-monitored", onTagsRead)
        }
    }, [socket, onTagsRead, readingTags])

    useEffect(() => {
        if (!audio) return
        const playAudio = async () => {
            try {
                if (tags.length > 0 && !isPlayingRef.current) {
                    isPlayingRef.current = true;
                    await audio.play();
                } else if (tags.length === 0 && isPlayingRef.current) {
                    isPlayingRef.current = false;
                    audio.pause();
                    console.log('audio paused');
                    audio.currentTime = 0;
                }
            } catch (error) {
                console.error('Audio playback error:', error);
                isPlayingRef.current = false;
            }
        }
        if (ignore) {
            isPlayingRef.current = false;
            audio.pause();
            console.log("paused")
            audio.currentTime = 0;

        } else
            playAudio();

        return () => {
            if (audio) {
                isPlayingRef.current = false;
                audio.pause();
                audio.currentTime = 0;
            }
        }
    }, [tags.length, audio, ignore])

    useEffect(() => {
        if (tags.length <= 0)
            return

        const intervalId = setInterval(() => {

            const highestDate = tags.reduce((latest, tag) => {
                return tag.timeAdded.getTime() > latest.timeAdded.getTime() ? tag : latest;
            }, tags[0]);

            if (highestDate.timeAdded.getTime() < Date.now() - 5 * 1000) {
                console.log('resetting tags')
                setTags([])
            }

        }, 5000)

        return () => {
            clearInterval(intervalId);
        };

    }, [tags])

    const [dialogOpen, setDialogOpen] = useState(false)
    const ignoreTimeoutRef = useRef<NodeJS.Timeout>()

    const handleIgnoreClick = () => {
        setDialogOpen(false)
        setIgnore(true)

        if (ignoreTimeoutRef.current) {
            clearTimeout(ignoreTimeoutRef.current)
        }

        ignoreTimeoutRef.current = setTimeout(() => {
            setIgnore(false)
            if (tags.length > 0) {
                setDialogOpen(true)
            }
        }, IGNORE_DURATION_MS)
    }

    useEffect(() => {
        if (!ignore)
            setDialogOpen(tags.length > 0)
    }, [ignore, tags.length])

    useEffect(() => {
        return () => {
            if (ignoreTimeoutRef.current) {
                clearTimeout(ignoreTimeoutRef.current)
            }
        }
    }, [])

    return <>
        <Dialog open={dialogOpen}>

            <DialogContent className="sm:max-w-md max-h-[300px] h-screen flex flex-col justify-center gap-10">
                <DialogTitle>
                    <div className='text-lg leading-10 font-semibold'>
                        Unauthorized movement of parcel detected.
                    </div>
                </DialogTitle>


                <Button type="button" className='bg-red-700 hover:bg-red-600' onClick={() => handleIgnoreClick()}>
                    Ignore for {(IGNORE_DURATION_MS / 1000).toFixed(0)} seconds
                </Button>

            </DialogContent>
        </Dialog>

    </>

}

export default TagsMonitor