CREATE FUNCTION public.get_current_couple_space_invitation()
RETURNS TABLE (
    invitation_id UUID,
    token UUID,
    status TEXT,
    expires_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
)
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
    FROM public.couple_space_memberships AS membership
    WHERE membership.user_id = auth.uid()
      AND membership.role = 'owner';

    IF current_couple_space_id IS NULL THEN
        RAISE EXCEPTION 'Only the couple space owner can view invitations.';
    END IF;

    RETURN QUERY
    SELECT
        invitation.id,
        invitation.token,
        CASE
            WHEN invitation.accepted_at IS NOT NULL THEN 'accepted'
            WHEN invitation.expires_at <= NOW() THEN 'expired'
            ELSE 'pending'
        END AS status,
        invitation.expires_at,
        invitation.accepted_at,
        invitation.created_at
    FROM public.couple_space_invitations AS invitation
    WHERE invitation.couple_space_id = current_couple_space_id
    ORDER BY
        invitation.created_at DESC,
        invitation.id DESC
    LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_couple_space_invitation()
RETURNS UUID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    current_couple_space_id UUID;
    invitation_token UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication is required.';
    END IF;

    SELECT membership.couple_space_id
    INTO current_couple_space_id
    FROM public.couple_space_memberships AS membership
    WHERE membership.user_id = auth.uid()
      AND membership.role = 'owner';

    IF current_couple_space_id IS NULL THEN
        RAISE EXCEPTION 'Only the owner can create an invitation.';
    END IF;

    PERFORM 1
    FROM public.couple_spaces
    WHERE id = current_couple_space_id
    FOR UPDATE;

    IF (
        SELECT COUNT(*)
        FROM public.couple_space_memberships AS membership
        WHERE membership.couple_space_id = current_couple_space_id
    ) >= 2 THEN
        RAISE EXCEPTION 'This couple space already has two members.';
    END IF;

    SELECT invitation.token
    INTO invitation_token
    FROM public.couple_space_invitations AS invitation
    WHERE invitation.couple_space_id = current_couple_space_id
      AND invitation.accepted_at IS NULL
      AND invitation.expires_at > NOW()
    ORDER BY
        invitation.created_at DESC,
        invitation.id DESC
    LIMIT 1;

    IF invitation_token IS NOT NULL THEN
        RETURN invitation_token;
    END IF;

    INSERT INTO public.couple_space_invitations (
        couple_space_id,
        created_by,
        expires_at
    )
    VALUES (
        current_couple_space_id,
        auth.uid(),
        NOW() + INTERVAL '7 days'
    )
    RETURNING token INTO invitation_token;

    RETURN invitation_token;
END;
$$;

REVOKE EXECUTE
ON FUNCTION public.get_current_couple_space_invitation()
FROM PUBLIC;

GRANT EXECUTE
ON FUNCTION public.get_current_couple_space_invitation()
TO authenticated;