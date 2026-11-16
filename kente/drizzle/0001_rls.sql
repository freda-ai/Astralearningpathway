-- Kente row-level security.
--
-- The app connects as a privileged role, then runs every user request inside
-- a transaction that sets `request.jwt.claims` and switches to the
-- `authenticated` role (see src/db/index.ts). This mirrors how Supabase
-- evaluates auth.uid(), so the same policies apply locally and on Supabase.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  EXECUTE format('GRANT authenticated TO %I', current_user);
EXCEPTION WHEN others THEN NULL;
END $$;
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS app;
--> statement-breakpoint
GRANT USAGE ON SCHEMA app TO authenticated;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Identity and permission helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app.current_user_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT nullif(coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
  ), '')::uuid
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app.workspace_role(ws uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT role FROM memberships WHERE workspace_id = ws AND user_id = app.current_user_id()
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app.is_member(ws uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT app.workspace_role(ws) IS NOT NULL
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app.is_owner(ws uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT coalesce(app.workspace_role(ws) = 'owner', false)
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app.can_manage_workspace(ws uuid) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT coalesce(app.workspace_role(ws) IN ('owner', 'lead'), false)
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app.programme_workspace(pid uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT workspace_id FROM programmes WHERE id = pid
$$;
--> statement-breakpoint
-- Owners and leads see every programme in their workspace; members,
-- reviewers and viewers see programmes they are a stakeholder on.
CREATE OR REPLACE FUNCTION app.can_view_programme(pid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM programmes p
    WHERE p.id = pid
      AND (
        app.workspace_role(p.workspace_id) IN ('owner', 'lead')
        OR (
          app.workspace_role(p.workspace_id) IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM stakeholders s
            WHERE s.programme_id = p.id AND s.user_id = app.current_user_id()
          )
        )
      )
  )
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app.is_programme_stakeholder(pid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM stakeholders s WHERE s.programme_id = pid AND s.user_id = app.current_user_id()
  )
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app.can_manage_programme(pid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM programmes p
    WHERE p.id = pid AND app.workspace_role(p.workspace_id) IN ('owner', 'lead')
  )
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app.metric_programme(mid uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT programme_id FROM metrics WHERE id = mid
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app.task_programme(tid uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT programme_id FROM tasks WHERE id = tid
$$;
--> statement-breakpoint
-- True when the current user is the task's assignee or on its assigned team.
CREATE OR REPLACE FUNCTION app.is_task_assignee(tid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = tid
      AND (
        EXISTS (SELECT 1 FROM stakeholders s
                WHERE s.id = t.assignee_stakeholder_id AND s.user_id = app.current_user_id())
        OR EXISTS (SELECT 1 FROM stakeholders s
                   WHERE t.team_id IS NOT NULL AND s.team_id = t.team_id
                     AND s.user_id = app.current_user_id())
      )
  )
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app.shares_workspace(uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships a
    JOIN memberships b ON a.workspace_id = b.workspace_id
    WHERE a.user_id = app.current_user_id() AND b.user_id = uid
  )
$$;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Privileged operations
-- ---------------------------------------------------------------------------

-- Creates a workspace and makes the caller its owner.
CREATE OR REPLACE FUNCTION app.create_workspace(ws_name text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  uid uuid := app.current_user_id();
  ws uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF coalesce(trim(ws_name), '') = '' THEN RAISE EXCEPTION 'workspace name required'; END IF;
  INSERT INTO workspaces (name) VALUES (trim(ws_name)) RETURNING id INTO ws;
  INSERT INTO memberships (workspace_id, user_id, role) VALUES (ws, uid, 'owner');
  RETURN ws;
END
$$;
--> statement-breakpoint
-- Accepts a stakeholder invite. The signed-in user's email must match the
-- invited email. Returns the programme id.
CREATE OR REPLACE FUNCTION app.accept_invite(token text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  uid uuid := app.current_user_id();
  st stakeholders%ROWTYPE;
  user_email text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO st FROM stakeholders WHERE invite_token = token;
  IF NOT FOUND THEN RAISE EXCEPTION 'invite not found'; END IF;
  SELECT email INTO user_email FROM users WHERE id = uid;
  IF lower(user_email) <> lower(st.email) THEN
    RAISE EXCEPTION 'invite was sent to a different email address';
  END IF;
  UPDATE stakeholders
     SET user_id = uid, joined_at = now(), invite_token = NULL
   WHERE id = st.id;
  INSERT INTO memberships (workspace_id, user_id, role)
  VALUES (st.workspace_id, uid, st.access_role)
  ON CONFLICT (workspace_id, user_id) DO NOTHING;
  RETURN st.programme_id;
END
$$;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Integrity triggers: child rows must stay inside their programme/workspace
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app.check_stakeholder() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.workspace_id <> (SELECT workspace_id FROM programmes WHERE id = NEW.programme_id) THEN
    RAISE EXCEPTION 'stakeholder workspace does not match programme';
  END IF;
  IF NEW.team_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM teams WHERE id = NEW.team_id AND programme_id = NEW.programme_id
  ) THEN
    RAISE EXCEPTION 'team belongs to a different programme';
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
CREATE TRIGGER stakeholders_check BEFORE INSERT OR UPDATE ON stakeholders
FOR EACH ROW EXECUTE FUNCTION app.check_stakeholder();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app.check_task() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.workspace_id <> (SELECT workspace_id FROM programmes WHERE id = NEW.programme_id) THEN
    RAISE EXCEPTION 'task workspace does not match programme';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM metrics WHERE id = NEW.metric_id AND programme_id = NEW.programme_id) THEN
    RAISE EXCEPTION 'metric belongs to a different programme';
  END IF;
  IF NEW.assignee_stakeholder_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM stakeholders WHERE id = NEW.assignee_stakeholder_id AND programme_id = NEW.programme_id
  ) THEN
    RAISE EXCEPTION 'assignee belongs to a different programme';
  END IF;
  IF NEW.team_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM teams WHERE id = NEW.team_id AND programme_id = NEW.programme_id
  ) THEN
    RAISE EXCEPTION 'team belongs to a different programme';
  END IF;
  -- Assignees who are not owners/leads may only change status.
  IF TG_OP = 'UPDATE' AND app.current_user_id() IS NOT NULL
     AND NOT app.can_manage_programme(OLD.programme_id)
     AND (NEW.title, NEW.description, NEW.metric_id, NEW.programme_id, NEW.workspace_id,
          NEW.assignee_stakeholder_id, NEW.team_id, NEW.start_date, NEW.due_date, NEW.priority)
         IS DISTINCT FROM
         (OLD.title, OLD.description, OLD.metric_id, OLD.programme_id, OLD.workspace_id,
          OLD.assignee_stakeholder_id, OLD.team_id, OLD.start_date, OLD.due_date, OLD.priority)
  THEN
    RAISE EXCEPTION 'assignees can only update task status';
  END IF;
  -- completed_at follows status
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status <> 'completed') THEN
    NEW.completed_at := coalesce(NEW.completed_at, now());
  ELSIF NEW.status <> 'completed' THEN
    NEW.completed_at := NULL;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END
$$;
--> statement-breakpoint
CREATE TRIGGER tasks_check BEFORE INSERT OR UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION app.check_task();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app.check_programme_child() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.workspace_id <> (SELECT workspace_id FROM programmes WHERE id = NEW.programme_id) THEN
    RAISE EXCEPTION '% workspace does not match programme', TG_TABLE_NAME;
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint
CREATE TRIGGER teams_check BEFORE INSERT OR UPDATE ON teams
FOR EACH ROW EXECUTE FUNCTION app.check_programme_child();
--> statement-breakpoint
CREATE TRIGGER metrics_check BEFORE INSERT OR UPDATE ON metrics
FOR EACH ROW EXECUTE FUNCTION app.check_programme_child();
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
--> statement-breakpoint
REVOKE ALL ON local_credentials FROM authenticated;
--> statement-breakpoint
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO authenticated;
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE metric_updates ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE local_credentials ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

CREATE POLICY workspaces_select ON workspaces FOR SELECT TO authenticated
  USING (app.is_member(id));
--> statement-breakpoint
CREATE POLICY workspaces_update ON workspaces FOR UPDATE TO authenticated
  USING (app.is_owner(id)) WITH CHECK (app.is_owner(id));
--> statement-breakpoint

CREATE POLICY users_select ON users FOR SELECT TO authenticated
  USING (id = app.current_user_id() OR app.shares_workspace(id));
--> statement-breakpoint
CREATE POLICY users_insert ON users FOR INSERT TO authenticated
  WITH CHECK (id = app.current_user_id());
--> statement-breakpoint
CREATE POLICY users_update ON users FOR UPDATE TO authenticated
  USING (id = app.current_user_id()) WITH CHECK (id = app.current_user_id());
--> statement-breakpoint

CREATE POLICY memberships_select ON memberships FOR SELECT TO authenticated
  USING (app.is_member(workspace_id));
--> statement-breakpoint
CREATE POLICY memberships_write ON memberships FOR ALL TO authenticated
  USING (app.is_owner(workspace_id)) WITH CHECK (app.is_owner(workspace_id));
--> statement-breakpoint

-- Evaluated on the row's own columns so INSERT ... RETURNING works.
CREATE POLICY programmes_select ON programmes FOR SELECT TO authenticated
  USING (
    app.can_manage_workspace(workspace_id)
    OR (app.is_member(workspace_id) AND app.is_programme_stakeholder(id))
  );
--> statement-breakpoint
CREATE POLICY programmes_insert ON programmes FOR INSERT TO authenticated
  WITH CHECK (app.can_manage_workspace(workspace_id) AND created_by = app.current_user_id());
--> statement-breakpoint
CREATE POLICY programmes_update ON programmes FOR UPDATE TO authenticated
  USING (app.can_manage_programme(id)) WITH CHECK (app.can_manage_workspace(workspace_id));
--> statement-breakpoint
CREATE POLICY programmes_delete ON programmes FOR DELETE TO authenticated
  USING (app.is_owner(workspace_id));
--> statement-breakpoint

CREATE POLICY teams_select ON teams FOR SELECT TO authenticated
  USING (app.can_view_programme(programme_id));
--> statement-breakpoint
CREATE POLICY teams_write ON teams FOR ALL TO authenticated
  USING (app.can_manage_programme(programme_id))
  WITH CHECK (app.can_manage_programme(programme_id));
--> statement-breakpoint

CREATE POLICY stakeholders_select ON stakeholders FOR SELECT TO authenticated
  USING (app.can_view_programme(programme_id));
--> statement-breakpoint
CREATE POLICY stakeholders_write ON stakeholders FOR ALL TO authenticated
  USING (app.can_manage_programme(programme_id))
  WITH CHECK (app.can_manage_programme(programme_id));
--> statement-breakpoint

CREATE POLICY metrics_select ON metrics FOR SELECT TO authenticated
  USING (app.can_view_programme(programme_id));
--> statement-breakpoint
CREATE POLICY metrics_write ON metrics FOR ALL TO authenticated
  USING (app.can_manage_programme(programme_id))
  WITH CHECK (app.can_manage_programme(programme_id));
--> statement-breakpoint

CREATE POLICY metric_updates_select ON metric_updates FOR SELECT TO authenticated
  USING (app.can_view_programme(app.metric_programme(metric_id)));
--> statement-breakpoint
CREATE POLICY metric_updates_write ON metric_updates FOR ALL TO authenticated
  USING (app.can_manage_programme(app.metric_programme(metric_id)))
  WITH CHECK (
    app.can_manage_programme(app.metric_programme(metric_id))
    AND workspace_id = app.programme_workspace(app.metric_programme(metric_id))
  );
--> statement-breakpoint

CREATE POLICY tasks_select ON tasks FOR SELECT TO authenticated
  USING (app.can_view_programme(programme_id));
--> statement-breakpoint
CREATE POLICY tasks_insert ON tasks FOR INSERT TO authenticated
  WITH CHECK (app.can_manage_programme(programme_id));
--> statement-breakpoint
CREATE POLICY tasks_update ON tasks FOR UPDATE TO authenticated
  USING (app.can_manage_programme(programme_id) OR app.is_task_assignee(id))
  WITH CHECK (app.can_view_programme(programme_id));
--> statement-breakpoint
CREATE POLICY tasks_delete ON tasks FOR DELETE TO authenticated
  USING (app.can_manage_programme(programme_id));
--> statement-breakpoint

CREATE POLICY task_comments_select ON task_comments FOR SELECT TO authenticated
  USING (app.can_view_programme(app.task_programme(task_id)));
--> statement-breakpoint
CREATE POLICY task_comments_insert ON task_comments FOR INSERT TO authenticated
  WITH CHECK (
    author_id = app.current_user_id()
    AND app.can_view_programme(app.task_programme(task_id))
    AND app.workspace_role(workspace_id) <> 'viewer'
    AND workspace_id = app.programme_workspace(app.task_programme(task_id))
  );
--> statement-breakpoint
CREATE POLICY task_comments_delete ON task_comments FOR DELETE TO authenticated
  USING (author_id = app.current_user_id());
