import { ColumnDef } from "@tanstack/react-table";
import { RxCross1 } from "react-icons/rx";
import { TagWithParcelDetails } from "@wsm/shared/types/tagWithParcelDetails";

export const DispatchedParcelsColumns = (handleRemoveTag: { (epcId: string): void; }): ColumnDef<TagWithParcelDetails>[] => {

    return [
        {
            accessorKey: "Sr #",
            header: "Sr #",
            cell: ({ row }) => row.index + 1,
        },
        {
            accessorKey: "id",
            header: "Tag ID",
            cell: ({ row }) => row.original.epcId,
        },
        {
            accessorKey: "senderDetails",
            header: "Sender Details",
            cell: ({ row }) => {
                const senderName = row.original.parcel.senderFirstName + " " + row.original.parcel.senderLastName;
                const senderPhone = row.original.parcel.senderPhoneNumber;
                return (
                    <div className="flex flex-col">
                        <p className="capitalize">{senderName}</p>
                        <p className="capitalize">{senderPhone}</p>
                    </div>
                )
            },
        },
        {
            accessorKey: "receiverDetails",
            header: "Receiver Details",
            cell: ({ row }) => {
                const receiverName = row.original.parcel.receiverFirstName + " " + row.original.parcel.receiverLastName;
                const receiverPhone = row.original.parcel.receiverPhoneNumber;
                return (
                    <div className="flex flex-col">
                        <p className="capitalize">{receiverName}</p>
                        <p className="capitalize">{receiverPhone}</p>
                    </div>
                )
            },
        },
        {
            accessorKey: "parcelStatus",
            header: "Parcel Status",
            cell: ({ row }) => {
                return <span>{row.original.parcel.parcelStatuses[0].status}</span>;
            },
        },
        {
            accessorKey: "totalReads",
            header: "Total Reads",
            cell: ({ row }) => row.original.readCount,
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const parcel = row.original;
                return (
                    <button
                        onClick={() => handleRemoveTag(parcel.epcId)}
                        className="inline-flex items-center justify-center hover:text-gray-400 transition-colors"
                    >
                        <RxCross1 className="h-4 w-4 text-red-700" />
                    </button>
                );
            },
        },
    ];
}


