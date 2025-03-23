"use client";

import React, { useEffect, useState } from "react";
import { Warehouse } from "@wsm/shared/types/getWarehousesRes";
import { useParams, useRouter } from "next/navigation";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useSocketStore } from "@/store/socket.store";

function WarehouseSwitcher({ warehouses = [] }: { warehouses?: Warehouse[] }) {
    const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    const params = useParams<{ warehouseId: string }>();

    const router = useRouter();

    const { socket } = useSocketStore()

    const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = event.target.value;
        const selectedWarehouseObj = warehouses.find((w) => w.id === selectedId) || null;
        setSelectedWarehouse(selectedWarehouseObj);
        setShowConfirm(true);
    };

    const handleConfirmSwitch = () => {
        if (selectedWarehouse) {
            socket?.emit("client-to-server:stop-reading-tags", selectedWarehouse.id);
            router.push(`/${selectedWarehouse.id}/warehouse`);
        }
        setShowConfirm(false);
    };


    useEffect(() => {
        const warehouse = warehouses.find((w) => w.id === params.warehouseId);

        if (warehouse)
            setSelectedWarehouse(warehouse);
        else
            setSelectedWarehouse(null);
    }, [params, warehouses])


    return (
        <div className="space-y-4">
            <label className="font-semibold text-gray-700">Select Warehouse:</label>
            <select
                onChange={handleSelectChange}
                className="ml-5 mt-2 w-56 text-sm border border-gray-300 rounded-md p-2 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedWarehouse?.id || ""}
            >
             
                <option value="" disabled>
                    Choose a warehouse
                </option>
                {warehouses?.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.warehouseName}
                    </option>
                ))}
            </select>

            {/* Confirmation Modal */}
            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogTrigger asChild>
                    <div />
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Warehouse Switch</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to switch to{" "}
                            <span className="font-semibold">{selectedWarehouse?.warehouseName}</span>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="px-2">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmSwitch}
                            className="bg-blue-500 text-white px-2 hover:bg-blue-600"
                        >
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export default WarehouseSwitcher;
