"use client";
import Authenticate from '@/components/Auth/Authentication';
import Authorization from '@/components/Auth/Authorization';
import React, { useCallback, useEffect, useState } from 'react';
import { DispatchedParcelsColumns } from './columns';
import { useSocketStore } from '@/store/socket.store';
import { useUserStore } from '@/store/user.store';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { DispatchDataTable } from './DispatchedDataTable';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { TagWithParcelDetails } from "@wsm/shared/types/tagWithParcelDetails";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type ReaderDetails = {
    readerServerId: string;
    address: string;
    role: string;
    connectionStatus?: "connected" | "not-connected";
};

const ParcelDispatch = () => {
    const { toast } = useToast();
    const { socket, socketStatuses } = useSocketStore();
    const { userInfo } = useUserStore();
    const param = useParams<{ warehouseId: string }>();
    const [connectingReader, setConnectingReader] = useState(false);
    const [readingTags, setReadingTags] = useState(false);
    const [connected, setConnected] = useState(false);
    const [tagsWithParcelDetails, setTagsWithParcelDetails] = useState<TagWithParcelDetails[]>([]);
    const [dispatchedIds, setDispatchedIds] = useState<string[]>([]);

    const handleRemoveTag = (epcId: string) => {
        setTagsWithParcelDetails((prevTags) => prevTags.filter(tag => tag.epcId !== epcId));
    };

    const columns = DispatchedParcelsColumns(handleRemoveTag);

    const onClickConnectReader = () => {
        setConnectingReader(true);
        setConnected(false);
        socket?.emit("client-to-server:connect-reader", { readerRole: "Writer" });
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onReaderConnected = (props: ReaderDetails) => {
        setConnectingReader(false);
        setConnected(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onReaderDisconnected = (props: ReaderDetails) => {
        setConnected(false);
    };

    const onClickReadingTags = () => {
        setReadingTags(true);
        socket?.emit("client-to-server:start-reading-parcel-tags-for-dispatch", { readerRole: "Writer" });
    };

    const onClickStopReadingTags = () => {
        socket?.emit("client-to-server:stop-reading-tags");
    };

    const onTagsReadingStopped = () => {
        setReadingTags(false);
    };

    const onTagsRead = useCallback((data: TagWithParcelDetails[]) => {

        if (!data.length) return;

        setTagsWithParcelDetails((prevTags) => {
            const updatedTags = structuredClone(prevTags);

            data.forEach(tag => {
                if (tag.epcId.length === 24 && (-1 * tag.rssiValue) >= 200) {
                    const existingTagIndex = updatedTags.findIndex(t => t.epcId === tag.epcId);
                    if (existingTagIndex !== -1) {
                        updatedTags[existingTagIndex].readCount += 1;
                    } else {
                        updatedTags.push({ ...tag, readCount: 1 });
                    }
                }
            });
            return updatedTags;
        });
        if (!connected) {
            setConnected(true)
        }
        if (connectingReader) {
            setConnectingReader(false)
        }
        if (!readingTags) {
            setReadingTags(true)
        }
    }, [connected, connectingReader, readingTags]);

    const handleDispatchAllParcels = async () => {
        try {
            const tagIds = tagsWithParcelDetails.map(tag => tag.epcId);
            console.log("in frontend dispatch parcels")
            const updatedParcelsStatus = await axios.post(
                `http://localhost:4000/api/v1/parcel/dispatch-parcels`,
                {
                    tagIds
                },
                {
                    withCredentials: true,
                });
            if (updatedParcelsStatus.data && updatedParcelsStatus.data.success) {
                const dispatchedParcels = updatedParcelsStatus.data.updatedParcels; // Array of { tagId, parcelId }
                console.log("Dispatched Parcels:", dispatchedParcels);

                // Extract just the tagIds
                const dispatchedTagIds = dispatchedParcels.map(({ tagId }: { tagId: string }) => tagId);
                console.log("Dispatched Tag Ids:", dispatchedTagIds);
                setDispatchedIds(dispatchedTagIds);

                toast({
                    title: "Parcels Dispatched",
                    duration: 5000,
                    description: `${dispatchedTagIds.length} parcel(s) successfully dispatched!`,
                });

            }
            console.log("Dispatched Parcels Status:", dispatchedIds);
            console.log(updatedParcelsStatus);
        } catch (error) {
            // if(error)   No parcels are in 'Pending' status to update
            if (axios.isAxiosError(error) && error.response?.data.message === "No parcels are in 'Pending' status to update") {
                toast({
                    title: "Error",
                    duration: 5000,
                    variant: "destructive",
                    description: "No parcels exist with this tag id",
                });
            }
        }
    }

    useEffect(() => {
        if (dispatchedIds.length > 0) {
            setTimeout(() => {
                setTagsWithParcelDetails((prevTags) => prevTags.filter(tag => !dispatchedIds.includes(tag.epcId)));
            }, 5000);
        }
    }, [dispatchedIds]);

    useEffect(() => {
        if (socket) {
            socket.on("server-to-client:reader-connected", onReaderConnected);
            socket.on("server-to-client:reader-disconnected", onReaderDisconnected);
            socket.on("server-to-client:parcel-tags-read-for-dispatch", onTagsRead);
            socket.on("server-to-client:tags-reading-stopped", onTagsReadingStopped);

            return () => {
                socket.off("server-to-client:reader-connected", onReaderConnected);
                socket.off("server-to-client:reader-disconnected", onReaderDisconnected);
                socket.off("server-to-client:parcel-tags-read-for-dispatch", onTagsRead);
                socket.off("server-to-client:tags-reading-stopped", onTagsReadingStopped);
            };
        }
    }, [socket, onTagsRead]);

    const currentWarehouse = userInfo?.warehouseUsers.find(warehouseUser => warehouseUser.warehouse.id === param.warehouseId);
    const writer = currentWarehouse?.warehouse.readers?.find(reader => reader.role === "Writer");

    return (
        <Authenticate>
            <Authorization roles={["Admin", "Manager"]} navigate={true}>
                <>
                    <div className='flex flex-row-reverse justify-between'>
                        <div className="p-5 w-fit">
                            {socketStatuses?.connected && writer ? (
                                !connected ? (
                                    <Button className="px-3 my-2" onClick={onClickConnectReader}>
                                        {connectingReader ? <Loader2 className="animate-spin" /> : "Connect Reader"}
                                    </Button>
                                ) : !readingTags ? (
                                    <Button className="px-3 my-2" onClick={onClickReadingTags}>Start Scanning</Button>
                                ) : (
                                    <Button className="px-3 my-2" onClick={onClickStopReadingTags}>
                                        Stop Scanning <Loader2 className="animate-spin" />
                                    </Button>
                                )
                            ) : (
                                <h1 className="text-red-600">No writer configured at this warehouse</h1>
                            )}
                        </div>
                        {
                            tagsWithParcelDetails.length > 0 && (
                                <div className="p-5 w-fit">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div> {/* Wrapper div needed because disabled buttons can't trigger tooltips */}
                                                    <Button
                                                        className="px-3 my-2"
                                                        onClick={handleDispatchAllParcels}
                                                        disabled={readingTags}
                                                    >
                                                        Dispatch All Parcels
                                                    </Button>
                                                </div>
                                            </TooltipTrigger>
                                            {readingTags && (
                                                <TooltipContent className='bg-red-500' side='right'>
                                                    <p>Please stop scanning first to dispatch parcels</p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            )
                        }
                    </div>

                    <div className="px-10 py-5 bg-white m-5 rounded-lg">
                        <h1 className="text-2xl font-bold py-2">Parcels Dispatched</h1>
                        <DispatchDataTable columns={columns} data={tagsWithParcelDetails} dispatchedIds={dispatchedIds} />
                    </div>
                </>
            </Authorization>
        </Authenticate>
    );
};

export default ParcelDispatch;
