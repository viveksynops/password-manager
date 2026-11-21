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
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { projectSchema, CreateProjectInput } from "../schemas";
import { createProjectAction, updateProjectAction } from "@/actions/project.actions";
import { Project, Client, UserProfile } from "@/types/database.types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  clients: Pick<Client, "id" | "name">[];
  users?: UserProfile[];
  defaultClientId?: string;
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  clients,
  defaultClientId,
}: ProjectFormDialogProps) {
  const isEditing = !!project;
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
    if (project) {
      reset({
        clientId: project.client_id,
        name: project.name,
        description: project.description || "",
        liveUrl: project.live_url || "",
        repoUrl: project.repo_url || "",
        hostingInfo: project.hosting_info || "",
        techStack: project.tech_stack || "",
        memberIds: [],
      });
    } else {
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
    }
  }, [project, reset, open, defaultClientId, clients]);

  const onSubmit = (data: CreateProjectInput) => {
    startTransition(async () => {
      if (isEditing && project) {
        const res = await updateProjectAction({
          id: project.id,
          clientId: data.clientId,
          name: data.name,
          description: data.description,
          liveUrl: data.liveUrl,
          repoUrl: data.repoUrl,
          hostingInfo: data.hostingInfo,
          techStack: data.techStack,
        });

        if (res.success) {
          toast.success(`Project "${res.data.name}" updated successfully.`);
          onOpenChange(false);
          router.refresh();
        } else {
          toast.error(res.error);
        }
      } else {
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
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isEditing ? "max-w-lg max-h-[90vh] overflow-y-auto" : "max-w-md"}>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Project" : "Add New Project"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update project configurations, URLs, or hosting information."
              : "Create a project folder under a client organization to store credentials and env variables."}
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

          {/* Additional details (Only when editing an existing project inside the folder) */}
          {isEditing && (
            <>
              {/* URLs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <Field>
                  <FieldLabel htmlFor="liveUrl">Live Website URL</FieldLabel>
                  <Input
                    id="liveUrl"
                    type="url"
                    placeholder="https://client-app.com"
                    disabled={isPending}
                    {...register("liveUrl")}
                  />
                  {errors.liveUrl && <FieldError>{errors.liveUrl.message}</FieldError>}
                </Field>

                <Field>
                  <FieldLabel htmlFor="repoUrl">Repository URL</FieldLabel>
                  <Input
                    id="repoUrl"
                    type="url"
                    placeholder="https://github.com/org/repo"
                    disabled={isPending}
                    {...register("repoUrl")}
                  />
                  {errors.repoUrl && <FieldError>{errors.repoUrl.message}</FieldError>}
                </Field>
              </div>

              {/* Hosting & Tech Stack Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="hostingInfo">Hosting Platform</FieldLabel>
                  <Input
                    id="hostingInfo"
                    placeholder="e.g. Vercel / AWS / DigitalOcean"
                    disabled={isPending}
                    {...register("hostingInfo")}
                  />
                  {errors.hostingInfo && <FieldError>{errors.hostingInfo.message}</FieldError>}
                </Field>

                <Field>
                  <FieldLabel htmlFor="techStack">Tech Stack</FieldLabel>
                  <Input
                    id="techStack"
                    placeholder="e.g. Next.js, Postgres, Redis"
                    disabled={isPending}
                    {...register("techStack")}
                  />
                  {errors.techStack && <FieldError>{errors.techStack.message}</FieldError>}
                </Field>
              </div>

              {/* Description */}
              <Field>
                <FieldLabel htmlFor="description">Description / Notes</FieldLabel>
                <Textarea
                  id="description"
                  rows={2}
                  placeholder="Brief summary of the project architecture or scope..."
                  disabled={isPending}
                  {...register("description")}
                />
                {errors.description && <FieldError>{errors.description.message}</FieldError>}
              </Field>
            </>
          )}

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
              {isEditing ? "Save Changes" : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
