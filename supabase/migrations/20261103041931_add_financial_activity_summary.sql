CREATE FUNCTION public.get_financial_activity_summary(
    p_couple_space_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_creator_id UUID DEFAULT NULL
)
RETURNS TABLE (
    income_total NUMERIC,
    expense_total NUMERIC,
    balance NUMERIC
)
LANGUAGE PLPGSQL
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
   IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication is required.';
    END IF;

    IF p_couple_space_id IS NULL THEN
        RAISE EXCEPTION 'A couple space is required.';
    END IF;

    IF p_start_date IS NULL OR p_end_date IS NULL THEN
        RAISE EXCEPTION 'A date range is required.';
    END IF;

    IF p_start_date > p_end_date THEN
        RAISE EXCEPTION 'The start date cannot be after the end date.';
    END IF;

    IF NOT public.is_couple_space_member(p_couple_space_id) THEN
        RAISE EXCEPTION 'You are not authorized to view this couple space summary.';
    END IF; 
    RETURN QUERY
    SELECT
        COALESCE(
            SUM(financial_transaction.amount)
            FILTER (WHERE financial_transaction.transaction_type = 'income'),
            0::NUMERIC
        ) AS income_total,
        COALESCE(
            SUM(financial_transaction.amount)
            FILTER (WHERE financial_transaction.transaction_type = 'expense'),
            0::NUMERIC
        ) AS expense_total,
        COALESCE(
            SUM(
                CASE
                    WHEN financial_transaction.transaction_type = 'income' THEN financial_transaction.amount
                    WHEN financial_transaction.transaction_type = 'expense' THEN -financial_transaction.amount
                    ELSE 0::NUMERIC
                END
            ),
            0::NUMERIC
        ) AS balance
    FROM public.financial_transactions AS financial_transaction
    WHERE financial_transaction.couple_space_id = p_couple_space_id
      AND financial_transaction.effective_date BETWEEN p_start_date AND p_end_date
      AND (
          p_creator_id IS NULL
          OR financial_transaction.created_by = p_creator_id
      );
END;
$$;

REVOKE EXECUTE
ON FUNCTION public.get_financial_activity_summary(UUID, DATE, DATE, UUID)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.get_financial_activity_summary(UUID, DATE, DATE, UUID)
TO authenticated;

COMMENT ON FUNCTION public.get_financial_activity_summary(UUID, DATE, DATE, UUID)
IS
'Returns exact income, expense, and balance totals for an authorized couple space and date range. Runs as the caller so financial transaction RLS policies remain enforced.';