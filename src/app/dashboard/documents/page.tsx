'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '../components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DocumentActions } from './document-actions';
import { getDocuments } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import { UploadDocumentForm } from './upload-document-form';
import { useToast } from '@/hooks/use-toast';

export type Document = {
  id: string;
  name: string;
  version: number;
  last_modified: string;
  lastModified: string;
  modifiedBy: string;
  upload_count: number;
  modification_count: number;
  project_id: string;
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchDocuments() {
      setLoading(true);
      const { data, error } = await getDocuments();
      if (error) {
        toast({
            variant: 'destructive',
            title: 'Error fetching documents',
            description: error,
        });
      } else if (data) {
        setDocuments(data as unknown as Document[]);
      }
      setLoading(false);
    }
    fetchDocuments();
  }, [toast]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Documents"
        description="Centralized repository for all project documents."
      >
        <UploadDocumentForm>
          <Button size="sm" className="gap-1">
            <PlusCircle className="h-4 w-4" />
            Upload Document
          </Button>
        </UploadDocumentForm>
      </PageHeader>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Version</TableHead>
                <TableHead className="hidden sm:table-cell">Last Modified</TableHead>
                <TableHead className="hidden md:table-cell">Modified By</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : documents.length > 0 ? (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">{doc.version}</TableCell>
                    <TableCell className="hidden sm:table-cell">{doc.lastModified}</TableCell>
                    <TableCell className="hidden md:table-cell">{doc.modifiedBy}</TableCell>
                    <TableCell>
                      <DocumentActions document={doc} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No documents found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
