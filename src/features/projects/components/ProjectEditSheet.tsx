"use client";

import React, { useEffect, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Loader2, FolderKanban } from "lucide-react";
import { projectSchema, CreateProjectInput } from "../schemas";
import { updateProjectAction } from "@/actions/project.actions";
import { Project, Client } from "@/types/database.types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProjectEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  clients: Pick<Client, "id" | "name">[];
}

export function ProjectEditSheet({
  open,
  onOpenChange,
  project,
  clients,
}: ProjectEditSheetProps) {
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
      clientId: "",
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
    }
  }, [project, reset, open]);

  const onSubmit = (data: CreateProjectInput) => {
    if (!project) return;

    startTransition(async () => {
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
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full inset-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:!max-w-lg data-[side=right]:w-full data-[side=right]:max-w-full data-[side=right]:sm:max-w-lg flex flex-col justify-between overflow-y-auto p-4 sm:p-6"
      >
        <div>
          <SheetHeader className="p-0 pb-6 border-b">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FolderKanban className="size-5" />
              </div>
              <SheetTitle className="text-xl">Edit Project</SheetTitle>
            </div>
            <SheetDescription>
              Update project configurations, URLs, or hosting information for this workspace.
            </SheetDescription>
          </SheetHeader>

          <form id="project-edit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4.5 py-6">
            {/* Client Organization */}
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
                {...register("name")}
              />
              {errors.name && <FieldError>{errors.name.message}</FieldError>}
            </Field>

            {/* URLs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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

            {/* Description / Notes */}
            <Field>
              <FieldLabel htmlFor="description">Description / Notes</FieldLabel>
              <Textarea
                id="description"
                rows={3}
                placeholder="Brief summary of the project architecture or scope..."
                disabled={isPending}
                {...register("description")}
              />
              {errors.description && <FieldError>{errors.description.message}</FieldError>}
            </Field>
          </form>
        </div>

        <SheetFooter className="p-0 pt-4 border-t flex flex-row items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="project-edit-form" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
