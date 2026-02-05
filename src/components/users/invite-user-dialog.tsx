"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Copy, Check, Mail, Send, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateInvitation } from "@/hooks/use-invitations";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useAuth } from "@/hooks/use-auth";
import { getInvitationLink } from "@/lib/firestore/invitations";
import type { User } from "@/types";

interface EmailResult {
  emailSent: boolean;
  emailConfigured: boolean;
}

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "manager", "cashier"]),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const [invitationId, setInvitationId] = useState<string | null>(null);
  const [emailResult, setEmailResult] = useState<EmailResult | null>(null);
  const [copied, setCopied] = useState(false);

  const { currentUser } = useCurrentUser();
  const { user: authUser } = useAuth();
  const createInvitation = useCreateInvitation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema) as any,
    mode: "onChange",
    defaultValues: {
      email: "",
      role: "cashier",
    },
  });

  const currentRole = watch("role");

  const handleFormSubmit = async (data: InviteFormData) => {
    try {
      const inviterName = currentUser?.displayName || authUser?.displayName || "Your team";

      // Create the invitation in Firestore
      const invitation = await createInvitation.mutateAsync({
        email: data.email,
        role: data.role,
        invitedBy: authUser?.uid || "",
        invitedByName: inviterName,
      });

      setInvitationId(invitation.id);

      // Try to send the invitation email
      try {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const response = await fetch("/api/invitations/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.email,
            inviterName,
            role: data.role,
            invitationId: invitation.id,
            expiresAt: expiresAt.toISOString(),
          }),
        });

        const result = await response.json();
        setEmailResult({
          emailSent: result.emailSent ?? false,
          emailConfigured: result.emailConfigured ?? false,
        });
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError);
        setEmailResult({ emailSent: false, emailConfigured: false });
      }
    } catch (error) {
      console.error("Failed to create invitation:", error);
    }
  };

  const handleCopyLink = async () => {
    if (!invitationId) return;

    const link = getInvitationLink(invitationId);
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setInvitationId(null);
    setEmailResult(null);
    setCopied(false);
    reset();
    onOpenChange(false);
  };

  const handleSendAnother = () => {
    setInvitationId(null);
    setEmailResult(null);
    setCopied(false);
    reset();
  };

  // Success state - show the invitation link
  if (invitationId) {
    const inviteLink = getInvitationLink(invitationId);

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Invitation Created
            </DialogTitle>
            <DialogDescription>
              The invitation has been created successfully.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Email status message */}
            {emailResult?.emailSent ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-sm text-green-700 flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Invitation email sent successfully!
                </p>
              </div>
            ) : emailResult?.emailConfigured === false ? (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <p className="text-sm text-yellow-700 flex items-center">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Email service not configured. Please share the link manually.
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  To enable automatic emails, set the RESEND_API_KEY environment variable.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700 flex items-center">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Failed to send email. Please share the link manually.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Invitation Link</Label>
              <div className="flex gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This link will expire in 7 days.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleSendAnother}>
              <Send className="mr-2 h-4 w-4" />
              Invite Another
            </Button>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Form state - collect email and role
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your organization. They&apos;ll receive an email with a link to create their account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="colleague@company.com"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={currentRole}
              onValueChange={(value: User["role"]) => setValue("role", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex flex-col">
                    <span>Admin</span>
                    <span className="text-xs text-muted-foreground">
                      Full access to all features
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="manager">
                  <div className="flex flex-col">
                    <span>Manager</span>
                    <span className="text-xs text-muted-foreground">
                      Manage inventory, view reports
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="cashier">
                  <div className="flex flex-col">
                    <span>Cashier</span>
                    <span className="text-xs text-muted-foreground">
                      Process sales only
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role.message}</p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createInvitation.isPending}>
              {createInvitation.isPending ? "Creating..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
