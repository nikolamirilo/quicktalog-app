export const HANDLED_EVENT_TYPES = [
	"user.created",
	"user.updated",
	"user.deleted",
] as const;
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000;
