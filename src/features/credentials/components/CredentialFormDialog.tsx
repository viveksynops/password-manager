"use client";

import React, { useEffect, useTransition, useState } from "react";
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
import { Loader2, Wand2, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import {
  createCredentialAction,
  updateCredentialAction,
} from "@/actions/credential.actions";
import { CredentialSummary } from "@/services/credential.service";
import { generatePassword } from "@/utils/password-generator";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  serviceName: z
    .string()
    .trim()
    .min(2, "Service name must be at least 2 characters")
    .max(100, "Service name cannot exceed 100 characters"),
  loginUrl: z
    .string()
    .trim()
    .url("Must be a valid URL (e.g. https://auth.service.com)")
    .optional()
    .or(z.literal("")),
  username: z
    .string()
    .trim()
    .min(1, "Username or email is required")
    .max(255, "Username cannot exceed 255 characters"),
  password: z
    .string()
    .max(255, "Password cannot exceed 255 characters")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(1000, "Notes cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
});

type CredentialFormData = z.infer<typeof formSchema>;

interface CredentialFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  credential?: CredentialSummary | null;
}

export function CredentialFormDialog({
  open,
  onOpenChange,
  projectId,
  credential,
}: CredentialFormDialogProps) {
  const isEditing = !!credential;
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CredentialFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId,
      serviceName: "",
      loginUrl: "",
      username: "",
      password: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (credential) {
      reset({
        projectId,
        serviceName: credential.service_name,
        loginUrl: credential.login_url || "",
        username: credential.username,
        password: "", // empty means leave unchanged when editing
        notes: credential.notes || "",
      });
      setShowPassword(false);
    } else {
      reset({
        projectId,
        serviceName: "",
        loginUrl: "",
        username: "",
        password: "",
        notes: "",
      });
      setShowPassword(false);
    }
  }, [credential, projectId, reset, open]);

  const handleGeneratePassword = () => {
    const generated = generatePassword({ length: 20 });
    setValue("password", generated, { shouldValidate: true });
    setShowPassword(true);
    toast.success("Generated strong 20-character password.");
  };

  const onSubmit = (data: CredentialFormData) => {
    if (!isEditing && (!data.password || data.password.trim().length === 0)) {
      toast.error("Password is required for new credentials.");
      return;
    }

    startTransition(async () => {
      if (isEditing && credential) {
        const res = await updateCredentialAction({
          id: credential.id,
          projectId,
          serviceName: data.serviceName,
          loginUrl: data.loginUrl || "",
          username: data.username,
          password: data.password || undefined,
          notes: data.notes || "",
        });

        if (res.success) {
          toast.success(`Credential "${res.data.service_name}" updated.`);
          onOpenChange(false);
          router.refresh();
        } else {
          toast.error(res.error);
        }
      } else {
        const res = await createCredentialAction({
          projectId,
          serviceName: data.serviceName,
          loginUrl: data.loginUrl || "",
          username: data.username,
          password: data.password!,
          notes: data.notes || "",
        });

        if (res.success) {
          toast.success(`Credential "${res.data.service_name}" saved securely.`);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Credential" : "Add Service Credential"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update login credentials or service notes. Passwords remain AES-256-GCM encrypted."
              : "Store an encrypted service login (Supabase, AWS, Cloudinary, etc.) in this project vault."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Service Name */}
          <Field>
            <FieldLabel htmlFor="serviceName">Service Name *</FieldLabel>
            <Input
              id="serviceName"
              placeholder="e.g. Cloudinary Production / Supabase"
              disabled={isPending}
              autoFocus
              {...register("serviceName")}
            />
            {errors.serviceName && <FieldError>{errors.serviceName.message}</FieldError>}
          </Field>

          {/* Login URL */}
          <Field>
            <FieldLabel htmlFor="loginUrl">Login URL (Optional)</FieldLabel>
            <Input
              id="loginUrl"
              type="url"
              placeholder="https://cloudinary.com/login"
              disabled={isPending}
              {...register("loginUrl")}
            />
            {errors.loginUrl && <FieldError>{errors.loginUrl.message}</FieldError>}
          </Field>

          {/* Username / Email */}
          <Field>
            <FieldLabel htmlFor="username">Username / Email *</FieldLabel>
            <Input
              id="username"
              placeholder="admin@example.com or username"
              disabled={isPending}
              {...register("username")}
            />
            {errors.username && <FieldError>{errors.username.message}</FieldError>}
          </Field>

          {/* Password with Generator */}
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">
                {isEditing ? "Password (Leave empty to keep current)" : "Password *"}
              </FieldLabel>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-xs text-primary hover:text-primary"
                onClick={handleGeneratePassword}
              >
                <Wand2 className="mr-1 size-3" />
                Generate
              </Button>
            </div>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={isEditing ? "••••••••••••" : "Enter or generate strong password"}
                className="pr-10 font-mono text-sm"
                disabled={isPending}
                {...register("password")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 size-7 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password input" : "Show password input"}
              >
                {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </Button>
            </div>
            {errors.password && <FieldError>{errors.password.message}</FieldError>}
          </Field>

          {/* Notes */}
          <Field>
            <FieldLabel htmlFor="notes">Internal Notes (Optional)</FieldLabel>
            <Textarea
              id="notes"
              rows={2}
              placeholder="MFA recovery codes, account tier, billing info..."
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
              {isEditing ? "Save Changes" : "Save Credential"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
