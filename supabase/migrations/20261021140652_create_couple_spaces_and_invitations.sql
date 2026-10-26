CREATE TABLE public.couple_spaces(
    id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    name TEXT NOT NULL CHECK(CHAR_LENGTH(TRIM(name)) BETWEEN 2 AND 80),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_couple_spaces_updated_at
BEFORE UPDATE ON public.couple_spaces
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.couple_space_memberships(
    couple_space_id UUID NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (couple_space_id,user_id), 
    UNIQUE(user_id)
);

CREATE TABLE public.couple_space_invitations(
    id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    couple_space_id UUID NOT NULL REFERENCES public.couple_spaces(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token UUID NOT NULL UNIQUE DEFAULT GEN_RANDOM_UUID(),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK(expires_at > created_at)
);

CREATE FUNCTION public.create_couple_space(p_name TEXT)
RETURNS UUID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    new_couple_space_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication is required.';
    END IF;
    IF p_name IS NULL OR CHAR_LENGTH(TRIM(p_name)) NOT BETWEEN 2 AND 80 THEN
        RAISE EXCEPTION 'Invalid couple space name';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM public.couple_space_memberships
        WHERE user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'User already belongs to a couple space.';
    END IF;

    INSERT INTO public.couple_spaces (name,created_by)
    VALUES (TRIM(p_name), auth.uid())
    RETURNING id INTO new_couple_space_id;

    INSERT INTO public.couple_space_memberships (couple_space_id,user_id,role) 
    VALUES (new_couple_space_id,auth.uid(),'owner');

    RETURN new_couple_space_id;
END;
$$;

CREATE FUNCTION public.create_couple_space_invitation()
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

    SELECT couple_space_id
    INTO current_couple_space_id
    FROM public.couple_space_memberships
    WHERE user_id = auth.uid()
    AND role = 'owner';

    IF current_couple_space_id IS NULL THEN
        RAISE EXCEPTION 'Only the owner can create an invitation.';
    END IF;

    IF (
        SELECT COUNT(*)
        FROM public.couple_space_memberships
        WHERE couple_space_id = current_couple_space_id
    ) >= 2 THEN
        RAISE EXCEPTION 'This couple space already has two members.';
    END IF;

    INSERT INTO public.couple_space_invitations(
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

CREATE FUNCTION public.accept_couple_space_invitation(p_token UUID)
RETURNS UUID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    invitation_couple_space_id UUID;
    invitation_creator_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication is required.';
    END IF;

    IF EXISTS(
        SELECT 1
        FROM public.couple_space_memberships
        WHERE user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'You already belong to a couple space.';
    END IF;

    IF p_token IS NULL THEN
        RAISE EXCEPTION 'Invitation is invalid or has expired.';
    END IF;

    SELECT
        invitation.couple_space_id,
        invitation.created_by
    INTO
        invitation_couple_space_id,
        invitation_creator_id
    FROM public.couple_space_invitations AS invitation
    WHERE invitation.token = p_token
    AND invitation.accepted_at IS NULL
    AND invitation.expires_at > NOW()
    FOR UPDATE;

    IF invitation_couple_space_id IS NULL THEN
        RAISE EXCEPTION 'Invitation is invalid or has expired.';
    END IF;

    IF invitation_creator_id = auth.uid() THEN
        RAISE EXCEPTION 'You cannot accept your own invitation.';
    END IF;

    PERFORM 1
    FROM public.couple_spaces
    WHERE id = invitation_couple_space_id
    FOR UPDATE;

    IF (
        SELECT COUNT(*)
        FROM public.couple_space_memberships
        WHERE couple_space_id = invitation_couple_space_id
    ) >= 2 THEN
        RAISE EXCEPTION 'This couple space already has two members.';
    END IF;

    INSERT INTO public.couple_space_memberships (
        couple_space_id,
        user_id,
        role
    )
    VALUES (
        invitation_couple_space_id,
        auth.uid(),
        'member'
    );

    UPDATE public.couple_space_invitations
    SET
        accepted_at = NOW(),
        accepted_by = auth.uid()
    WHERE token = p_token;

    RETURN invitation_couple_space_id;
END;
$$;

CREATE FUNCTION public.is_couple_space_member(p_couple_space_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.couple_space_memberships
        WHERE couple_space_id = p_couple_space_id
          AND user_id = auth.uid()
    );
$$;

CREATE FUNCTION public.is_couple_space_owner(p_couple_space_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.couple_space_memberships
        WHERE couple_space_id = p_couple_space_id
          AND user_id = auth.uid()
          AND role = 'owner'
    );
$$;

ALTER TABLE public.couple_spaces ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.couple_space_memberships ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.couple_space_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their couple space"
ON public.couple_spaces
FOR SELECT
TO authenticated
USING (public.is_couple_space_member(id));

CREATE POLICY "Members can view memberships in their couple space"
ON public.couple_space_memberships
FOR SELECT
TO authenticated
USING (public.is_couple_space_member(couple_space_id));

CREATE POLICY "Owners can view invitations for their couple space"
ON public.couple_space_invitations
FOR SELECT
TO authenticated
USING (public.is_couple_space_owner(couple_space_id));

REVOKE ALL ON TABLE public.couple_spaces FROM anon, authenticated;
REVOKE ALL ON TABLE public.couple_space_memberships FROM anon, authenticated;
REVOKE ALL ON TABLE public.couple_space_invitations FROM anon, authenticated;

GRANT SELECT ON TABLE public.couple_spaces TO authenticated;
GRANT SELECT ON TABLE public.couple_space_memberships TO authenticated;
GRANT SELECT ON TABLE public.couple_space_invitations TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_couple_space(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_couple_space_invitation() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.accept_couple_space_invitation(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_couple_space_member(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_couple_space_owner(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_couple_space(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_couple_space_invitation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_couple_space_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_couple_space_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_couple_space_owner(UUID) TO authenticated;