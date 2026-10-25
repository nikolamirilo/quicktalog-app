-- The app now spends from a request's hold (spend_ai_hold) and no longer calls
-- settle_ai_turn, which added credits with no ceiling. Plan 2026-10-24-ai-credit-hard-cap, Task 10.
drop function if exists private.settle_ai_turn(uuid, integer);
