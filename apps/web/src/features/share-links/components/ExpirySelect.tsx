"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExpiryPreset, EXPIRY_PRESET_OPTIONS } from "@/lib/share/expiry";

interface ExpirySelectProps {
  value: ExpiryPreset;
  onValueChange: (val: ExpiryPreset) => void;
  disabled?: boolean;
}

export function ExpirySelect({ value, onValueChange, disabled }: ExpirySelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as ExpiryPreset)} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select expiration preset" />
      </SelectTrigger>
      <SelectContent>
        {EXPIRY_PRESET_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
