-- Recalculate the cached patient_age from birth date at the ADR occurrence date.
-- The loop is intentionally idempotent and skips records that need manual review.
DO $$
DECLARE
    report_row RECORD;
    anniversary_date DATE;
    calculated_age INTEGER;
    updated_count INTEGER := 0;
    skipped_count INTEGER := 0;
    vietnam_today DATE := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE;
BEGIN
    FOR report_row IN
        SELECT id, patient_birth_date, adr_occurrence_date, patient_age
        FROM public.adr_reports
    LOOP
        IF report_row.patient_birth_date IS NULL
            OR report_row.adr_occurrence_date IS NULL
            OR report_row.patient_birth_date > report_row.adr_occurrence_date
            OR report_row.adr_occurrence_date > vietnam_today
        THEN
            skipped_count := skipped_count + 1;
            RAISE WARNING 'Skipped ADR report % because its dates are missing or invalid', report_row.id;
            CONTINUE;
        END IF;

        calculated_age :=
            EXTRACT(YEAR FROM report_row.adr_occurrence_date)::INTEGER
            - EXTRACT(YEAR FROM report_row.patient_birth_date)::INTEGER;

        anniversary_date := MAKE_DATE(
            EXTRACT(YEAR FROM report_row.adr_occurrence_date)::INTEGER,
            EXTRACT(MONTH FROM report_row.patient_birth_date)::INTEGER,
            LEAST(
                EXTRACT(DAY FROM report_row.patient_birth_date)::INTEGER,
                EXTRACT(
                    DAY FROM (
                        DATE_TRUNC(
                            'month',
                            MAKE_DATE(
                                EXTRACT(YEAR FROM report_row.adr_occurrence_date)::INTEGER,
                                EXTRACT(MONTH FROM report_row.patient_birth_date)::INTEGER,
                                1
                            )
                        ) + INTERVAL '1 month - 1 day'
                    )
                )::INTEGER
            )
        );

        IF report_row.adr_occurrence_date < anniversary_date THEN
            calculated_age := calculated_age - 1;
        END IF;

        IF calculated_age < 0 OR calculated_age > 150 THEN
            skipped_count := skipped_count + 1;
            RAISE WARNING 'Skipped ADR report % because its calculated age is outside 0-150', report_row.id;
            CONTINUE;
        END IF;

        IF report_row.patient_age IS DISTINCT FROM calculated_age THEN
            UPDATE public.adr_reports
            SET patient_age = calculated_age
            WHERE id = report_row.id;

            updated_count := updated_count + 1;
        END IF;
    END LOOP;

    RAISE NOTICE 'Patient age migration completed: % updated, % skipped', updated_count, skipped_count;
END
$$;

-- Manual audit query for any skipped records:
-- SELECT id, patient_birth_date, adr_occurrence_date, patient_age
-- FROM public.adr_reports
-- WHERE patient_birth_date IS NULL
--    OR adr_occurrence_date IS NULL
--    OR patient_birth_date > adr_occurrence_date
--    OR adr_occurrence_date > (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::DATE;
