"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "./DataTable";
import { ParcelColumns } from "./columns";
import { getAllParcelsData } from "@/api/parcel-api";
import Authenticate from "@/components/Auth/Authentication";
import { Parcel } from "@wsm/shared/types/getAllParcels"
import { useParams } from "next/navigation";
import Authorization from "@/components/Auth/Authorization";


const AllParcels = () => {

  const params = useParams<{ warehouseId: string }>();


  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["parcels"],
    queryFn: () => getAllParcelsData(params),
  });

  const columns = ParcelColumns()

  if (isLoading)
    return (
      <p className="flex items-center justify-center h-full font-semibold">
        Loading parcels...
      </p>
    );
  if (isError) return <p>Error: {error?.message}</p>;

  return (
    <Authenticate>
      <Authorization roles={["Admin", "Manager", "Worker", "CounterMan"]} navigate>
        <div className="px-10 py-5 bg-white m-5 rounded-lg">
          <h1 className="text-2xl font-bold py-2">Parcels List</h1>
          <DataTable columns={columns} data={data as Parcel[]} />
        </div>
      </Authorization>
    </Authenticate>
  );
};

export default AllParcels;
