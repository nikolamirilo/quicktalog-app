import "server-only";
import { type Catalogue, schema } from "@quicktalog/common";
import { and, eq, sql } from "drizzle-orm";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import { pickEditable, type Tx, withUser } from "@/utils/db";

const c = schema.catalogues;

/** Autosaves kept per catalogue; there is no manual save point to go back to. */
export const DRAFT_VERSION_LIMIT = 10;

/**
 * Autosave fires about 1.5s after a keystroke, so keeping every one would make the ten
 * versions span a quarter of a minute. One every few minutes covers a working session.
 */
export const DRAFT_VERSION_MIN_GAP = "3 minutes";

/** What a draft row holds: the editable fields only, never owner, name or status. */
export type DraftPayload = Partial<Catalogue>;

export type DraftMeta = {
	/** The stored draft's `updated_at`, or null when the catalogue has no draft yet. */
	draftUpdatedAt: string | null;
	/** The draft has changes the published catalogue does not have. */
	unpublished: boolean;
};

export type SaveDraftOutcome =
	| ({ ok: true } & DraftMeta)
	| { ok: false; conflict: true; draftUpdatedAt: string | null };

type DraftRow = {
	draft: DraftPayload | string | null;
	updated_at: string | null;
	published_at: string | null;
};

const parse = (value: DraftPayload | string | null): DraftPayload | null => {
	if (!value) return null;
	return typeof value === "string"
		? (JSON.parse(value) as DraftPayload)
		: value;
};

const isUnpublished = (updatedAt: string | null, publishedAt: string | null) =>
	updatedAt !== null && (publishedAt === null || updatedAt > publishedAt);

/** The caller's own catalogue by name, or null. Always call inside a `withUser` block. */
export async function loadOwnedCatalogue(
	tx: Tx,
	me: VerifiedIdentity,
	name: string,
): Promise<Catalogue | null> {
	const [row] = await tx
		.select()
		.from(c)
		.where(and(eq(c.name, name), eq(c.userId, me.userId)))
		.limit(1);
	return (row as Catalogue | undefined) ?? null;
}

/** The stored draft of one of the caller's catalogues. Call inside a `withUser` block. */
export async function loadOwnedDraftRow(
	tx: Tx,
	catalogueId: string,
): Promise<DraftRow | null> {
	const rows = await tx.execute<DraftRow>(sql`
		select draft, updated_at, published_at
		  from public.catalogue_drafts
		 where catalogue_id = ${catalogueId}
		 limit 1`);
	return [...rows][0] ?? null;
}

/**
 * The editor's view: the database row with the stored draft on top, plus what the
 * builder needs to autosave against it. Server-owned fields always come from the row,
 * so a tampered draft cannot change owner, name or status.
 */
export async function readOwnedDraft(
	me: VerifiedIdentity,
	name: string,
): Promise<({ catalogue: Catalogue } & DraftMeta) | null> {
	return withUser(me, async (tx) => {
		const row = await loadOwnedCatalogue(tx, me, name);
		if (!row) return null;

		const stored = await loadOwnedDraftRow(tx, row.id);
		const draft = parse(stored?.draft ?? null);

		return {
			catalogue: {
				...row,
				...(draft ?? {}),
				id: row.id,
				name: row.name,
				status: row.status,
				userId: row.userId,
				createdAt: row.createdAt,
				updatedAt: row.updatedAt,
			},
			draftUpdatedAt: stored?.updated_at ?? null,
			unpublished: isUnpublished(
				stored?.updated_at ?? null,
				stored?.published_at ?? null,
			),
		};
	});
}

/**
 * Writes the draft of a catalogue the caller has already been proved to own.
 *
 * `baseUpdatedAt` is the draft timestamp the browser last saw. A stored draft with a
 * different timestamp means another tab or device saved in between, so the write is
 * refused rather than overwriting work the owner cannot see any more. `null` means "I
 * believe there is no draft yet", which only matches a missing row.
 */
export async function saveOwnedDraft(
	tx: Tx,
	me: VerifiedIdentity,
	input: {
		catalogueId: string;
		draft: DraftPayload;
		baseUpdatedAt: string | null;
		/** Publish writes the draft *and* marks it published in the same statement. */
		publish?: boolean;
	},
): Promise<SaveDraftOutcome> {
	const payload = pickEditable(input.draft as Record<string, unknown>);
	const body = JSON.stringify(payload);
	const published = input.publish
		? sql`now()`
		: sql`catalogue_drafts.published_at`;

	const rows = await tx.execute<{
		updated_at: string;
		published_at: string | null;
	}>(sql`
		insert into public.catalogue_drafts (catalogue_id, user_id, draft, updated_at, published_at)
		values (${input.catalogueId}, ${me.userId}, ${body}::jsonb, now(),
		        ${input.publish ? sql`now()` : sql`null`})
		on conflict (catalogue_id) do update
		   set draft        = excluded.draft,
		       updated_at   = now(),
		       published_at = ${published}
		 where catalogue_drafts.updated_at = ${input.baseUpdatedAt}::timestamptz
		returning updated_at, published_at`);

	const saved = [...rows][0];
	if (saved) {
		return {
			ok: true,
			draftUpdatedAt: saved.updated_at,
			unpublished: isUnpublished(saved.updated_at, saved.published_at),
		};
	}

	// No row came back: either the `where` of the DO UPDATE failed (someone else saved
	// since `baseUpdatedAt`), or the insert hit a row the caller believed was absent.
	const current = await loadOwnedDraftRow(tx, input.catalogueId);
	return {
		ok: false,
		conflict: true,
		draftUpdatedAt: current?.updated_at ?? null,
	};
}

