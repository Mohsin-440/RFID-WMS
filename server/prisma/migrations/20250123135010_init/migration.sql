-- CreateEnum
CREATE TYPE "Status" AS ENUM ('Pending', 'Dispatched', 'Delivered');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Admin', 'Manager', 'CounterMan', 'Worker');

-- CreateEnum
CREATE TYPE "ReaderType" AS ENUM ('Writer', 'Reader');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "profilePicture" TEXT,
    "role" "Role" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParcelDetails" (
    "id" TEXT NOT NULL,
    "parcelName" TEXT NOT NULL,
    "parcelPrice" TEXT NOT NULL,
    "parcelDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parcelTrackingNumber" TEXT NOT NULL,
    "parcelWeight" DOUBLE PRECISION NOT NULL,
    "senderFirstName" TEXT NOT NULL,
    "senderLastName" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "senderPhoneNumber" TEXT NOT NULL,
    "senderAddress" TEXT NOT NULL,
    "receiverFirstName" TEXT NOT NULL,
    "receiverLastName" TEXT NOT NULL,
    "receiverEmail" TEXT NOT NULL,
    "receiverPhoneNumber" TEXT NOT NULL,
    "receiverAddress" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParcelDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParcelStatus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "status" "Status" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParcelStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseUser" (
    "userId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarehouseUser_pkey" PRIMARY KEY ("userId","warehouseId")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "warehouseName" TEXT NOT NULL,
    "warehouseAddress" TEXT NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reader" (
    "id" TEXT NOT NULL,
    "readerServerId" TEXT NOT NULL,
    "readerYearModel" BIGINT,
    "serialNumber" TEXT,
    "address" TEXT NOT NULL,
    "role" "ReaderType" NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reader_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseUser_userId_warehouseId_key" ON "WarehouseUser"("userId", "warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_warehouseName_key" ON "Warehouse"("warehouseName");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_warehouseAddress_key" ON "Warehouse"("warehouseAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Reader_readerServerId_key" ON "Reader"("readerServerId");

-- CreateIndex
CREATE UNIQUE INDEX "Reader_serialNumber_key" ON "Reader"("serialNumber");

-- CreateIndex
CREATE INDEX "Reader_readerServerId_idx" ON "Reader"("readerServerId");

-- AddForeignKey
ALTER TABLE "ParcelDetails" ADD CONSTRAINT "ParcelDetails_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParcelStatus" ADD CONSTRAINT "ParcelStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParcelStatus" ADD CONSTRAINT "ParcelStatus_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "ParcelDetails"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseUser" ADD CONSTRAINT "WarehouseUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseUser" ADD CONSTRAINT "WarehouseUser_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reader" ADD CONSTRAINT "Reader_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
