"use client";

import React, { useMemo, useState } from "react";
import { EnvVariableSummary } from "@/services/env.service";
import { UserRole, Environment } from "@/types/database.types";
import { EnvSwitcher } from "./EnvSwitcher";
import { EnvVariablesTable } from "./EnvVariablesTable";
import { EnvVariableFormDialog } from "./EnvVariableFormDialog";
import { DeleteEnvConfirmDialog } from "./DeleteEnvConfirmDialog";
import { PasteEnvDialog } from "./PasteEnvDialog";
import { ExportEnvDialog } from "./ExportEnvDialog";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEnvStore } from "../store";
import { FileCode2, FileDown, FileUp, Plus, Search, Variable } from "lucide-react";

interface ProjectEnvTabProps {
  projectId: string;
  projectName: string;
  variables: EnvVariableSummary[];
  userRole: UserRole;
}

export function ProjectEnvTab({
  projectId,
  projectName,
  variables,
  userRole,
}: ProjectEnvTabProps) {
  const { activeEnvironment, searchQuery, setSearchQuery } = useEnvStore();

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingVariable, setEditingVariable] = useState<EnvVariableSummary | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingVariable, setDeletingVariable] = useState<EnvVariableSummary | null>(null);
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const canManage = userRole === "admin" || userRole === "manager";

  // Calculate counts per environment
  const counts = useMemo<Record<Environment, number>>(() => {
    return {
      development: variables.filter((v) => v.environment === "development").length,
      staging: variables.filter((v) => v.environment === "staging").length,
      production: variables.filter((v) => v.environment === "production").length,
    };
  }, [variables]);

  // Filter variables by active environment and search
  const filteredVariables = useMemo(() => {
    return variables.filter((v) => {
      const matchesEnv = v.environment === activeEnvironment;
      const matchesSearch =
        searchQuery.trim() === "" ||
        v.key.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesEnv && matchesSearch;
    });
  }, [variables, activeEnvironment, searchQuery]);

  const handleEdit = (v: EnvVariableSummary) => {
    setEditingVariable(v);
    setFormDialogOpen(true);
  };

  const handleDelete = (v: EnvVariableSummary) => {
    setDeletingVariable(v);
    setDeleteDialogOpen(true);
  };

  const handleAddClick = () => {
    setEditingVariable(null);
    setFormDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls: Switcher, Search, Import, Export, Add */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Environment Switcher Tabs */}
        <EnvSwitcher counts={counts} />

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-48 sm:flex-initial">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Filter keys..."
              className="h-9 pl-8 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Export .env */}
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            disabled={counts[activeEnvironment] === 0}
            onClick={() => setExportDialogOpen(true)}
            title="Export decrypted .env file"
          >
            <FileDown className="mr-1.5 size-3.5" />
            Export .env
          </Button>

          {/* Paste .env Bulk Import */}
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => setPasteDialogOpen(true)}
              title="Bulk import from .env file"
            >
              <FileUp className="mr-1.5 size-3.5" />
              Paste .env
            </Button>
          )}

          {/* Add Variable Button */}
          {canManage && (
            <Button size="sm" className="h-9" onClick={handleAddClick}>
              <Plus className="mr-1.5 size-4" />
              Add Variable
            </Button>
          )}
        </div>
      </div>

      {/* Main Table / Empty State */}
      {filteredVariables.length === 0 ? (
        counts[activeEnvironment] === 0 ? (
          <EmptyState
            icon={FileCode2}
            title={`No ${activeEnvironment} variables stored`}
            description={`Add API keys, tokens, or connection strings for the ${activeEnvironment} environment.`}
            action={
              canManage
                ? {
                    label: `Add ${activeEnvironment.charAt(0).toUpperCase() + activeEnvironment.slice(1)} Variable`,
                    onClick: handleAddClick,
                  }
                : undefined
            }
          />
        ) : (
          <EmptyState
            icon={Search}
            title="No matching variables"
            description={`No variables in ${activeEnvironment} match "${searchQuery}".`}
            action={{
              label: "Clear Search",
              onClick: () => setSearchQuery(""),
            }}
          />
        )
      ) : (
        <EnvVariablesTable
          variables={filteredVariables}
          projectId={projectId}
          userRole={userRole}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Add / Edit Dialog */}
      <EnvVariableFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        projectId={projectId}
        defaultEnvironment={activeEnvironment}
        initialData={editingVariable}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteEnvConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        variable={deletingVariable}
        projectId={projectId}
      />

      {/* Paste .env Dialog */}
      <PasteEnvDialog
        open={pasteDialogOpen}
        onOpenChange={setPasteDialogOpen}
        projectId={projectId}
        defaultEnvironment={activeEnvironment}
      />

      {/* Export .env Dialog */}
      <ExportEnvDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        projectId={projectId}
        projectName={projectName}
        environment={activeEnvironment}
      />
    </div>
  );
}
