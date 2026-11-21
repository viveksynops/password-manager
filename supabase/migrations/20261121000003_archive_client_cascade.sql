-- Atomic transaction to archive or restore a client and cascade to all of its projects
CREATE OR REPLACE FUNCTION public.archive_client_cascade(
    p_client_id uuid,
    p_is_archived boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_client record;
    v_updated_projects_count integer := 0;
BEGIN
    -- 1. Update the client
    UPDATE public.clients
    SET is_archived = p_is_archived,
        updated_at = now()
    WHERE id = p_client_id
    RETURNING * INTO v_client;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Client not found';
    END IF;

    -- 2. Atomically cascade archive/restore to all projects belonging to this client
    UPDATE public.projects
    SET is_archived = p_is_archived,
        updated_at = now()
    WHERE client_id = p_client_id;

    GET DIAGNOSTICS v_updated_projects_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'client', to_jsonb(v_client),
        'projects_updated', v_updated_projects_count
    );
END;
$$;
