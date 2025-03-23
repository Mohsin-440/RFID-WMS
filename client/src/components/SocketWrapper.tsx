"use client"

import { useIsMounted } from '@/hooks/use-is-mounted';
import TagsMonitor from '@/components/TagsMonitor';
import { useSocketStore } from '@/store/socket.store';
import { useUserStore } from '@/store/user.store';
import { Login } from '@wsm/shared/types/login';
import { useParams } from 'next/navigation';
import React, { useCallback, useEffect } from 'react'
import { io } from "socket.io-client";
import { useAutoplay } from './AutoplayProvider';
import { setLocalStorage } from '@/lib/local-storage';

function SocketWrapperComp({ children }: { children: React.ReactNode }) {

    const { socket, socketStatuses, setSocket, setSocketStatuses } = useSocketStore();
    const params = useParams<{ warehouseId: string }>()
    const isMounted = useIsMounted()
    const { userInfo, setUserInfo } = useUserStore();

    useEffect(() => {
        if (!socket && isMounted && userInfo) {
            const socketIo = io(process.env.NEXT_PUBLIC_SERVER_BASE_URL, {
                reconnection: true,
                reconnectionAttempts: 20,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 3000,
                auth: params,
                withCredentials: true
            })
            socketIo.on("connect", () => {
                setSocketStatuses({
                    connected: true,
                    disconnected: false,
                    connecting: false,
                    id: socketIo?.id
                })
                setSocket(socketIo)
            })
            return () => {
                socketIo.removeListener("connect", () => {
                    setSocketStatuses({
                        connected: true,
                        disconnected: false,
                        connecting: false,
                        id: socketIo?.id
                    })
                    setSocket(socketIo)
                })
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, isMounted, userInfo, params])


    const onConnect = useCallback(() => {
        setSocketStatuses({
            connected: true,
            disconnected: false,
            connecting: false,
            id: socket?.id
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket?.id])

    const onDisconnect = useCallback(() => {

        setSocketStatuses({
            connected: false,
            disconnected: true,
            connecting: false,
            id: socket?.id
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket?.id])


    const onConnectError = useCallback((error: Error) => {
        if (socket?.active) {
            setSocketStatuses({
                connected: false,
                disconnected: false,
                connecting: true,
                id: socket?.id
            })
        } else {
            socket?.connect()
            console.log(error.message);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket?.active])


    useEffect(() => {
        if (socket) {
            socket.on("connect", onConnect)
            socket.on("disconnect", onDisconnect)
            socket.on("connect_error", onConnectError)


            return () => {
                socket.removeListener("connect", onConnect)
                socket.removeListener("disconnect", onDisconnect)
                socket.removeListener("connect_error", onConnectError)
            }
        }
    }, [onConnect, onConnectError, onDisconnect, socket])


    const onUserUpdate = useCallback((userData: { user: Login["res"]["user"] }) => {
        if (userData.user) {
            setLocalStorage("user-info", userData.user)
            setUserInfo(userData.user)
        }

    }, [setUserInfo])


    useEffect(() => {
        if (!socketStatuses.connected)
            return

        socket?.on("server-to-client:updated-user-details", onUserUpdate)

        return () => {
            socket?.removeListener("server-to-client:updated-user-details", onUserUpdate)
        }

    }, [onUserUpdate, socket, socketStatuses.connected])

    return (
        children
    )
}


function SocketWrapper({ children }: { children: React.ReactNode }) {
    const { autoplayOn } = useAutoplay()
    return (

        <SocketWrapperComp>
            {autoplayOn ? <TagsMonitor /> : null}
            {children}
        </SocketWrapperComp>

    )
}

export default SocketWrapper