"use client";

import React, { useEffect, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FolderPlus } from "lucide-react";
import { projectSchema, CreateProjectInput } from "../schemas";
import { createProjectAction } from "@/actions/project.actions";
import { Client } from "@/types/database.types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Pick<Client, "id" | "name">[];
  defaultClientId?: string;
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  clients,
  defaultClientId,
}: ProjectFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      clientId: defaultClientId || "",
      name: "",
      description: "",
      liveUrl: "",
      repoUrl: "",
      hostingInfo: "",
      techStack: "",
      memberIds: [],
    },
  });

  const selectedClientId = watch("clientId");
  const selectedClient = clients.find((c) => c.id === selectedClientId);

  useEffect(() => {
    reset({
      clientId: defaultClientId || (clients[0]?.id ?? ""),
      name: "",
      description: "",
      liveUrl: "",
      repoUrl: "",
      hostingInfo: "",
      techStack: "",
      memberIds: [],
    });
  }, [reset, open, defaultClientId, clients]);

  const onSubmit = (data: CreateProjectInput) => {
    startTransition(async () => {
      const res = await createProjectAction({
        clientId: data.clientId,
        name: data.name,
        description: "",
        liveUrl: "",
        repoUrl: "",
        hostingInfo: "",
        techStack: "",
      });

      if (res.success) {
        toast.success(`Project "${res.data.name}" created successfully.`);
        onOpenChange(false);
        reset();
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderPlus className="size-4.5" />
            </div>
            <DialogTitle>Add New Project</DialogTitle>
          </div>
          <DialogDescription>
            Create a new project folder under a client organization to store credentials and environment variables.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Client Organization Selector */}
          <Field>
            <FieldLabel htmlFor="clientId">Client Organization *</FieldLabel>
            <Controller
              control={control}
              name="clientId"
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                  disabled={isPending || clients.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a client organization...">
                      {selectedClient?.name || "Select a client organization..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.clientId && <FieldError>{errors.clientId.message}</FieldError>}
          </Field>

          {/* Project Name */}
          <Field>
            <FieldLabel htmlFor="name">Project Name *</FieldLabel>
            <Input
              id="name"
              placeholder="e.g. Ecommerce Web App"
              disabled={isPending}
              autoFocus
              {...register("name")}
            />
            {errors.name && <FieldError>{errors.name.message}</FieldError>}
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
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
