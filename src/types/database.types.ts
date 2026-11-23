export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "admin" | "manager" | "developer";
export type UserStatus = "active" | "deactivated" | "invited";
export type Environment = "development" | "staging" | "production";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: UserRole;
          status: UserStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: UserRole;
          status?: UserStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: UserRole;
          status?: UserStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          name: string;
          contact_person: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          notes: string | null;
          is_archived: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_person?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          notes?: string | null;
          is_archived?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          contact_person?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          notes?: string | null;
          is_archived?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          description: string | null;
          live_url: string | null;
          repo_url: string | null;
          hosting_info: string | null;
          tech_stack: string | null;
          is_archived: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          description?: string | null;
          live_url?: string | null;
          repo_url?: string | null;
          hosting_info?: string | null;
          tech_stack?: string | null;
          is_archived?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          name?: string;
          description?: string | null;
          live_url?: string | null;
          repo_url?: string | null;
          hosting_info?: string | null;
          tech_stack?: string | null;
          is_archived?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      credentials: {
        Row: {
          id: string;
          project_id: string;
          service_name: string;
          login_url: string | null;
          username: string;
          encrypted_password: string;
          iv: string;
          tag: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          service_name: string;
          login_url?: string | null;
          username: string;
          encrypted_password: string;
          iv: string;
          tag: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          service_name?: string;
          login_url?: string | null;
          username?: string;
          encrypted_password?: string;
          iv?: string;
          tag?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      env_variables: {
        Row: {
          id: string;
          project_id: string;
          environment: Environment;
          key: string;
          encrypted_value: string;
          iv: string;
          tag: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          environment: Environment;
          key: string;
          encrypted_value: string;
          iv: string;
          tag: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          environment?: Environment;
          key?: string;
          encrypted_value?: string;
          iv?: string;
          tag?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          target_type: string;
          target_id: string | null;
          project_id: string | null;
          ip_address: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          target_type: string;
          target_id?: string | null;
          project_id?: string | null;
          ip_address?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          target_type?: string;
          target_id?: string | null;
          project_id?: string | null;
          ip_address?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      share_links: {
        Row: {
          id: string;
          project_id: string;
          created_by: string;
          label: string;
          token_hash: string;
          pin_hash: string;
          pin_salt: string;
          expires_at: string | null;
          never_expires: boolean;
          max_views: number | null;
          view_count: number;
          status: "active" | "revoked";
          revoked_at: string | null;
          revoked_by: string | null;
          failed_attempts: number;
          locked_until: string | null;
          session_version: number;
          last_accessed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          created_by: string;
          label: string;
          token_hash: string;
          pin_hash: string;
          pin_salt: string;
          expires_at?: string | null;
          never_expires?: boolean;
          max_views?: number | null;
          view_count?: number;
          status?: "active" | "revoked";
          revoked_at?: string | null;
          revoked_by?: string | null;
          failed_attempts?: number;
          locked_until?: string | null;
          session_version?: number;
          last_accessed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          created_by?: string;
          label?: string;
          token_hash?: string;
          pin_hash?: string;
          pin_salt?: string;
          expires_at?: string | null;
          never_expires?: boolean;
          max_views?: number | null;
          view_count?: number;
          status?: "active" | "revoked";
          revoked_at?: string | null;
          revoked_by?: string | null;
          failed_attempts?: number;
          locked_until?: string | null;
          session_version?: number;
          last_accessed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      share_link_items: {
        Row: {
          id: string;
          share_link_id: string;
          item_type: "credential" | "env_variable";
          item_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          share_link_id: string;
          item_type: "credential" | "env_variable";
          item_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          share_link_id?: string;
          item_type?: "credential" | "env_variable";
          item_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      share_link_attempts: {
        Row: {
          id: string;
          share_link_id: string;
          ip_address: string | null;
          success: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          share_link_id: string;
          ip_address?: string | null;
          success: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          share_link_id?: string;
          ip_address?: string | null;
          success?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      archive_client_cascade: {
        Args: { p_client_id: string; p_is_archived: boolean };
        Returns: Json;
      };
      get_current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_manager_or_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_active_user: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      has_project_access: {
        Args: { target_project_id: string };
        Returns: boolean;
      };
      has_client_access: {
        Args: { target_client_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      user_status: UserStatus;
      environment: Environment;
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserProfile = Profile;
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectMember = Database["public"]["Tables"]["project_members"]["Row"];
export type Credential = Database["public"]["Tables"]["credentials"]["Row"];
export type EnvVariable = Database["public"]["Tables"]["env_variables"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
export type ShareLink = Database["public"]["Tables"]["share_links"]["Row"];
export type ShareLinkItem = Database["public"]["Tables"]["share_link_items"]["Row"];
export type ShareLinkAttempt = Database["public"]["Tables"]["share_link_attempts"]["Row"];
