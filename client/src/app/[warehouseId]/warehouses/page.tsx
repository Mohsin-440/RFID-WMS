"use client"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import Authenticate from '@/components/Auth/Authentication';
import Authorization from '@/components/Auth/Authorization';
import Link from "next/link"

interface Warehouse {
  id: string
  warehouseName: string
  warehouseAddress: string
}

export default function WarehousesPage() {
  const router = useRouter()
  const params = useParams<{ warehouseId: string }>()
  const { data: warehouses, isLoading } = useQuery({
    queryKey: ["warehouses-list"],
    queryFn: async () => {
      try {
        const response = await axios.get<{ data: Warehouse[] }>(
          "http://localhost:4000/api/v1/warehouses",
          { withCredentials: true }
        )
        console.log(response.data)
        return response.data.data || []
      } catch (error) {
        console.error('Error fetching warehouses:', error)
        return []
      }
    },

  })

  console.log(warehouses)
  return (
    <Authenticate>
      <Authorization roles={["Admin"]} navigate={true}>
        <div className="container mx-auto py-10 px-5  max-w-[600px]">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
            <Button
              onClick={() => router.push(`/${params.warehouseId}/warehouses/add`)}
              className="bg-blue-600 hover:bg-blue-700 px-2"
            >
              <PlusIcon className=" h-4 w-4" />
              Add Warehouse
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading state
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-[180px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[80px] ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : warehouses?.length ? (
                  warehouses.map((warehouse) => (
                    <TableRow key={warehouse.id}>

                      <TableCell className="font-medium">{warehouse.warehouseName}</TableCell>

                      <TableCell>{warehouse.warehouseAddress}</TableCell>

                      <TableCell className="text-right">

                        <Link
                          href={`/${params.warehouseId}/warehouses/${warehouse.id}/edit`}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                          >
                            Edit
                          </Button>
                        </Link>

                      </TableCell>

                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-gray-500">
                      No warehouses found. Add one to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Authorization >
    </Authenticate>
  )
}