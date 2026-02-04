"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  RefreshCw,
  XCircle,
  Trash2,
  Copy,
  Check,
  Clock,
  Mail,
} from "lucide-react";
import { useState } from "react";
import {
  type Invitation,
  isInvitationExpired,
  getInvitationLink,
} from "@/lib/firestore/invitations";

interface InvitationsTableProps {
  invitations: Invitation[];
  onResend: (invitation: Invitation) => void;
  onRevoke: (invitation: Invitation) => void;
  onDelete: (invitation: Invitation) => void;
  canManage?: boolean;
}

const statusBadgeVariants: Record<
  Invitation["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "default",
  accepted: "secondary",
  expired: "outline",
  revoked: "destructive",
};

export function InvitationsTable({
  invitations,
  onResend,
  onRevoke,
  onDelete,
  canManage = true,
}: InvitationsTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = async (invitation: Invitation) => {
    const link = getInvitationLink(invitation.id);
    await navigator.clipboard.writeText(link);
    setCopiedId(invitation.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (invitations.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No pending invitations
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Invited By</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invitations.map((invitation) => {
          const expired = isInvitationExpired(invitation);
          const effectiveStatus = expired && invitation.status === "pending"
            ? "expired"
            : invitation.status;

          return (
            <TableRow
              key={invitation.id}
              className={effectiveStatus !== "pending" ? "opacity-60" : ""}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{invitation.email}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {invitation.role}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {invitation.invitedByName}
              </TableCell>
              <TableCell>
                <Badge variant={statusBadgeVariants[effectiveStatus]} className="capitalize">
                  {effectiveStatus}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {expired ? (
                    <span className="text-red-500">Expired</span>
                  ) : (
                    <span>
                      {formatDistanceToNow(invitation.expiresAt, { addSuffix: true })}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {canManage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {invitation.status === "pending" && !expired && (
                        <DropdownMenuItem onClick={() => handleCopyLink(invitation)}>
                          {copiedId === invitation.id ? (
                            <Check className="mr-2 h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="mr-2 h-4 w-4" />
                          )}
                          Copy Link
                        </DropdownMenuItem>
                      )}
                      {(invitation.status === "pending" || expired) && (
                        <DropdownMenuItem onClick={() => onResend(invitation)}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Resend
                        </DropdownMenuItem>
                      )}
                      {invitation.status === "pending" && !expired && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onRevoke(invitation)}
                            className="text-amber-600"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Revoke
                          </DropdownMenuItem>
                        </>
                      )}
                      {(invitation.status === "revoked" ||
                        invitation.status === "accepted" ||
                        expired) && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDelete(invitation)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
