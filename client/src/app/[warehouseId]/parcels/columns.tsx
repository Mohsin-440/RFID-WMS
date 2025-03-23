import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, CheckCircle, Edit, Eye, Truck } from "lucide-react"; 
import Link from "next/link";
import ParcelActions from "./ParcelActions"; 
import { Parcel } from "@wsm/shared/types/getAllParcels"
import { useParams } from "next/navigation";

export const ParcelColumns = (): ColumnDef<Parcel>[] => {
  const { warehouseId } = useParams<{ warehouseId: string }>();

  return [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => row.original.id, // Format ID by slicing the string
    },
    {
      accessorKey: "senderName",
      header: "Sender Name",
      cell: ({ row }) => {
        const senderName = row.original.senderFirstName + " " + row.original.senderLastName;
        return <span>{senderName}</span>; // Format date to en-GB format
      },
    },
    {
      accessorKey: "receiverName",
      header: "Receiver Name",
      cell: ({ row }) => {
        const receiverName = row.original.receiverFirstName + " " + row.original.receiverLastName;
        return <span>{receiverName}</span>; // Format date to en-GB format
      },
    },
    {
      accessorKey: "receiverAddress",
      header: "Recipient Address",
    },
    {
      accessorKey: "bookingDate",
      header: "Booking Date",
      cell: ({ row }) => {
        const date = new Date(row.original.parcelDate);
        const formattedDate = new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(date).replace(/\//g, "-");
        return <span>{formattedDate}</span>; // Format date to en-GB format
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.parcelStatuses[0].status as "Pending" | "Dispatched" | "Delivered";
        return (
          <div className="flex items-center gap-2">
            {status === "Pending" && (
              <Truck className="h-4 w-4 text-yellow-500" />
            )}
            {status === "Dispatched" && (
              <ArrowUpDown className="h-4 w-4 text-blue-500" />
            )}
            {status === "Delivered" && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            <span>{status}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const parcel = row.original;
        return (
          <>
            <div className="flex items-center gap-4">
              <Link
                href={`/${warehouseId}/parcels/view/${parcel.id}`}
                className="inline-flex items-center justify-center hover:text-gray-400 transition-colors"
              >
                <Eye className="h-4 w-4" />
              </Link>

              {/* Edit Button */}
              <Link
                href={`/${warehouseId}/parcels/edit/${parcel.id}`}
                className="inline-flex items-center justify-center hover:text-purple-400 transition-colors"
              >
                <Edit className="h-4 w-4" />
              </Link>

              {/* Parcel Actions Component - Always Visible */}
              <ParcelActions parcelId={parcel.id} currentStatus={parcel.parcelStatuses[0].status} />
            </div>
          </>
        );
      },
    },
  ];
}


