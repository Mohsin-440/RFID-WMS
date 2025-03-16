import * as net from 'net';
import express from 'express';
import { io } from "socket.io-client";
import {  redisClient } from './libs/redis';
import { config } from "dotenv";
import { events } from './registers/events';
import { ReaderDetails } from './types/readerDetails';
import { stopReadingInventory } from './utilts/stopReadingInventory';
config({ path: ".env" });

const app = express()

export const tcpClientSocket = new net.Socket();

export const clientSocket = io("http://localhost:4000", {
    auth: {
        readerServerId: process.env.READER_ID as string,
    }
});

clientSocket.on("connect", async () => {

    console.log("reader server connected to remote server", clientSocket.id)

    const resBody = {
        readerServerId: process.env.READER_ID as string,
        readerYearModel: null,
        serialNumber: null,
        address: process.env.ADDRESS,
        role: process.env.ROLE,
        connectionStatus: "not-connected"
    }

    clientSocket.emit("reader-to-server:reader-server-connected", resBody)
})

setTimeout(() => {
    events(clientSocket)
}, 200)


clientSocket.on("disconnect", async () => {
    const readingTags = await redisClient.get("reading-tags");

    if (Number(readingTags))
        await stopReadingInventory()

    console.log("reader server disconnected from remote server")
})

const port = Number(process.env.PORT) || 2000;


tcpClientSocket.on('error', (err) => {
    console.error('Error occurred:', err.message);
});

tcpClientSocket.on('close', async () => {
    const readerDetails = await redisClient.get("reader-details")
    if (readerDetails) {
        const readerDetailsParsed = JSON.parse(readerDetails) as ReaderDetails
        readerDetailsParsed.connectionStatus = "not-connected"
        await redisClient.set("reader-details", JSON.stringify(readerDetailsParsed))
    }
    clientSocket.emit("reader-to-server:reader-disconnected", readerDetails ? { readerDetails: JSON.parse(readerDetails) } : null);

    console.log('Connection to RFID reader closed.');
});

tcpClientSocket.on('timeout', () => {
    console.log('Connection timed out.');
});

const server = app.listen(port, () => {
    console.log(`reader server is running on port ${port}`)
});

process.on('SIGINT', () => {
    console.log('Shutting down server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});