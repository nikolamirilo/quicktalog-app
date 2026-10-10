-- Retire the two business types that carried no signal for the AI prompt.
--
-- "online-sales" split on sales channel rather than on what the business sells, so an
-- online shop and a high-street shop got different values despite needing identical
-- item copy. "services" was a catch-all covering gyms, trades, agencies and tutors -
-- the largest slice of the market collapsed into the one value that said nothing.
--
-- Reading is already tolerant of the old values (resolveBusinessType in
-- @quicktalog/common maps them), so this is cleanup: once every row is migrated the
-- LEGACY_BUSINESS_TYPES map can go.

update public.catalogues
set business_type = 'retail'
where business_type = 'online-sales';

update public.catalogues
set business_type = 'professional-services'
where business_type = 'services';
