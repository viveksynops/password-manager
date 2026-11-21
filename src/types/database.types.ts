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
        Update: never; // Append-only! No updates allowed.
      };
    };
    Views: Record<string, never>;
    Functions: {
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
