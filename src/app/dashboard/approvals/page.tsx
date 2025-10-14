'use client';

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { PageHeader } from '../components/page-header';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getApprovalRequests, decideOnApproval } from '../tasks/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';


export type ApprovalRequest = {
  id: string;
  title: string;
  priority: string;
  project: {
    id: string;
    name: string;
  };
  requested_by: {
    id: string;
    full_name: string;
  };
};

function ApprovalActions({ request }: { request: ApprovalRequest }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState<'approve' | 'reject' | null>(null);
    const router = useRouter();

    const handleDecision = async (decision: 'approve' | 'reject') => {
        setIsLoading(decision);
        const newStatus = decision === 'approve' ? 'Backlog' : 'Blocked';
        const result = await decideOnApproval(request.id, newStatus, request.project.id);
        
        if (result.error) {
            toast({
                variant: 'destructive',
                title: `Error ${decision === 'approve' ? 'Approving' : 'Rejecting'} Task`,
                description: result.error,
            });
        } else {
            toast({
                title: 'Decision Recorded',
                description: `The task "${request.title}" has been ${decision === 'approve' ? 'approved and moved to To Do' : 'rejected and moved to Blocked'}.`,
            });
             router.refresh();
        }
        setIsLoading(null);
    }

    return (
        <div className="flex gap-2">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => handleDecision('approve')} disabled={!!isLoading}>
                           {isLoading === 'approve' ? <Loader2 className="h-4 w-4 animate-spin"/> : <ThumbsUp className="h-4 w-4 text-green-500"/>} 
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Approve</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Button variant="outline" size="icon" onClick={() => handleDecision('reject')} disabled={!!isLoading}>
                             {isLoading === 'reject' ? <Loader2 className="h-4 w-4 animate-spin"/> : <ThumbsDown className="h-4 w-4 text-red-500"/>}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reject</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}


export const columns: ColumnDef<ApprovalRequest>[] = [
  {
    accessorKey: 'title',
    header: 'Task Title',
    cell: ({ row }) => <div className="font-medium">{row.getValue('title')}</div>,
  },
  {
    accessorKey: 'project.name',
    header: 'Project',
    cell: ({ row }) => row.original.project.name,
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: ({ row }) => {
        const priority = row.getValue('priority') as string;
        return <Badge variant={priority === 'High' ? 'destructive' : priority === 'Medium' ? 'secondary' : 'outline'}>{priority}</Badge>;
    },
  },
  {
    accessorKey: 'requested_by.full_name',
    header: 'Requested By',
     cell: ({ row }) => row.original.requested_by.full_name,
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const request = row.original;
      return <ApprovalActions request={request} />;
    },
  }
];


export default function ApprovalsPage() {
  const [data, setData] = React.useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    async function fetchRequests() {
      setLoading(true);
      const { data: requestData, error } = await getApprovalRequests();
      if (error) {
        toast({
            variant: 'destructive',
            title: 'Error fetching approval requests',
            description: error,
        });
      } else if (requestData) {
        setData(requestData as unknown as ApprovalRequest[]);
      }
      setLoading(false);
    }
    fetchRequests();
  }, [toast]);
  
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    })

  return (
    <div className="flex flex-col gap-6 w-full">
      <PageHeader title="Task Approvals" description="Review and act on tasks awaiting your approval." />
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={columns.length} >
                        <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
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
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No pending approvals.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
       <div className="flex items-center justify-end space-x-2 py-4">
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
