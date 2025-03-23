import { Socket } from "socket.io-client";
import { create } from "zustand";

type T_Socket = {
    socket?: Socket;
    setSocket: (socket?: Socket) => void;
    socketStatuses: {
        connected: boolean,
        connecting: boolean,
        id?: string,
        disconnected: boolean;
    };
    setSocketStatuses: (socketStatuses: T_Socket["socketStatuses"]) => void
}

export const useSocketStore = create<T_Socket>((set) => ({
    socket: undefined,
    setSocket: (socket) => set((store) => ({ ...store, socket })),
    socketStatuses: {
        connected: false,
        disconnected: true,
        connecting: false,
        id: ""
    },
    setSocketStatuses: (socketStatuses) => set((store) => ({
        ...store,
        socketStatuses: {
            ...store.socketStatuses,
            ...socketStatuses
        }
    }))
}))
