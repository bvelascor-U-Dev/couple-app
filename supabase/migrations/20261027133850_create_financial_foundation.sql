CREATE TABLE public.financial_currencies(
    code TEXT PRIMARY KEY CHECK (code ~ '^[A-Z]{3}$'),
    name TEXT NOT NULL CHECK(CHAR_LENGTH(TRIM(name)) BETWEEN 2 AND 80),
    symbol TEXT NOT NULL CHECK(CHAR_LENGTH(TRIM(symbol)) BETWEEN 1 AND 8),
    decimal_places SMALLINT NOT NULL DEFAULT 2  CHECK (decimal_places BETWEEN 0 AND 4),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_financial_currencies_updated_at
BEFORE UPDATE ON public.financial_currencies
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


INSERT INTO public.financial_currencies(
    code,
    name,
    symbol,
    decimal_places
) VALUES (
    'COP',
    'Peso colombiano',
    '$',
    2
);

ALTER TABLE public.couple_spaces
ADD COLUMN currency_code TEXT NOT NULL DEFAULT 'COP',
ADD CONSTRAINT couple_space_currency_code_fkey
    FOREIGN KEY(currency_code)
    REFERENCES public.financial_currencies(code)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT;


CREATE TABLE public.financial_categories (
    id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    name TEXT NOT NULL
        CHECK(CHAR_LENGTH(TRIM(name)) BETWEEN 2 AND 80),
    transaction_type TEXT NOT NULL
        CHECK(transaction_type IN('income','expense')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order SMALLINT NOT NULL DEFAULT 0
        CHECK (sort_order >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT financial_categories_type_name_key
        UNIQUE (transaction_type, name)
);



CREATE TRIGGER set_financial_categories_updated_at
BEFORE UPDATE ON public.financial_categories
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.financial_subcategories (
    id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    category_id UUID NOT NULL
        REFERENCES public.financial_categories(id)
        ON DELETE RESTRICT,
    couple_space_id UUID
        REFERENCES public.couple_spaces(id)
        ON DELETE CASCADE,
    created_by UUID
        REFERENCES auth.users(id)
        ON DELETE RESTRICT,
    name TEXT NOT NULL
        CHECK(CHAR_LENGTH(TRIM(name))BETWEEN 2 AND 80),
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order SMALLINT NOT NULL DEFAULT 0
        CHECK (sort_order >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT financial_subcategories_origin_check CHECK (
        (
            is_system = TRUE
            AND couple_space_id IS NULL
            AND created_by IS NULL
        )
        OR
        (
            is_system = FALSE
            AND couple_space_id IS NOT NULL
            AND created_by IS NOT NULL
        )
    )
);

CREATE TRIGGER set_financial_subcategories_updated_at
BEFORE UPDATE ON public.financial_subcategories
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.financial_categories(
    name,
    transaction_type,
    sort_order
) VALUES
    ('Salario', 'income', 10),
    ('Trabajo independiente', 'income', 20),
    ('Rendimientos e inversiones', 'income', 30),
    ('Reembolsos', 'income', 40),
    ('Regalos y apoyos', 'income', 50),
    ('Otros ingresos', 'income', 60),

    ('Vivienda', 'expense', 10),
    ('Alimentación', 'expense', 20),
    ('Transporte', 'expense', 30),
    ('Salud y bienestar', 'expense', 40),
    ('Obligaciones financieras', 'expense', 50),
    ('Entretenimiento y vida social', 'expense', 60),
    ('Educación y desarrollo', 'expense', 70),
    ('Apoyo familiar', 'expense', 80),
    ('Compras y cuidado personal', 'expense', 90),
    ('Mascotas', 'expense', 100),
    ('Viajes', 'expense', 110),
    ('Otros gastos', 'expense', 120);


CREATE UNIQUE INDEX financial_subcategories_system_category_name_key
ON public.financial_subcategories (
    category_id,
    LOWER(name)
)
WHERE is_system = TRUE;

CREATE UNIQUE INDEX financial_subcategories_custom_category_space_name_key
ON public.financial_subcategories (
    category_id,
    couple_space_id,
    LOWER(name)
)
WHERE is_system = FALSE;

WITH seed_subcategories (
    category_type,
    parent_category_name,
    subcategory_name,
    sort_order
) AS (
    VALUES
        ('income', 'Salario', 'Salario base', 10),
        ('income', 'Salario', 'Bonificaciones y comisiones', 20),
        ('income', 'Salario', 'Prima de servicios', 30),

        ('income', 'Trabajo independiente', 'Servicios profesionales', 10),
        ('income', 'Trabajo independiente', 'Ventas y negocio', 20),

        ('income', 'Rendimientos e inversiones', 'Intereses', 10),
        ('income', 'Rendimientos e inversiones', 'Dividendos y rendimientos', 20),

        ('income', 'Reembolsos', 'Reembolso de gastos', 10),
        ('income', 'Reembolsos', 'Devoluciones', 20),

        ('income', 'Regalos y apoyos', 'Regalos', 10),
        ('income', 'Regalos y apoyos', 'Apoyo familiar', 20),

        ('income', 'Otros ingresos', 'Otros ingresos', 10),

        ('expense', 'Vivienda', 'Arriendo o cuota hipotecaria', 10),
        ('expense', 'Vivienda', 'Administración', 20),
        ('expense', 'Vivienda', 'Servicios públicos y facturas', 30),
        ('expense', 'Vivienda', 'Mantenimiento y reparaciones', 40),
        ('expense', 'Vivienda', 'Impuestos y trámites', 50),
        ('expense', 'Vivienda', 'Muebles y decoración', 60),
        ('expense', 'Vivienda', 'Electrodomésticos y tecnología del hogar', 70),

        ('expense', 'Alimentación', 'Mercado', 10),
        ('expense', 'Alimentación', 'Restaurantes y domicilios', 20),

        ('expense', 'Transporte', 'Transporte público', 10),
        ('expense', 'Transporte', 'Taxi y plataformas', 20),
        ('expense', 'Transporte', 'Combustible', 30),
        ('expense', 'Transporte', 'Peajes y parqueaderos', 40),
        ('expense', 'Transporte', 'Mantenimiento de vehículo', 50),
        ('expense', 'Transporte', 'Impuestos y trámites', 60),

        ('expense', 'Salud y bienestar', 'Consultas y tratamientos', 10),
        ('expense', 'Salud y bienestar', 'Medicamentos y suplementos', 20),
        ('expense', 'Salud y bienestar', 'Gimnasio', 30),
        ('expense', 'Salud y bienestar', 'Entrenador personalizado', 40),
        ('expense', 'Salud y bienestar', 'Actividad física y bienestar', 50),

        ('expense', 'Obligaciones financieras', 'Pago mínimo de tarjeta de crédito', 10),
        ('expense', 'Obligaciones financieras', 'Cuotas de préstamos', 20),
        ('expense', 'Obligaciones financieras', 'Seguros', 30),
        ('expense', 'Obligaciones financieras', 'Declaración de renta e impuestos', 40),

        ('expense', 'Entretenimiento y vida social', 'Planes en pareja', 10),
        ('expense', 'Entretenimiento y vida social', 'Salidas con amistades', 20),
        ('expense', 'Entretenimiento y vida social', 'Streaming y suscripciones', 30),
        ('expense', 'Entretenimiento y vida social', 'Hobbies', 40),

        ('expense', 'Educación y desarrollo', 'Cursos y certificaciones', 10),
        ('expense', 'Educación y desarrollo', 'Libros y materiales', 20),
        ('expense', 'Educación y desarrollo', 'Especialización o maestría', 30),
        ('expense', 'Educación y desarrollo', 'Idiomas', 40),

        ('expense', 'Apoyo familiar', 'Apoyo a padres y familia', 10),

        ('expense', 'Compras y cuidado personal', 'Ropa y calzado', 10),
        ('expense', 'Compras y cuidado personal', 'Belleza y cuidado', 20),
        ('expense', 'Compras y cuidado personal', 'Tecnología personal', 30),
        ('expense', 'Compras y cuidado personal', 'Otros artículos personales', 40),

        ('expense', 'Mascotas', 'Alimentación', 10),
        ('expense', 'Mascotas', 'Veterinaria', 20),
        ('expense', 'Mascotas', 'Accesorios', 30),

        ('expense', 'Viajes', 'Transporte', 10),
        ('expense', 'Viajes', 'Alojamiento', 20),
        ('expense', 'Viajes', 'Actividades', 30),
        ('expense', 'Viajes', 'Obsequios', 40),

        ('expense', 'Otros gastos', 'Imprevistos', 10),
        ('expense', 'Otros gastos', 'Otros', 20)
)
INSERT INTO public.financial_subcategories (
    category_id,
    name,
    is_system,
    sort_order
)
SELECT
    category.id,
    seed.subcategory_name,
    TRUE,
    seed.sort_order
FROM seed_subcategories AS seed
INNER JOIN public.financial_categories AS category
    ON category.transaction_type = seed.category_type
    AND category.name = seed.parent_category_name;

CREATE TABLE public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    couple_space_id UUID NOT NULL
        REFERENCES public.couple_spaces(id)
        ON DELETE CASCADE,
    created_by UUID NOT NULL
        REFERENCES auth.users(id)
        ON DELETE RESTRICT,
    transaction_type TEXT NOT NULL
        CHECK(transaction_type IN ('income','expense')),
    category_id UUID NOT NULL
        REFERENCES public.financial_categories(id)
        ON DELETE RESTRICT,
    subcategory_id UUID
        REFERENCES public.financial_subcategories(id)
        ON DELETE RESTRICT,
    amount NUMERIC(18,4) NOT NULL
        CHECK(amount > 0),
    currency_code TEXT NOT NULL
        REFERENCES public.financial_currencies(code)
        ON DELETE RESTRICT,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    concept TEXT
        CHECK(
            concept IS NULL
            OR CHAR_LENGTH(TRIM(concept)) BETWEEN 1 AND 180
        ),
    expense_scope TEXT,
    is_small_expense BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT financial_transactions_expense_scope_check CHECK (
    (
        transaction_type = 'income'
        AND expense_scope IS NULL
    )
    OR
    (
        transaction_type = 'expense'
        AND expense_scope IS NOT NULL
        AND expense_scope IN ('personal', 'shared')
    )
    ),
    CONSTRAINT financial_transactions_small_expense_check CHECK (
        transaction_type = 'expense'
        OR is_small_expense = FALSE
    )
);

CREATE FUNCTION public.set_financial_transaction_context()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    authenticated_couple_space_id UUID;
    authenticated_currency_code TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication is required.';
    END IF;
    IF TG_OP = 'INSERT' THEN
        SELECT
            membership.couple_space_id,
            space.currency_code
        INTO
            authenticated_couple_space_id,
            authenticated_currency_code
        FROM public.couple_space_memberships AS membership
        INNER JOIN public.couple_spaces AS space
            ON space.id = membership.couple_space_id
        WHERE membership.user_id = auth.uid();

        IF authenticated_couple_space_id IS NULL THEN
            RAISE EXCEPTION 'A couple space is required to create financial transactions.';
        END IF;

        NEW.couple_space_id := authenticated_couple_space_id;
        NEW.created_by := auth.uid();
        NEW.currency_code := authenticated_currency_code;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF NEW.couple_space_id IS DISTINCT FROM OLD.couple_space_id THEN
            RAISE EXCEPTION 'The couple space cannot be changed.';
        END IF;

        IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
            RAISE EXCEPTION 'The transaction creator cannot be changed.';
        END IF;

        IF NEW.currency_code IS DISTINCT FROM OLD.currency_code THEN
            RAISE EXCEPTION 'The transaction currency cannot be changed.';
        END IF;
    END IF;

    NEW.concept := NULLIF(TRIM(NEW.concept), '');

    IF NEW.expense_scope IS NULL AND NEW.transaction_type = 'expense' THEN
        NEW.expense_scope := 'personal';
    END IF;

    IF NEW.transaction_type = 'income' THEN
        NEW.expense_scope := NULL;
        NEW.is_small_expense := FALSE;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER set_financial_transactions_context
BEFORE INSERT OR UPDATE ON public.financial_transactions
FOR EACH ROW
EXECUTE FUNCTION public.set_financial_transaction_context();

CREATE TRIGGER set_financial_transactions_updated_at
BEFORE UPDATE ON public.financial_transactions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE FUNCTION public.validate_financial_transaction_classification()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    selected_category_type TEXT;
BEGIN
    SELECT category.transaction_type
    INTO selected_category_type
    FROM public.financial_categories AS category
    WHERE category.id = NEW.category_id
      AND category.is_active = TRUE;

    IF selected_category_type IS NULL THEN
        RAISE EXCEPTION 'The selected category does not exist or is inactive.';
    END IF;

    IF selected_category_type IS DISTINCT FROM NEW.transaction_type THEN
        RAISE EXCEPTION 'The selected category is not compatible with the transaction type.';
    END IF;

    RETURN NEW;
END;
$$;

CREATE FUNCTION public.validate_financial_transaction_subclassification()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    selected_subcategory_category_id UUID;
    selected_subcategory_couple_space_id UUID;
BEGIN
    IF NEW.subcategory_id IS NOT NULL THEN
        SELECT
            subcategory.category_id,
            subcategory.couple_space_id
        INTO
            selected_subcategory_category_id,
            selected_subcategory_couple_space_id
        FROM public.financial_subcategories AS subcategory
        WHERE subcategory.id = NEW.subcategory_id
          AND subcategory.is_active = TRUE;

        IF selected_subcategory_category_id IS NULL THEN
            RAISE EXCEPTION 'The selected subcategory does not exist or is inactive.';
        END IF;

        IF selected_subcategory_category_id
            IS DISTINCT FROM NEW.category_id THEN
            RAISE EXCEPTION 'The selected subcategory does not belong to the selected category.';
        END IF;

        IF selected_subcategory_couple_space_id IS NOT NULL
            AND selected_subcategory_couple_space_id
                IS DISTINCT FROM NEW.couple_space_id THEN
            RAISE EXCEPTION 'The selected subcategory does not belong to this couple space.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER validate_financial_transactions_classification
BEFORE INSERT OR UPDATE ON public.financial_transactions
FOR EACH ROW
EXECUTE FUNCTION public.validate_financial_transaction_classification();

CREATE TRIGGER validate_financial_transactions_subclassification
BEFORE INSERT OR UPDATE ON public.financial_transactions
FOR EACH ROW
EXECUTE FUNCTION public.validate_financial_transaction_subclassification();

CREATE INDEX financial_transactions_space_date_idx
ON public.financial_transactions (
    couple_space_id,
    effective_date DESC
);

CREATE INDEX financial_transactions_space_member_date_idx
ON public.financial_transactions (
    couple_space_id,
    created_by,
    effective_date DESC
);

CREATE INDEX financial_transactions_space_type_date_idx
ON public.financial_transactions (
    couple_space_id,
    transaction_type,
    effective_date DESC
);

CREATE INDEX financial_transactions_space_category_date_idx
ON public.financial_transactions (
    couple_space_id,
    category_id,
    effective_date DESC
);

ALTER TABLE public.financial_currencies
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.financial_categories
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.financial_subcategories
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.financial_transactions
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view financial currencies"
ON public.financial_currencies
FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Authenticated users can view financial categories"
ON public.financial_categories
FOR SELECT
TO authenticated
USING (TRUE);

CREATE POLICY "Authenticated users can view available financial subcategories"
ON public.financial_subcategories
FOR SELECT
TO authenticated
USING (
    is_system = TRUE
    OR public.is_couple_space_member(couple_space_id)
);

CREATE POLICY "Members can view financial transactions in their couple space"
ON public.financial_transactions
FOR SELECT
TO authenticated
USING (
    public.is_couple_space_member(couple_space_id)
);

CREATE POLICY "Members can create their own financial transactions"
ON public.financial_transactions
FOR INSERT
TO authenticated
WITH CHECK (
    created_by = (SELECT auth.uid())
    AND public.is_couple_space_member(couple_space_id)
);

CREATE POLICY "Creators can update their own financial transactions"
ON public.financial_transactions
FOR UPDATE
TO authenticated
USING (
    created_by = (SELECT auth.uid())
    AND public.is_couple_space_member(couple_space_id)
)
WITH CHECK (
    created_by = (SELECT auth.uid())
    AND public.is_couple_space_member(couple_space_id)
);

CREATE POLICY "Creators can delete their own financial transactions"
ON public.financial_transactions
FOR DELETE
TO authenticated
USING (
    created_by = (SELECT auth.uid())
    AND public.is_couple_space_member(couple_space_id)
);

REVOKE ALL
ON TABLE public.financial_currencies
FROM PUBLIC, anon, authenticated;

REVOKE ALL
ON TABLE public.financial_categories
FROM PUBLIC, anon, authenticated;

REVOKE ALL
ON TABLE public.financial_subcategories
FROM PUBLIC, anon, authenticated;

REVOKE ALL
ON TABLE public.financial_transactions
FROM PUBLIC, anon, authenticated;

GRANT SELECT
ON TABLE public.financial_currencies
TO authenticated;

GRANT SELECT
ON TABLE public.financial_categories
TO authenticated;

GRANT SELECT
ON TABLE public.financial_subcategories
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.financial_transactions
TO authenticated;

REVOKE EXECUTE
ON FUNCTION public.set_financial_transaction_context()
FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE
ON FUNCTION public.validate_financial_transaction_classification()
FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE
ON FUNCTION public.validate_financial_transaction_subclassification()
FROM PUBLIC, anon, authenticated;

COMMENT ON POLICY "Authenticated users can view financial currencies"
ON public.financial_currencies
IS
'Financial currencies are a system-controlled catalog readable by authenticated users. Direct client writes are not granted.';

COMMENT ON POLICY "Authenticated users can view financial categories"
ON public.financial_categories
IS
'Financial categories are system-controlled and readable by authenticated users. Direct client writes are not granted.';

COMMENT ON POLICY "Authenticated users can view available financial subcategories"
ON public.financial_subcategories
IS
'Users can read global system subcategories and custom subcategories only when they belong to the associated couple space.';

COMMENT ON POLICY "Members can view financial transactions in their couple space"
ON public.financial_transactions
IS
'Both members of a couple space can read its financial transactions.';

COMMENT ON POLICY "Members can create their own financial transactions"
ON public.financial_transactions
IS
'Authenticated members can create transactions only for themselves and their own couple space. Trigger context assigns ownership and currency from authenticated data.';

COMMENT ON POLICY "Creators can update their own financial transactions"
ON public.financial_transactions
IS
'Only the transaction creator can update a transaction. Membership in the transaction couple space remains required.';

COMMENT ON POLICY "Creators can delete their own financial transactions"
ON public.financial_transactions
IS
'Only the transaction creator can delete a transaction while they remain a member of its couple space.';
