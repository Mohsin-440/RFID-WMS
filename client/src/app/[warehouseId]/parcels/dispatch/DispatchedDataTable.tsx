import * as React from "react";
import {
  flexRender,
  SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  dispatchedIds: string[];
  data: TData[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DispatchDataTable<TData extends Record<string, any>>({ dispatchedIds, columns, data = [], }: DataTableProps<TData>) {
  
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const filteredData = React.useMemo(() => {
    const arrayData = Array.isArray(data) ? data : [];
    if (!globalFilter) return arrayData.slice().reverse();
    return arrayData
      .filter((row) => {
        const rowString = Object.values(row).join(" ").toLowerCase();
        return rowString.includes(globalFilter.toLowerCase());
      })
      .reverse();
  }, [data, globalFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <>
      <div className="flex items-center py-4">
        <Input
          placeholder="Search..."
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="w-full"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const rowData = row.original; 
                const isDispatched = dispatchedIds.includes(rowData.epcId); 

                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={`hover:bg-gray-200 ${isDispatched ? "bg-green-200" : ""}`} 
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
