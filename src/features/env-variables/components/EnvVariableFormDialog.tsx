"use client";

import React, { useEffect, useState, useTransition } from "react";
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
import { Eye, EyeOff, Loader2, Sparkles, Variable } from "lucide-react";
import { generatePassword } from "@/utils/password-generator";
import {
  createEnvVariableAction,
  updateEnvVariableAction,
} from "@/actions/env.actions";
import { EnvVariableSummary } from "@/services/env.service";
import { Environment } from "@/types/database.types";
import { envKeyRegex } from "../schemas";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { z } from "zod";

const formSchema = z.object({
  environment: z.enum(["development", "staging", "production"]),
  key: z
    .string()
    .trim()
    .min(1, "Variable key is required")
    .max(256, "Key must be at most 256 characters")
    .regex(
      envKeyRegex,
      "Key must contain only letters, numbers, and underscores (e.g. DATABASE_URL)"
    ),
  value: z.string().max(100000, "Value cannot exceed 100,000 characters").optional(),
});

type FormInput = z.infer<typeof formSchema>;

interface EnvVariableFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  defaultEnvironment: Environment;
  initialData?: EnvVariableSummary | null;
}

export function EnvVariableFormDialog({
  open,
  onOpenChange,
  projectId,
  defaultEnvironment,
  initialData,
}: EnvVariableFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [showValue, setShowValue] = useState(false);
  const router = useRouter();
  const isEditing = Boolean(initialData);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      environment: defaultEnvironment,
      key: "",
      value: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          environment: initialData.environment,
          key: initialData.key,
          value: "", // Leave blank to keep existing encrypted value
        });
      } else {
        reset({
          environment: defaultEnvironment,
          key: "",
          value: "",
        });
      }
      setShowValue(false);
    }
  }, [open, initialData, defaultEnvironment, reset]);

  const handleGenerateSecret = () => {
    const secret = generatePassword({
      length: 32,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
    });
    setValue("value", secret, { shouldValidate: true });
    setShowValue(true);
    toast.success("Generated 32-character high-entropy secret key.");
  };

  const onSubmit = (data: FormInput) => {
    if (!isEditing && !data.value) {
      setError("value", {
        type: "manual",
        message: "Variable value is required when creating a new variable",
      });
      return;
    }

    startTransition(async () => {
      if (isEditing && initialData) {
        const res = await updateEnvVariableAction({
          id: initialData.id,
          projectId,
          environment: data.environment,
          key: data.key,
          value: data.value ? data.value : undefined,
        });

        if (res.success) {
          toast.success(`Variable "${data.key}" updated.`);
          onOpenChange(false);
          router.refresh();
        } else {
          toast.error(res.error);
        }
      } else {
        const res = await createEnvVariableAction({
          projectId,
          environment: data.environment,
          key: data.key,
          value: data.value || "",
        });

        if (res.success) {
          toast.success(`Variable "${data.key}" added to ${data.environment}.`);
          onOpenChange(false);
          router.refresh();
        } else {
          toast.error(res.error);
        }
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Variable className="size-4" />
            </div>
            <DialogTitle>
              {isEditing ? "Edit Environment Variable" : "Add Environment Variable"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isEditing
              ? "Update variable key or replace encrypted value. Leave value blank to keep current secret."
              : "Store an encrypted environment variable for this project."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Target Environment */}
          <Field>
            <FieldLabel htmlFor="environment">Target Environment *</FieldLabel>
            <Controller
              control={control}
              name="environment"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.environment && <FieldError>{errors.environment.message}</FieldError>}
          </Field>

          {/* Variable Key */}
          <Field>
            <FieldLabel htmlFor="key">Variable Key *</FieldLabel>
            <Input
              id="key"
              placeholder="e.g. DATABASE_URL or STRIPE_SECRET_KEY"
              className="font-mono uppercase text-xs"
              disabled={isPending}
              {...register("key", {
                onChange: (e) => {
                  e.target.value = e.target.value.toUpperCase();
                },
              })}
            />
            {errors.key && <FieldError>{errors.key.message}</FieldError>}
          </Field>

          {/* Variable Value */}
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="value">
                {isEditing ? "New Value (Optional)" : "Variable Value *"}
              </FieldLabel>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={handleGenerateSecret}
                  disabled={isPending}
                >
                  <Sparkles className="mr-1 size-3 text-amber-500" />
                  Generate
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowValue(!showValue)}
                  disabled={isPending}
                  aria-label={showValue ? "Hide value" : "Show value"}
                >
                  {showValue ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                </Button>
              </div>
            </div>

            <Textarea
              id="value"
              rows={3}
              placeholder={
                isEditing
                  ? "•••••••••••• (leave empty to keep current secret)"
                  : "e.g. postgresql://user:pass@host:5432/db"
              }
              className={`font-mono text-xs ${showValue ? "" : "[font-family:text-security-disc]"}`}
              disabled={isPending}
              {...register("value")}
            />
            {errors.value && <FieldError>{errors.value.message}</FieldError>}
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
              {isEditing ? "Save Changes" : "Add Variable"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
