REVOKE ALL
ON TABLE public.profiles
FROM PUBLIC, anon, authenticated;

GRANT SELECT, UPDATE
ON TABLE public.profiles
TO authenticated;

REVOKE ALL
ON TABLE public.couple_spaces
FROM PUBLIC, anon, authenticated;

REVOKE ALL
ON TABLE public.couple_space_memberships
FROM PUBLIC, anon, authenticated;

REVOKE ALL
ON TABLE public.couple_space_invitations
FROM PUBLIC, anon, authenticated;

GRANT SELECT
ON TABLE public.couple_spaces
TO authenticated;

GRANT SELECT
ON TABLE public.couple_space_memberships
TO authenticated;

GRANT SELECT
ON TABLE public.couple_space_invitations
TO authenticated;

REVOKE EXECUTE
ON FUNCTION public.set_updated_at()
FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE
ON FUNCTION public.handle_new_user()
FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE
ON FUNCTION public.create_couple_space(TEXT)
FROM PUBLIC, anon;

REVOKE EXECUTE
ON FUNCTION public.create_couple_space_invitation()
FROM PUBLIC, anon;

REVOKE EXECUTE
ON FUNCTION public.accept_couple_space_invitation(UUID)
FROM PUBLIC, anon;

REVOKE EXECUTE
ON FUNCTION public.get_current_couple_space_members()
FROM PUBLIC, anon;

REVOKE EXECUTE
ON FUNCTION public.get_current_couple_space_invitation()
FROM PUBLIC, anon;

REVOKE EXECUTE
ON FUNCTION public.is_couple_space_member(UUID)
FROM PUBLIC, anon;

REVOKE EXECUTE
ON FUNCTION public.is_couple_space_owner(UUID)
FROM PUBLIC, anon;


GRANT EXECUTE
ON FUNCTION public.create_couple_space(TEXT)
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.create_couple_space_invitation()
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.accept_couple_space_invitation(UUID)
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.get_current_couple_space_members()
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.get_current_couple_space_invitation()
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.is_couple_space_member(UUID)
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.is_couple_space_owner(UUID)
TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_space_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_space_invitations ENABLE ROW LEVEL SECURITY;


COMMENT ON POLICY "Users can view only their own profile"
ON public.profiles
IS
'Authenticated users can read only the profile whose id matches auth.uid().';

COMMENT ON POLICY "Users can update only their own profile"
ON public.profiles
IS
'Authenticated users can update only their own profile. WITH CHECK prevents changing ownership to another user.';

COMMENT ON POLICY "Members can view their couple space"
ON public.couple_spaces
IS
'Only users with a membership for the current couple space row can read it.';

COMMENT ON POLICY "Members can view memberships in their couple space"
ON public.couple_space_memberships
IS
'Members can read membership rows only when they belong to the same couple space.';

COMMENT ON POLICY "Owners can view invitations for their couple space"
ON public.couple_space_invitations
IS
'Only the owner membership of a couple space can read its invitation records.';