/**
 * Forces the draft to the given payload, whatever is stored. Used where the server
 * already decided what the draft is: a new catalogue, a publish from the dashboard,
 * and restoring an old version.
 */
export async function writeOwnedDraft(
	tx: Tx,
	me: VerifiedIdentity,
	input: {
		catalogueId: string;
		draft: DraftPayload;
		publish?: boolean;
	},
): Promise<DraftMeta> {
	const payload = pickEditable(input.draft as Record<string, unknown>);
	const body = JSON.stringify(payload);
	const published = input.publish
		? sql`now()`
		: sql`catalogue_drafts.published_at`;

	const rows = await tx.execute<{
		updated_at: string;
		published_at: string | null;
	}>(sql`
		insert into public.catalogue_drafts (catalogue_id, user_id, draft, updated_at, published_at)
		values (${input.catalogueId}, ${me.userId}, ${body}::jsonb, now(),
		        ${input.publish ? sql`now()` : sql`null`})
		on conflict (catalogue_id) do update
		   set draft        = excluded.draft,
		       updated_at   = now(),
		       published_at = ${published}
		returning updated_at, published_at`);

	const saved = [...rows][0];
	return {
		draftUpdatedAt: saved?.updated_at ?? null,
		unpublished: isUnpublished(
			saved?.updated_at ?? null,
			saved?.published_at ?? null,
		),
	};
}

export type DraftVersion = { id: string; createdAt: string; itemCount: number };

/**
 * Keeps one autosave as a version and drops everything past the newest
 * `DRAFT_VERSION_LIMIT`. Called from the save path, inside the same transaction, so a
 * version never survives a save that was rolled back. Does nothing when the newest
 * version is younger than `DRAFT_VERSION_MIN_GAP`.
 */
export async function recordDraftVersion(
	tx: Tx,
	me: VerifiedIdentity,
	catalogueId: string,
	draft: DraftPayload,
): Promise<void> {
	const payload = pickEditable(draft as Record<string, unknown>);
	const inserted = await tx.execute<{ id: string | number }>(sql`
		insert into public.catalogue_draft_versions (catalogue_id, user_id, draft)
		select ${catalogueId}, ${me.userId}, ${JSON.stringify(payload)}::jsonb
		 where not exists (select 1
		                     from public.catalogue_draft_versions
		                    where catalogue_id = ${catalogueId}
		                      and created_at > now() - ${DRAFT_VERSION_MIN_GAP}::interval)
		returning id`);
	if ([...inserted].length === 0) return;

	await tx.execute(sql`
		delete from public.catalogue_draft_versions
		 where catalogue_id = ${catalogueId}
		   and id not in (select id
		                    from public.catalogue_draft_versions
		                   where catalogue_id = ${catalogueId}
		                   order by created_at desc, id desc
		                   limit ${DRAFT_VERSION_LIMIT})`);
}

/** The kept autosaves of one catalogue, newest first, with a size for the list. */
export async function listDraftVersions(
	tx: Tx,
	catalogueId: string,
): Promise<DraftVersion[]> {
	const rows = await tx.execute<{
		id: string | number;
		created_at: string;
		item_count: string | number;
	}>(sql`
		select v.id,
		       v.created_at,
		       coalesce((select sum(jsonb_array_length(coalesce(b -> 'items', '[]'::jsonb)))
		                   from jsonb_array_elements(
		                          case jsonb_typeof(v.draft -> 'content')
		                            when 'array' then v.draft -> 'content'
		                            else '[]'::jsonb
		                          end) b), 0) as item_count
		  from public.catalogue_draft_versions v
		 where v.catalogue_id = ${catalogueId}
		 order by v.created_at desc, v.id desc
		 limit ${DRAFT_VERSION_LIMIT}`);

	return [...rows].map((row) => ({
		id: String(row.id),
		createdAt: row.created_at,
		itemCount: Number(row.item_count) || 0,
	}));
}

/** One kept autosave of the caller's catalogue, or null. */
export async function readDraftVersion(
	tx: Tx,
	catalogueId: string,
	versionId: string,
): Promise<DraftPayload | null> {
	const rows = await tx.execute<{ draft: DraftPayload | string }>(sql`
		select draft
		  from public.catalogue_draft_versions
		 where catalogue_id = ${catalogueId}
		   and id = ${versionId}::bigint
		 limit 1`);
	return parse([...rows][0]?.draft ?? null);
}
