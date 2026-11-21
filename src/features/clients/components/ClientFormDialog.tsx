"use client";

import React, { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Loader2 } from "lucide-react";
import {
  clientSchema,
  CreateClientInput,
} from "../schemas";
import { createClientAction, updateClientAction } from "@/actions/client.actions";
import { Client } from "@/types/database.types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ClientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
}

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
}: ClientFormDialogProps) {
  const isEditing = !!client;
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      contactEmail: "",
      contactPhone: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        contactPerson: client.contact_person || "",
        contactEmail: client.contact_email || "",
        contactPhone: client.contact_phone || "",
        notes: client.notes || "",
      });
    } else {
      reset({
        name: "",
        contactPerson: "",
        contactEmail: "",
        contactPhone: "",
        notes: "",
      });
    }
  }, [client, reset, open]);

  const onSubmit = (data: CreateClientInput) => {
    startTransition(async () => {
      if (isEditing && client) {
        const res = await updateClientAction({
          id: client.id,
          ...data,
        });

        if (res.success) {
          toast.success(`Client "${res.data.name}" updated successfully.`);
          onOpenChange(false);
          router.refresh();
        } else {
          toast.error(res.error);
        }
      } else {
        const res = await createClientAction(data);

        if (res.success) {
          toast.success(`Client "${res.data.name}" created successfully.`);
          onOpenChange(false);
          reset();
          router.refresh();
        } else {
          toast.error(res.error);
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Client" : "Add New Client"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update organization details, contact information, and notes."
              : "Create a new organization or business account to organize projects and secrets."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field data-invalid={!!errors.name || undefined}>
            <FieldLabel htmlFor="client-name">Client / Company Name *</FieldLabel>
            <Input
              id="client-name"
              placeholder="e.g. Acme Corporation"
              disabled={isPending}
              {...register("name")}
            />
            {errors.name && <FieldError>{errors.name.message}</FieldError>}
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field data-invalid={!!errors.contactPerson || undefined}>
              <FieldLabel htmlFor="client-contact">Primary Contact</FieldLabel>
              <Input
                id="client-contact"
                placeholder="John Doe"
                disabled={isPending}
                {...register("contactPerson")}
              />
              {errors.contactPerson && (
                <FieldError>{errors.contactPerson.message}</FieldError>
              )}
            </Field>

            <Field data-invalid={!!errors.contactEmail || undefined}>
              <FieldLabel htmlFor="client-email">Contact Email</FieldLabel>
              <Input
                id="client-email"
                type="email"
                placeholder="john@acme.com"
                disabled={isPending}
                {...register("contactEmail")}
              />
              {errors.contactEmail && (
                <FieldError>{errors.contactEmail.message}</FieldError>
              )}
            </Field>
          </div>

          <Field data-invalid={!!errors.contactPhone || undefined}>
            <FieldLabel htmlFor="client-phone">Contact Phone</FieldLabel>
            <Input
              id="client-phone"
              type="tel"
              placeholder="+1 (555) 012-3456"
              disabled={isPending}
              {...register("contactPhone")}
            />
            {errors.contactPhone && (
              <FieldError>{errors.contactPhone.message}</FieldError>
            )}
          </Field>

          <Field data-invalid={!!errors.notes || undefined}>
            <FieldLabel htmlFor="client-notes">Internal Notes</FieldLabel>
            <Textarea
              id="client-notes"
              placeholder="Add details about client communication, contract requirements, or SLA notes..."
              rows={3}
              disabled={isPending}
              {...register("notes")}
            />
            {errors.notes && <FieldError>{errors.notes.message}</FieldError>}
          </Field>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
