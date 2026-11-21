import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  type: "project" | "client" | "credential" | "navigation";
  href: string;
  badge?: string;
  projectId?: string;
}

export interface GlobalSearchResults {
  projects: SearchResultItem[];
  clients: SearchResultItem[];
  credentials: SearchResultItem[];
  navigation: SearchResultItem[];
}

/**
 * Searches across accessible clients, projects, credentials, and app navigation.
 * Security Invariant (TASK-113): Developers see ONLY results from projects assigned to them.
 * Admins and Managers see all matching records.
 */
export async function globalSearch(rawQuery: string): Promise<GlobalSearchResults> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const query = rawQuery.trim();
  const lowerQuery = query.toLowerCase();

  const emptyResults: GlobalSearchResults = {
    projects: [],
    clients: [],
    credentials: [],
    navigation: [],
  };

  if (!query) {
    return emptyResults;
  }

  const supabase = await createClient();
  const isDev = user.role === "developer";

  // 1. Static navigation shortcuts based on user role
  const allNavItems: SearchResultItem[] = [
    {
      id: "nav-projects",
      title: "Projects",
      subtitle: "Browse and manage client projects",
      type: "navigation",
      href: "/projects",
      badge: "Go to",
    },
    {
      id: "nav-clients",
      title: "Clients",
      subtitle: "Browse client accounts and contact information",
      type: "navigation",
      href: "/clients",
      badge: "Go to",
    },
    ...(user.role === "admin"
      ? [
          {
            id: "nav-team",
            title: "Team Management",
            subtitle: "Manage members, invites, and administrative roles",
            type: "navigation" as const,
            href: "/team",
            badge: "Admin",
          },
          {
            id: "nav-audit",
            title: "Audit Logs",
            subtitle: "Review tamper-proof immutable audit activity",
            type: "navigation" as const,
            href: "/audit-logs",
            badge: "Admin",
          },
        ]
      : []),
  ];

  const matchingNav = allNavItems.filter(
    (item) =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.subtitle.toLowerCase().includes(lowerQuery)
  );

  // 2. Fetch assigned project IDs if user is developer
  let assignedProjectIds: string[] = [];
  if (isDev) {
    const { data: memberRows } = await supabase
      .from("project_members")
      .select("project_id")
      .eq("user_id", user.id);

    assignedProjectIds = (memberRows || []).map((m: any) => m.project_id);
    if (assignedProjectIds.length === 0) {
      return {
        ...emptyResults,
        navigation: matchingNav,
      };
    }
  }

  // 3. Query Projects
  let projectsQuery = supabase
    .from("projects")
    .select("id, name, tech_stack, hosting_info, is_archived, clients(id, name)")
    .limit(8);

  if (isDev) {
    projectsQuery = projectsQuery.in("id", assignedProjectIds);
  }

  projectsQuery = projectsQuery.or(
    `name.ilike.%${query}%,tech_stack.ilike.%${query}%,hosting_info.ilike.%${query}%`
  );

  // 4. Query Credentials
  let credsQuery = supabase
    .from("credentials")
    .select("id, project_id, service_name, username, login_url, projects(id, name)")
    .limit(8);

  if (isDev) {
    credsQuery = credsQuery.in("project_id", assignedProjectIds);
  }

  credsQuery = credsQuery.or(
    `service_name.ilike.%${query}%,username.ilike.%${query}%`
  );

  // 5. Query Clients
  let clientsQuery = supabase
    .from("clients")
    .select("id, name, contact_person, contact_email, is_archived")
    .limit(8);

  if (isDev) {
    // Developers only see clients for their assigned projects
    const { data: assignedProjects } = await supabase
      .from("projects")
      .select("client_id")
      .in("id", assignedProjectIds);

    const clientIds = Array.from(
      new Set((assignedProjects || []).map((p: any) => p.client_id).filter(Boolean))
    );

    if (clientIds.length > 0) {
      clientsQuery = clientsQuery.in("id", clientIds);
    } else {
      clientsQuery = clientsQuery.in("id", ["00000000-0000-0000-0000-000000000000"]);
    }
  }

  clientsQuery = clientsQuery.or(
    `name.ilike.%${query}%,contact_person.ilike.%${query}%,contact_email.ilike.%${query}%`
  );

  const [
    { data: projectRows },
    { data: credRows },
    { data: clientRows },
  ] = await Promise.all([projectsQuery, credsQuery, clientsQuery]);

  const projects: SearchResultItem[] = (projectRows || []).map((p: any) => ({
    id: p.id,
    title: p.name,
    subtitle: p.clients?.name ? `Client: ${p.clients.name}` : (p.tech_stack || "Project"),
    type: "project",
    href: `/projects/${p.id}`,
    badge: p.is_archived ? "Archived" : "Project",
    projectId: p.id,
  }));

  const credentials: SearchResultItem[] = (credRows || []).map((c: any) => ({
    id: c.id,
    title: c.service_name,
    subtitle: `${c.username}${c.projects?.name ? ` (${c.projects.name})` : ""}`,
    type: "credential",
    href: `/projects/${c.project_id}?tab=credentials`,
    badge: "Credential",
    projectId: c.project_id,
  }));

  const clients: SearchResultItem[] = (clientRows || []).map((cl: any) => ({
    id: cl.id,
    title: cl.name,
    subtitle: cl.contact_email || cl.contact_person || "Client Organization",
    type: "client",
    href: `/clients/${cl.id}`,
    badge: cl.is_archived ? "Archived" : "Client",
  }));

  return {
    projects,
    clients,
    credentials,
    navigation: matchingNav,
  };
}
