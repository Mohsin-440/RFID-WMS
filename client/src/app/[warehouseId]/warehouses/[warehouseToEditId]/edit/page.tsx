"use client";

import React, { useEffect } from 'react'
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Inputs from "@/components/Inputs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import Authenticate from '@/components/Auth/Authentication';
import Authorization from '@/components/Auth/Authorization';

const warehouseSchema = z.object({
    warehouseName: z.string().min(1, "Warehouse name is required"),
    warehouseAddress: z.string().min(1, "Warehouse address is required"),
});


type WarehouseFormInputs = z.infer<typeof warehouseSchema>;

const AddWarehousePage = () => {
    const router = useRouter();
    const { toast } = useToast();
    const params = useParams<{ warehouseId: string; warehouseToEditId: string }>()
    const {
        register,
        handleSubmit,
        setError,
        setValue,
        formState: { errors },
    } = useForm<WarehouseFormInputs>({
        resolver: zodResolver(warehouseSchema),
    });
    const { data: warehouseFromDb } = useQuery({
        queryKey: ['warehouse', params.warehouseToEditId],
        queryFn: async () => {
            const response = await axios.get<{
                data: {
                    warehouseName: string;
                    warehouseAddress: string;
                    id: string;
                }
            }>(
                `http://localhost:4000/api/v1/warehouses/${params.warehouseToEditId}`,
                { withCredentials: true }
            );
            return response.data.data;
        }
    });

    const { mutate, isPending } = useMutation({
        mutationFn: (data: WarehouseFormInputs) => {
            return axios.put(
                `http://localhost:4000/api/v1/warehouses/${params.warehouseToEditId}/edit`,
                data,
                {
                    withCredentials: true,
                }
            );
        },


        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
            if (error.response?.data?.message)
                toast({
                    title: "Error",
                    description: error.response?.data?.message,
                    variant: "destructive",
                    duration: 5000,
                });

            if (error.response?.data?.warehouseName)
                setError("warehouseName", { message: error.response?.data?.warehouseName })

            if (error.response?.data?.warehouseAddress)
                setError("warehouseAddress", { message: error.response?.data?.warehouseAddress })
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Warehouse Updated successfully",
            });
            router.push(`/${params.warehouseId}/warehouses`);
        },
    });

    const onSubmit = (data: WarehouseFormInputs) => {
        mutate(data);
    };

    useEffect(() => {
        if (warehouseFromDb) {
            setValue("warehouseName", warehouseFromDb?.warehouseName);
            setValue("warehouseAddress", warehouseFromDb?.warehouseAddress);
        }
    }, [setValue, warehouseFromDb])

    return (
        <Authenticate>
            <Authorization roles={["Admin"]} navigate={true}>
                <section className="flex flex-col items-center px-4 py-10 md:px-60">
                    <div className="w-full max-w-[450px] space-y-6">
                        {/* Heading */}
                        <div className="space-y-2 text-center">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Update Warehouse
                            </h1>
                            <p className="text-sm text-gray-500">
                                Enter the details of your warehouse
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <Inputs
                                type="text"
                                placeholder="Warehouse Name"
                                {...register("warehouseName")}
                                error={errors.warehouseName?.message}
                            />
                            <Inputs
                                type="text"
                                placeholder="Warehouse Address"
                                {...register("warehouseAddress")}
                                error={errors.warehouseAddress?.message}
                            />

                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full rounded-md bg-blue-600 px-4 py-2 text-white font-semibold 
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                     focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
                     transition duration-200 ease-in-out"
                            >
                                {isPending ? "Updating Warehouse..." : "Update Warehouse"}
                            </button>
                        </form>
                    </div>
                </section>
            </Authorization>
        </Authenticate>
    );
};

export default AddWarehousePage;