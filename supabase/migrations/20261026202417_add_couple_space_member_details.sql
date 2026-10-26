CREATE FUNCTION public.get_current_couple_space_members()
RETURNS TABLE(
    user_id UUID,
    display_name TEXT,
    role TEXT,
    joined_at TIMESTAMPTZ)
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_couple_space_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication is required.';
    END IF;

    SELECT membership.couple_space_id
    INTO current_couple_space_id
    FROM public.couple_space_memberships as membership
    WHERE membership.user_id = auth.uid();

    IF current_couple_space_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        membership.user_id,
        profile.display_name,
        membership.role,
        membership.joined_at
    FROM public.couple_space_memberships AS membership
    INNER JOIN public.profiles AS profile
        ON profile.id = membership.user_id
    WHERE membership.couple_space_id = current_couple_space_id
    ORDER BY
        CASE WHEN membership.role = 'owner' THEN 0 ELSE 1 END,
        membership.joined_at;
    
END;
$$;

REVOKE EXECUTE
ON FUNCTION public.get_current_couple_space_members()
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION public.get_current_couple_space_members()
TO authenticated;