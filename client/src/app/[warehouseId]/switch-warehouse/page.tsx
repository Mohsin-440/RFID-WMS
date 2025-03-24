"use client";
import { getAllWarehousesData } from '@/api/warehouse-api';
import Authenticate from '@/components/Auth/Authentication';
import Authorization from '@/components/Auth/Authorization';
import { useQuery } from '@tanstack/react-query';
import { Warehouse } from '@wsm/shared/types/getWarehousesRes';
import React from 'react'
import WarehouseSwitcher from './WarehouseSwitcher';

const SwitchWarehouse = () => {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["warehouses"],
        queryFn: getAllWarehousesData,
    });
    if (isLoading)
        return (
            <p className="flex items-center justify-center h-full font-semibold">
                Loading warehouses...
            </p>
        );
    if (isError) return <p>Error: {error?.message}</p>;

    return (
        <Authenticate>
            <Authorization roles={["Admin"]} navigate>
                <div className="px-10 py-5 bg-white m-5 rounded-lg">
                    <h1 className="text-2xl font-bold py-2">Switch Warehouses</h1>
                    <WarehouseSwitcher warehouses={data?.data as Warehouse[]} />
                </div>
            </Authorization>
        </Authenticate>
    );
}

export default SwitchWarehouse