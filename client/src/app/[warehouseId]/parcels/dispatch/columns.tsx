import { ColumnDef } from "@tanstack/react-table";
import { RxCross1 } from "react-icons/rx";

type Tag = {
    epcId: string;
    readCount: number;
    rssiValue: number;
    antennaId: number;
    frequency: number;
    timestamp: number;
};

export const DispatchedParcelsColumns = (handleRemoveTag: { (epcId: string): void; }): ColumnDef<Tag>[] => {

    return [
        {
            accessorKey:"Sr #",
            header: "Sr #",
            cell: ({ row }) => row.index + 1,
        },
        {
            accessorKey: "id",
            header: "Tag ID",
            cell: ({ row }) => row.original.epcId,
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


