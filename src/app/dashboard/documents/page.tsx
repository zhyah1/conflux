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
import { documents } from '@/lib/data';
import { DocumentActions } from './document-actions';

export default function DocumentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Documents"
        description="Centralized repository for all project documents."
      >
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-4 w-4" />
          Upload Document
        </Button>
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
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{doc.version}</TableCell>
                  <TableCell className="hidden sm:table-cell">{doc.lastModified}</TableCell>
                  <TableCell className="hidden md:table-cell">{doc.modifiedBy}</TableCell>
                  <TableCell>
                    <DocumentActions document={doc} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
