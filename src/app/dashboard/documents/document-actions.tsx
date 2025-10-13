'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
  documentAuditSuggestion,
  type DocumentAuditSuggestionOutput,
} from '@/ai/flows/document-audit-suggestion';
import { Loader2 } from 'lucide-react';
import { Document } from './page';

export function DocumentActions({ document }: { document: Document }) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [auditResult, setAuditResult] = React.useState<DocumentAuditSuggestionOutput | null>(null);

  const handleSuggestAudit = async () => {
    setIsDialogOpen(true);
    setIsLoading(true);
    setAuditResult(null);

    const result = await documentAuditSuggestion({
      documentName: document.name,
      versionNumber: document.version,
      uploadCount: document.upload_count,
      modificationCount: document.modification_count,
      lastUploadedBy: document.modifiedBy,
    });
    
    setAuditResult(result);
    setIsLoading(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-haspopup="true" size="icon" variant="ghost">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem>Download</DropdownMenuItem>
          <DropdownMenuItem>View History</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSuggestAudit}>Suggest Audit (AI)</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Audit Suggestion</DialogTitle>
            <DialogDescription>
              Analysis for document: <span className="font-semibold">{document.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Analyzing document activity...</span>
              </div>
            )}
            {auditResult && (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg ${
                    auditResult.auditRecommended
                      ? 'bg-destructive/10 border-destructive/50 border'
                      : 'bg-green-600/10 border-green-600/50 border'
                  }`}
                >
                  <h4 className="font-semibold">
                    {auditResult.auditRecommended
                      ? 'Audit Recommended'
                      : 'Audit Not Recommended'}
                  </h4>
                  <p className="text-sm text-muted-foreground">{auditResult.reason}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}