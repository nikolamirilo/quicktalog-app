-- M05:
drop function if exists private.refund_ai_turn(uuid);
drop function if exists private.begin_ai_turn(text, integer, boolean);
drop function if exists private.my_usage();
drop function if exists private.subscribe_product_newsletter(text);
drop function if exists private.subscribe_catalogue_newsletter(uuid, text);
drop function if exists private.catalogue_name_available(text);
