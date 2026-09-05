import type {Migration} from './types';

export const initialMigration: Migration = {
  version: 1,
  name: 'canonical_initial_schema',
  statements: [
    `CREATE TABLE capture_entry (
      id TEXT PRIMARY KEY,
      current_revision_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (current_revision_id)
        REFERENCES capture_entry_revision(id)
        DEFERRABLE INITIALLY DEFERRED
    ) STRICT`,

    `CREATE TABLE capture_entry_revision (
      id TEXT PRIMARY KEY,
      entry_id TEXT NOT NULL,
      revision INTEGER NOT NULL CHECK (revision >= 1),
      kind TEXT NOT NULL CHECK (
        kind IN ('thought', 'event', 'observation', 'question', 'quote_to_self')
      ),
      content TEXT NOT NULL,
      occurred_at TEXT,
      created_at TEXT NOT NULL,
      UNIQUE (entry_id, revision),
      FOREIGN KEY (entry_id) REFERENCES capture_entry(id) ON DELETE CASCADE
    ) STRICT`,

    `CREATE TABLE capture_entry_revision_tag (
      revision_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      PRIMARY KEY (revision_id, tag),
      FOREIGN KEY (revision_id)
        REFERENCES capture_entry_revision(id)
        ON DELETE CASCADE
    ) STRICT`,

    `CREATE TABLE reflection_session (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CHECK (start_date <= end_date)
    ) STRICT`,

    `CREATE TABLE reflection_item (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      current_revision_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (session_id)
        REFERENCES reflection_session(id)
        ON DELETE CASCADE,
      FOREIGN KEY (current_revision_id)
        REFERENCES reflection_item_revision(id)
        DEFERRABLE INITIALLY DEFERRED
    ) STRICT`,

    `CREATE TABLE reflection_item_revision (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      revision INTEGER NOT NULL CHECK (revision >= 1),
      kind TEXT NOT NULL CHECK (
        kind IN ('regret', 'win', 'desire', 'discovery', 'turning_point', 'insight')
      ),
      title TEXT,
      content TEXT NOT NULL,
      context TEXT,
      cause TEXT,
      consequence TEXT,
      lesson TEXT,
      occurred_at TEXT,
      created_at TEXT NOT NULL,
      UNIQUE (item_id, revision),
      FOREIGN KEY (item_id) REFERENCES reflection_item(id) ON DELETE CASCADE
    ) STRICT`,

    `CREATE TABLE reflection_item_revision_tag (
      revision_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      PRIMARY KEY (revision_id, tag),
      FOREIGN KEY (revision_id)
        REFERENCES reflection_item_revision(id)
        ON DELETE CASCADE
    ) STRICT`,

    `CREATE TABLE synthesis_insight (
      id TEXT PRIMARY KEY,
      current_revision_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('active', 'uncertain', 'retired')),
      created_at TEXT NOT NULL,
      FOREIGN KEY (current_revision_id)
        REFERENCES synthesis_insight_revision(id)
        DEFERRABLE INITIALLY DEFERRED
    ) STRICT`,

    `CREATE TABLE synthesis_insight_revision (
      id TEXT PRIMARY KEY,
      insight_id TEXT NOT NULL,
      revision INTEGER NOT NULL CHECK (revision >= 1),
      title TEXT,
      statement TEXT NOT NULL,
      context TEXT,
      created_at TEXT NOT NULL,
      UNIQUE (insight_id, revision),
      FOREIGN KEY (insight_id)
        REFERENCES synthesis_insight(id)
        ON DELETE CASCADE
    ) STRICT`,

    `CREATE TABLE meaning_node (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL CHECK (
        kind IN ('unclassified', 'motive', 'vision', 'goal', 'practice', 'commitment')
      ),
      status TEXT NOT NULL CHECK (
        status IN ('active', 'paused', 'retired', 'merged', 'archived')
      ),
      current_revision_id TEXT NOT NULL,
      merged_into_node_id TEXT,
      created_at TEXT NOT NULL,
      CHECK (
        (status = 'merged' AND merged_into_node_id IS NOT NULL)
        OR (status <> 'merged' AND merged_into_node_id IS NULL)
      ),
      FOREIGN KEY (current_revision_id)
        REFERENCES meaning_node_revision(id)
        DEFERRABLE INITIALLY DEFERRED,
      FOREIGN KEY (merged_into_node_id)
        REFERENCES meaning_node(id)
        ON DELETE RESTRICT
    ) STRICT`,

    `CREATE TABLE meaning_node_revision (
      id TEXT PRIMARY KEY,
      node_id TEXT NOT NULL,
      revision INTEGER NOT NULL CHECK (revision >= 1),
      title TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      UNIQUE (node_id, revision),
      FOREIGN KEY (node_id) REFERENCES meaning_node(id) ON DELETE CASCADE
    ) STRICT`,

    `CREATE TABLE meaning_node_classification_event (
      id TEXT PRIMARY KEY,
      node_id TEXT NOT NULL,
      from_kind TEXT NOT NULL CHECK (from_kind = 'unclassified'),
      to_kind TEXT NOT NULL CHECK (
        to_kind IN ('motive', 'vision', 'goal', 'practice', 'commitment')
      ),
      created_at TEXT NOT NULL,
      UNIQUE (node_id),
      FOREIGN KEY (node_id) REFERENCES meaning_node(id) ON DELETE CASCADE
    ) STRICT`,

    `CREATE TABLE motive_revision_detail (
      node_revision_id TEXT PRIMARY KEY,
      FOREIGN KEY (node_revision_id)
        REFERENCES meaning_node_revision(id)
        ON DELETE CASCADE
    ) STRICT`,

    `CREATE TABLE vision_revision_detail (
      node_revision_id TEXT PRIMARY KEY,
      desired_state TEXT,
      FOREIGN KEY (node_revision_id)
        REFERENCES meaning_node_revision(id)
        ON DELETE CASCADE
    ) STRICT`,

    `CREATE TABLE goal_revision_detail (
      node_revision_id TEXT PRIMARY KEY,
      target_description TEXT,
      target_date TEXT,
      FOREIGN KEY (node_revision_id)
        REFERENCES meaning_node_revision(id)
        ON DELETE CASCADE
    ) STRICT`,

    `CREATE TABLE practice_revision_detail (
      node_revision_id TEXT PRIMARY KEY,
      action_description TEXT,
      FOREIGN KEY (node_revision_id)
        REFERENCES meaning_node_revision(id)
        ON DELETE CASCADE
    ) STRICT`,

    `CREATE TABLE commitment_revision_detail (
      node_revision_id TEXT PRIMARY KEY,
      action_rule TEXT NOT NULL,
      FOREIGN KEY (node_revision_id)
        REFERENCES meaning_node_revision(id)
        ON DELETE CASCADE
    ) STRICT`,

    `CREATE TABLE meaning_node_lifecycle_event (
      id TEXT PRIMARY KEY,
      node_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (
        type IN ('paused', 'resumed', 'retired', 'reactivated', 'archived', 'unarchived')
      ),
      retirement_reason TEXT CHECK (
        retirement_reason IS NULL OR retirement_reason IN (
          'achieved',
          'no_longer_wanted',
          'values_changed',
          'superseded',
          'deferred',
          'context_changed',
          'other'
        )
      ),
      note TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (node_id) REFERENCES meaning_node(id) ON DELETE CASCADE
    ) STRICT`,

    `CREATE TABLE meaning_relation (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL CHECK (
        kind IN (
          'motivated_by',
          'contributes_to',
          'serves',
          'supports',
          'conflicts_with',
          'supersedes'
        )
      ),
      from_node_id TEXT NOT NULL,
      to_node_id TEXT NOT NULL,
      current_revision_id TEXT NOT NULL,
      activated_at TEXT NOT NULL,
      retired_at TEXT,
      CHECK (from_node_id <> to_node_id),
      CHECK (kind <> 'conflicts_with' OR from_node_id < to_node_id),
      CHECK (retired_at IS NULL OR retired_at >= activated_at),
      FOREIGN KEY (from_node_id) REFERENCES meaning_node(id) ON DELETE CASCADE,
      FOREIGN KEY (to_node_id) REFERENCES meaning_node(id) ON DELETE CASCADE,
      FOREIGN KEY (current_revision_id)
        REFERENCES meaning_relation_revision(id)
        DEFERRABLE INITIALLY DEFERRED
    ) STRICT`,

    `CREATE TABLE meaning_relation_revision (
      id TEXT PRIMARY KEY,
      relation_id TEXT NOT NULL,
      revision INTEGER NOT NULL CHECK (revision >= 1),
      note TEXT,
      created_at TEXT NOT NULL,
      UNIQUE (relation_id, revision),
      FOREIGN KEY (relation_id)
        REFERENCES meaning_relation(id)
        ON DELETE CASCADE
    ) STRICT`,

    `CREATE TABLE tradeoff_reflection (
      id TEXT PRIMARY KEY,
      conflict_relation_id TEXT NOT NULL,
      conflict_relation_revision_id TEXT NOT NULL,
      why_both_matter TEXT,
      current_priority TEXT CHECK (
        current_priority IS NULL OR current_priority IN ('from', 'to', 'balanced', 'undecided')
      ),
      tradeoff_cost TEXT,
      revisit_at TEXT,
      note TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (conflict_relation_id)
        REFERENCES meaning_relation(id)
        ON DELETE CASCADE,
      FOREIGN KEY (conflict_relation_revision_id)
        REFERENCES meaning_relation_revision(id)
        ON DELETE CASCADE
    ) STRICT`,

    `CREATE TABLE causal_evidence_link (
      id TEXT PRIMARY KEY,
      evidence_type TEXT NOT NULL CHECK (
        evidence_type IN (
          'capture_revision',
          'reflection_revision',
          'synthesis_revision',
          'meaning_node_revision',
          'meaning_relation_revision',
          'origin_moment',
          'meaning_check_in',
          'tradeoff_reflection'
        )
      ),
      evidence_id TEXT NOT NULL,
      derived_revision_type TEXT NOT NULL CHECK (
        derived_revision_type IN ('synthesis_revision', 'meaning_node_revision')
      ),
      derived_revision_id TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL,
      CHECK (
        NOT (
          evidence_type = derived_revision_type
          AND evidence_id = derived_revision_id
        )
      ),
      UNIQUE (
        evidence_type,
        evidence_id,
        derived_revision_type,
        derived_revision_id
      )
    ) STRICT`,

    `CREATE TABLE origin_moment (
      id TEXT PRIMARY KEY,
      subject_type TEXT NOT NULL CHECK (subject_type IN ('node', 'relation')),
      subject_id TEXT NOT NULL,
      subject_revision_id TEXT NOT NULL,
      original_text TEXT,
      context TEXT,
      captured_at TEXT NOT NULL
    ) STRICT`,

    `CREATE TABLE origin_relation_snapshot (
      id TEXT PRIMARY KEY,
      origin_moment_id TEXT NOT NULL,
      relation_id TEXT NOT NULL,
      relation_revision_id TEXT NOT NULL,
      was_active INTEGER NOT NULL CHECK (was_active IN (0, 1)),
      FOREIGN KEY (origin_moment_id)
        REFERENCES origin_moment(id)
        ON DELETE CASCADE,
      FOREIGN KEY (relation_id)
        REFERENCES meaning_relation(id)
        ON DELETE CASCADE,
      FOREIGN KEY (relation_revision_id)
        REFERENCES meaning_relation_revision(id)
        ON DELETE CASCADE
    ) STRICT`,

    `CREATE TABLE meaning_check_in (
      id TEXT PRIMARY KEY,
      subject_type TEXT NOT NULL CHECK (subject_type IN ('node', 'relation')),
      subject_id TEXT NOT NULL,
      subject_revision_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (
        type IN ('reaffirmed', 'reframed', 'weakened', 'retired', 'uncertain')
      ),
      trigger TEXT,
      doubt TEXT,
      remembered_reason TEXT,
      current_meaning TEXT,
      message_at_that_moment TEXT,
      created_at TEXT NOT NULL
    ) STRICT`,

    `CREATE TABLE review_state (
      subject_node_id TEXT PRIMARY KEY,
      last_reviewed_at TEXT,
      snoozed_until TEXT,
      is_resurfacing_excluded INTEGER NOT NULL DEFAULT 0
        CHECK (is_resurfacing_excluded IN (0, 1)),
      updated_at TEXT NOT NULL,
      FOREIGN KEY (subject_node_id)
        REFERENCES meaning_node(id)
        ON DELETE CASCADE
    ) STRICT`,

    `CREATE TABLE lockscreen_projection (
      id TEXT PRIMARY KEY,
      commitment_node_id TEXT NOT NULL,
      current_revision_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (commitment_node_id)
        REFERENCES meaning_node(id)
        ON DELETE CASCADE,
      FOREIGN KEY (current_revision_id)
        REFERENCES lockscreen_projection_revision(id)
        DEFERRABLE INITIALLY DEFERRED
    ) STRICT`,

    `CREATE TABLE lockscreen_projection_revision (
      id TEXT PRIMARY KEY,
      projection_id TEXT NOT NULL,
      revision INTEGER NOT NULL CHECK (revision >= 1),
      commitment_revision_id TEXT NOT NULL,
      public_safe_message TEXT NOT NULL,
      widget_message TEXT,
      wallpaper_message TEXT,
      created_at TEXT NOT NULL,
      UNIQUE (projection_id, revision),
      FOREIGN KEY (projection_id)
        REFERENCES lockscreen_projection(id)
        ON DELETE CASCADE,
      FOREIGN KEY (commitment_revision_id)
        REFERENCES meaning_node_revision(id)
        ON DELETE RESTRICT
    ) STRICT`,

    `CREATE TABLE projection_approval_event (
      id TEXT PRIMARY KEY,
      projection_revision_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('approved', 'revoked')),
      approval_digest TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (projection_revision_id)
        REFERENCES lockscreen_projection_revision(id)
        ON DELETE CASCADE
    ) STRICT`,

    `CREATE TABLE lockscreen_state (
      singleton_id TEXT PRIMARY KEY CHECK (singleton_id = 'lockscreen_state'),
      active_projection_revision_id TEXT,
      set_at TEXT,
      FOREIGN KEY (active_projection_revision_id)
        REFERENCES lockscreen_projection_revision(id)
        ON DELETE SET NULL
    ) STRICT`,

    `INSERT INTO lockscreen_state(singleton_id, active_projection_revision_id, set_at)
     VALUES ('lockscreen_state', NULL, NULL)`,

    `CREATE TABLE node_merge_event (
      id TEXT PRIMARY KEY,
      source_node_id TEXT NOT NULL,
      target_node_id TEXT NOT NULL,
      note TEXT,
      merged_at TEXT NOT NULL,
      CHECK (source_node_id <> target_node_id),
      FOREIGN KEY (source_node_id)
        REFERENCES meaning_node(id)
        ON DELETE CASCADE,
      FOREIGN KEY (target_node_id)
        REFERENCES meaning_node(id)
        ON DELETE RESTRICT
    ) STRICT`,

    `CREATE TABLE focus_window (
      id TEXT PRIMARY KEY,
      subject_node_id TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      recurrence TEXT NOT NULL CHECK (recurrence IN ('none', 'yearly')),
      CHECK (start_date <= end_date),
      FOREIGN KEY (subject_node_id)
        REFERENCES meaning_node(id)
        ON DELETE CASCADE
    ) STRICT`,

    `CREATE TABLE canvas_placement (
      id TEXT PRIMARY KEY,
      canvas_id TEXT NOT NULL,
      object_type TEXT NOT NULL CHECK (
        object_type IN (
          'meaning_node',
          'capture_entry',
          'reflection_item',
          'synthesis_insight'
        )
      ),
      object_id TEXT NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (canvas_id, object_type, object_id)
    ) STRICT`,

    `CREATE VIRTUAL TABLE search_fts USING fts5(
      document_type UNINDEXED,
      object_id UNINDEXED,
      revision_id UNINDEXED,
      title,
      body,
      tags,
      tokenize = 'unicode61'
    )`,

    `CREATE INDEX idx_capture_revision_entry
      ON capture_entry_revision(entry_id, revision DESC)`,

    `CREATE INDEX idx_reflection_session_period
      ON reflection_session(start_date, end_date)`,

    `CREATE INDEX idx_reflection_item_session
      ON reflection_item(session_id, created_at DESC)`,

    `CREATE INDEX idx_reflection_revision_item
      ON reflection_item_revision(item_id, revision DESC)`,

    `CREATE INDEX idx_synthesis_revision_insight
      ON synthesis_insight_revision(insight_id, revision DESC)`,

    `CREATE INDEX idx_meaning_node_kind_status
      ON meaning_node(kind, status, created_at DESC)`,

    `CREATE INDEX idx_meaning_node_revision_node
      ON meaning_node_revision(node_id, revision DESC)`,

    `CREATE INDEX idx_meaning_lifecycle_node
      ON meaning_node_lifecycle_event(node_id, created_at DESC)`,

    `CREATE INDEX idx_relation_from_active
      ON meaning_relation(from_node_id, kind, retired_at)`,

    `CREATE INDEX idx_relation_to_active
      ON meaning_relation(to_node_id, kind, retired_at)`,

    `CREATE UNIQUE INDEX ux_active_conflict_pair
      ON meaning_relation(from_node_id, to_node_id)
      WHERE kind = 'conflicts_with' AND retired_at IS NULL`,

    `CREATE INDEX idx_relation_revision_relation
      ON meaning_relation_revision(relation_id, revision DESC)`,

    `CREATE INDEX idx_tradeoff_conflict
      ON tradeoff_reflection(conflict_relation_id, created_at DESC)`,

    `CREATE INDEX idx_causal_evidence_source
      ON causal_evidence_link(evidence_type, evidence_id)`,

    `CREATE INDEX idx_causal_evidence_derived
      ON causal_evidence_link(derived_revision_type, derived_revision_id)`,

    `CREATE INDEX idx_origin_subject
      ON origin_moment(subject_type, subject_id, captured_at DESC)`,

    `CREATE INDEX idx_check_in_subject
      ON meaning_check_in(subject_type, subject_id, created_at DESC)`,

    `CREATE INDEX idx_projection_commitment
      ON lockscreen_projection(commitment_node_id, created_at DESC)`,

    `CREATE INDEX idx_projection_approval_revision
      ON projection_approval_event(projection_revision_id, created_at DESC)`,

    `CREATE INDEX idx_focus_window_subject
      ON focus_window(subject_node_id, start_date, end_date)`,
  ],
};
