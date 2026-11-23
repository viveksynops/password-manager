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
import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Loader2, Wand2, Eye, EyeOff, Plus, Trash2, Tag, Key, Database, Shield } from "lucide-react";
import { z } from "zod";
import {
  createCredentialAction,
  updateCredentialAction,
} from "@/actions/credential.actions";
import { CredentialSummary } from "@/services/credential.service";
import { generatePassword } from "@/utils/password-generator";
import { CredentialCustomField } from "@/features/credentials/schemas";
import { parseNotesWithMetadata } from "@/utils/credential-fields";
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
  const [customFields, setCustomFields] = useState<CredentialCustomField[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
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
      const parsed = parseNotesWithMetadata(credential.notes);
      setCustomFields(parsed.customFields);
      setTags(parsed.tags);
      reset({
        projectId,
        serviceName: credential.service_name,
        loginUrl: credential.login_url || "",
        username: credential.username,
        password: "", // empty means leave unchanged when editing
        notes: parsed.notes,
      });
      setShowPassword(false);
    } else {
      setCustomFields([]);
      setTags([]);
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
    setTagInput("");
  }, [credential, projectId, reset, open]);

  const handleGeneratePassword = () => {
    const generated = generatePassword({ length: 20 });
    setValue("password", generated, { shouldValidate: true });
    setShowPassword(true);
    toast.success("Generated strong 20-character password.");
  };

  const handleAddCustomField = (templateName = "") => {
    const newField: CredentialCustomField = {
      id: crypto.randomUUID(),
      label: templateName || "",
      value: "",
      isSecret: true,
    };
    setCustomFields((prev) => [...prev, newField]);
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpdateCustomField = (
    id: string,
    key: "label" | "value" | "isSecret",
    val: any
  ) => {
    setCustomFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [key]: val } : f))
    );
  };

  const handleAddTag = (e?: React.KeyboardEvent) => {
    if (e && e.key !== "Enter" && e.key !== ",") return;
    if (e) e.preventDefault();
    const cleanTag = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags((prev) => [...prev, cleanTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
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
          customFields,
          tags,
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
          customFields,
          tags,
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Credential" : "Add Service Credential"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update login credentials, API keys, or custom fields. Passwords remain AES-256-GCM encrypted."
              : "Store an encrypted service login (Supabase, AWS, Cloudinary, etc.) with custom fields."}
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

          {/* Tags (TASK-111) */}
          <Field>
            <FieldLabel htmlFor="tags">Tags</FieldLabel>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Add tag (e.g. aws, prod, database) and press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  disabled={isPending}
                  className="text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddTag()}
                  disabled={!tagInput.trim() || isPending}
                  className="text-xs shrink-0"
                >
                  <Plus className="size-3 mr-1" />
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="text-xs py-0.5 px-2 flex items-center gap-1 cursor-pointer hover:bg-destructive/20"
                      onClick={() => handleRemoveTag(t)}
                      title="Click to remove tag"
                    >
                      <Tag className="size-3 text-muted-foreground" />
                      #{t}
                      <span className="text-muted-foreground ml-0.5">×</span>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Field>

          {/* Custom Fields (TASK-112: API Key, License Key, Database URL) */}
          <div className="space-y-2.5 rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-foreground block">Custom Fields</span>
                <span className="text-[11px] text-muted-foreground">
                  Store API keys, license tokens, database URLs, and ports
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleAddCustomField()}
                disabled={isPending}
              >
                <Plus className="size-3 mr-1" />
                Add Field
              </Button>
            </div>

            {/* Quick Templates Shortcuts */}
            {customFields.length === 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[11px] text-muted-foreground self-center mr-1">Quick add:</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px] px-2 border border-border/50 text-muted-foreground hover:text-foreground"
                  onClick={() => handleAddCustomField("API Key")}
                >
                  + API Key
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px] px-2 border border-border/50 text-muted-foreground hover:text-foreground"
                  onClick={() => handleAddCustomField("Database URL")}
                >
                  + Database URL
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px] px-2 border border-border/50 text-muted-foreground hover:text-foreground"
                  onClick={() => handleAddCustomField("License Key")}
                >
                  + License Key
                </Button>
              </div>
            )}

            {/* Custom Field Rows */}
            {customFields.map((field) => (
              <div key={field.id} className="flex items-center gap-2 pt-1">
                <Input
                  placeholder="Field Name (e.g. API Key)"
                  value={field.label}
                  onChange={(e) => handleUpdateCustomField(field.id, "label", e.target.value)}
                  className="w-1/3 text-xs h-8"
                  disabled={isPending}
                />
                <Input
                  placeholder="Field Value"
                  value={field.value}
                  onChange={(e) => handleUpdateCustomField(field.id, "value", e.target.value)}
                  className="flex-1 font-mono text-xs h-8"
                  disabled={isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleRemoveCustomField(field.id)}
                  aria-label="Remove field"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>

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
