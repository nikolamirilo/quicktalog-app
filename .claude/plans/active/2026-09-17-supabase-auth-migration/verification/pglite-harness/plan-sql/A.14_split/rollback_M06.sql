-- M06: re-run the M05 definitions of begin_ai_turn(text, integer, boolean) and refund_ai_turn(uuid), then:
drop function if exists private.begin_ai_turn(text, integer, text, uuid, text);
drop function if exists private.set_plan_state(uuid, boolean, integer, text);
-- prompts columns kind/plan_* may stay (defaults are harmless).
