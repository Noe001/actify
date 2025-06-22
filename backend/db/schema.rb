# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2025_06_21_130063) do
  create_table "active_storage_attachments", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.string "record_id", limit: 36, null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "attendances", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "user_id", null: false
    t.date "date", null: false
    t.time "check_in"
    t.time "check_out"
    t.float "total_hours"
    t.float "overtime_hours"
    t.string "status", default: "pending", null: false
    t.text "comment"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "workspace_id"
    t.index ["user_id", "date"], name: "index_attendances_on_user_id_and_date", unique: true
    t.index ["workspace_id"], name: "index_attendances_on_workspace_id"
  end

  create_table "leave_requests", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "user_id", null: false
    t.string "leave_type", null: false
    t.date "start_date", null: false
    t.date "end_date", null: false
    t.text "reason"
    t.string "status", default: "pending", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "workspace_id"
    t.index ["user_id"], name: "index_leave_requests_on_user_id"
    t.index ["workspace_id"], name: "index_leave_requests_on_workspace_id"
  end

  create_table "manuals", id: :string, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "title", null: false
    t.text "content"
    t.string "user_id", null: false
    t.string "department", null: false
    t.string "category", null: false
    t.string "access_level", default: "all", null: false
    t.string "edit_permission", default: "author", null: false
    t.string "status", default: "draft", null: false
    t.text "tags"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "workspace_id"
    t.index ["category"], name: "index_manuals_on_category"
    t.index ["department"], name: "index_manuals_on_department"
    t.index ["status"], name: "index_manuals_on_status"
    t.index ["user_id"], name: "index_manuals_on_user_id"
    t.index ["workspace_id"], name: "index_manuals_on_workspace_id"
  end

  create_table "meeting_participants", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "meeting_id", null: false
    t.string "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["meeting_id", "user_id"], name: "index_meeting_participants_on_meeting_id_and_user_id", unique: true
    t.index ["user_id"], name: "index_meeting_participants_on_user_id"
  end

  create_table "meetings", id: :string, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "title", null: false
    t.text "agenda"
    t.text "description"
    t.string "location"
    t.timestamp "start_time", null: false
    t.timestamp "end_time", null: false
    t.string "organizer_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "workspace_id"
    t.index ["organizer_id"], name: "index_meetings_on_organizer_id"
    t.index ["workspace_id"], name: "index_meetings_on_workspace_id"
  end

  create_table "organization_memberships", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "user_id", null: false
    t.string "organization_id", null: false
    t.string "role", default: "member"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id"], name: "fk_rails_715ab7f4fe"
    t.index ["user_id", "organization_id"], name: "index_organization_memberships_on_user_id_and_organization_id", unique: true
  end

  create_table "organizations", id: :string, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.string "invite_code"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["invite_code"], name: "index_organizations_on_invite_code", unique: true
  end

  create_table "tasks", id: :string, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "title", null: false
    t.text "description"
    t.date "due_date"
    t.string "status", default: "pending"
    t.string "priority", default: "medium"
    t.string "assigned_to"
    t.string "tags"
    t.string "organization_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "parent_task_id"
    t.string "workspace_id"
    t.index ["assigned_to"], name: "index_tasks_on_assigned_to"
    t.index ["organization_id"], name: "index_tasks_on_organization_id"
    t.index ["parent_task_id"], name: "index_tasks_on_parent_task_id"
    t.index ["workspace_id"], name: "index_tasks_on_workspace_id"
  end

  create_table "team_activities", id: :string, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "team_id", null: false
    t.string "user_id", null: false
    t.string "activity_type", null: false
    t.string "title", null: false
    t.text "description"
    t.json "metadata"
    t.string "target_type"
    t.string "target_id"
    t.boolean "is_read", default: false
    t.datetime "occurred_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["activity_type"], name: "index_team_activities_on_activity_type"
    t.index ["target_type", "target_id"], name: "index_team_activities_on_target"
    t.index ["target_type", "target_id"], name: "index_team_activities_on_target_type_and_target_id"
    t.index ["team_id", "occurred_at"], name: "index_team_activities_on_team_id_and_occurred_at"
    t.index ["team_id"], name: "index_team_activities_on_team_id"
    t.index ["user_id", "occurred_at"], name: "index_team_activities_on_user_id_and_occurred_at"
    t.index ["user_id"], name: "index_team_activities_on_user_id"
  end

  create_table "team_automations", id: :string, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "team_id", null: false
    t.string "created_by_id", null: false
    t.string "name", null: false
    t.text "description"
    t.string "automation_type", null: false
    t.string "status", default: "active", null: false
    t.json "trigger_config"
    t.json "conditions"
    t.json "actions"
    t.string "schedule_type"
    t.json "schedule_config"
    t.datetime "last_run_at"
    t.datetime "next_run_at"
    t.integer "run_count", default: 0
    t.integer "success_count", default: 0
    t.integer "error_count", default: 0
    t.datetime "last_success_at"
    t.datetime "last_error_at"
    t.text "last_error_message"
    t.boolean "is_enabled", default: true
    t.integer "max_retries", default: 3
    t.integer "timeout_seconds", default: 300
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_team_automations_on_created_by_id"
    t.index ["is_enabled"], name: "index_team_automations_on_is_enabled"
    t.index ["next_run_at"], name: "index_team_automations_on_next_run_at"
    t.index ["team_id", "automation_type"], name: "index_team_automations_on_team_id_and_automation_type"
    t.index ["team_id", "status"], name: "index_team_automations_on_team_id_and_status"
    t.index ["team_id"], name: "index_team_automations_on_team_id"
  end

  create_table "team_channels", id: :string, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "team_id", null: false
    t.string "created_by_id", null: false
    t.string "name", null: false
    t.text "description"
    t.string "channel_type", default: "public", null: false
    t.boolean "is_archived", default: false
    t.json "settings"
    t.datetime "last_message_at"
    t.integer "message_count", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["channel_type"], name: "index_team_channels_on_channel_type"
    t.index ["created_by_id"], name: "index_team_channels_on_created_by_id"
    t.index ["last_message_at"], name: "index_team_channels_on_last_message_at"
    t.index ["team_id", "name"], name: "index_team_channels_on_team_id_and_name", unique: true
    t.index ["team_id"], name: "index_team_channels_on_team_id"
  end

  create_table "team_goal_updates", id: :string, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "team_goal_id", null: false
    t.string "updated_by_id", null: false
    t.string "update_type", null: false
    t.decimal "old_value", precision: 10, scale: 2
    t.decimal "new_value", precision: 10, scale: 2
    t.string "old_status"
    t.string "new_status"
    t.text "notes"
    t.json "changes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["team_goal_id", "created_at"], name: "index_team_goal_updates_on_team_goal_id_and_created_at"
    t.index ["team_goal_id"], name: "index_team_goal_updates_on_team_goal_id"
    t.index ["update_type"], name: "index_team_goal_updates_on_update_type"
    t.index ["updated_by_id"], name: "index_team_goal_updates_on_updated_by_id"
  end

  create_table "team_goals", id: :string, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "team_id", null: false
    t.string "created_by_id", null: false
    t.string "title", null: false
    t.text "description"
    t.string "goal_type", default: "objective", null: false
    t.string "category", null: false
    t.string "priority", default: "medium", null: false
    t.string "status", default: "planning", null: false
    t.decimal "target_value", precision: 10, scale: 2
    t.decimal "current_value", precision: 10, scale: 2, default: "0.0"
    t.string "unit"
    t.string "measurement_method"
    t.date "start_date", null: false
    t.date "target_date", null: false
    t.date "completed_date"
    t.integer "progress_percentage", default: 0
    t.text "progress_notes"
    t.datetime "last_updated_at"
    t.string "last_updated_by_id"
    t.json "metadata"
    t.boolean "is_archived", default: false
    t.text "tags"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_team_goals_on_created_by_id"
    t.index ["is_archived"], name: "index_team_goals_on_is_archived"
    t.index ["last_updated_by_id"], name: "index_team_goals_on_last_updated_by_id"
    t.index ["progress_percentage"], name: "index_team_goals_on_progress_percentage"
    t.index ["target_date"], name: "index_team_goals_on_target_date"
    t.index ["team_id", "category"], name: "index_team_goals_on_team_id_and_category"
    t.index ["team_id", "goal_type"], name: "index_team_goals_on_team_id_and_goal_type"
    t.index ["team_id", "priority"], name: "index_team_goals_on_team_id_and_priority"
    t.index ["team_id", "status"], name: "index_team_goals_on_team_id_and_status"
    t.index ["team_id"], name: "index_team_goals_on_team_id"
  end

  create_table "team_health_metrics", id: :string, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "team_id", null: false
    t.date "measured_date", null: false
    t.decimal "overall_health_score", precision: 4, scale: 2, default: "0.0"
    t.decimal "engagement_score", precision: 4, scale: 2, default: "0.0"
    t.decimal "collaboration_score", precision: 4, scale: 2, default: "0.0"
    t.decimal "productivity_score", precision: 4, scale: 2, default: "0.0"
    t.decimal "satisfaction_score", precision: 4, scale: 2, default: "0.0"
    t.integer "total_messages", default: 0
    t.integer "active_users", default: 0
    t.integer "tasks_completed", default: 0
    t.integer "goals_achieved", default: 0
    t.integer "recognitions_given", default: 0
    t.decimal "participation_rate", precision: 5, scale: 2, default: "0.0"
    t.decimal "response_rate", precision: 5, scale: 2, default: "0.0"
    t.decimal "retention_rate", precision: 5, scale: 2, default: "0.0"
    t.decimal "task_completion_rate", precision: 5, scale: 2, default: "0.0"
    t.decimal "on_time_delivery_rate", precision: 5, scale: 2, default: "0.0"
    t.decimal "quality_score", precision: 4, scale: 2, default: "0.0"
    t.decimal "stress_level", precision: 4, scale: 2, default: "0.0"
    t.decimal "workload_balance", precision: 4, scale: 2, default: "0.0"
    t.decimal "burnout_risk", precision: 4, scale: 2, default: "0.0"
    t.decimal "learning_rate", precision: 4, scale: 2, default: "0.0"
    t.decimal "skill_development", precision: 4, scale: 2, default: "0.0"
    t.json "raw_data"
    t.json "calculation_metadata"
    t.datetime "calculated_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["calculated_at"], name: "index_team_health_metrics_on_calculated_at"
    t.index ["engagement_score"], name: "index_team_health_metrics_on_engagement_score"
    t.index ["measured_date"], name: "index_team_health_metrics_on_measured_date"
    t.index ["overall_health_score"], name: "index_team_health_metrics_on_overall_health_score"
    t.index ["team_id", "measured_date"], name: "index_team_health_metrics_on_team_id_and_measured_date", unique: true
    t.index ["team_id"], name: "index_team_health_metrics_on_team_id"
  end

  create_table "team_memberships", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "team_id", null: false
    t.string "user_id", null: false
    t.string "role", default: "member"
    t.string "status", default: "active"
    t.datetime "joined_at"
    t.datetime "left_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["role"], name: "index_team_memberships_on_role"
    t.index ["status"], name: "index_team_memberships_on_status"
    t.index ["team_id", "user_id"], name: "index_team_memberships_on_team_id_and_user_id", unique: true
    t.index ["team_id"], name: "index_team_memberships_on_team_id"
    t.index ["user_id"], name: "index_team_memberships_on_user_id"
  end

  create_table "team_message_reads", id: :string, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "team_message_id", null: false
    t.string "user_id", null: false
    t.datetime "read_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["read_at"], name: "index_team_message_reads_on_read_at"
    t.index ["team_message_id"], name: "index_team_message_reads_on_team_message_id"
    t.index ["user_id", "team_message_id"], name: "index_team_message_reads_on_user_id_and_team_message_id", unique: true
    t.index ["user_id"], name: "index_team_message_reads_on_user_id"
  end

  create_table "team_messages", id: :string, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "team_channel_id", null: false
    t.string "user_id", null: false
    t.text "content", null: false
    t.string "message_type", default: "text", null: false
    t.json "metadata"
    t.string "parent_message_id"
    t.boolean "is_edited", default: false
    t.datetime "edited_at"
    t.boolean "is_deleted", default: false
    t.datetime "deleted_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["message_type"], name: "index_team_messages_on_message_type"
    t.index ["parent_message_id"], name: "index_team_messages_on_parent_message_id"
    t.index ["team_channel_id", "created_at"], name: "index_team_messages_on_team_channel_id_and_created_at"
    t.index ["team_channel_id"], name: "index_team_messages_on_team_channel_id"
    t.index ["user_id"], name: "index_team_messages_on_user_id"
  end

  create_table "team_permissions", id: :string, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "team_id", null: false
    t.string "user_id"
    t.string "role"
    t.string "resource_type", null: false
    t.string "resource_id"
    t.string "action", null: false
    t.boolean "granted", default: true, null: false
    t.text "conditions"
    t.datetime "expires_at"
    t.string "granted_by_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at"], name: "index_team_permissions_on_expires_at"
    t.index ["granted"], name: "index_team_permissions_on_granted"
    t.index ["granted_by_id"], name: "index_team_permissions_on_granted_by_id"
    t.index ["resource_type", "action"], name: "index_team_permissions_on_resource_type_and_action"
    t.index ["team_id", "role"], name: "index_team_permissions_on_team_id_and_role"
    t.index ["team_id", "user_id"], name: "index_team_permissions_on_team_id_and_user_id"
    t.index ["team_id"], name: "index_team_permissions_on_team_id"
    t.index ["user_id"], name: "index_team_permissions_on_user_id"
  end

  create_table "team_recognitions", id: :string, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "team_id", null: false
    t.string "recipient_id", null: false
    t.string "given_by_id", null: false
    t.string "recognition_type", null: false
    t.string "category", null: false
    t.string "title", null: false
    t.text "message"
    t.string "badge_name"
    t.string "badge_color", default: "#3B82F6"
    t.string "badge_icon"
    t.integer "points_awarded", default: 0
    t.string "achievement_level"
    t.boolean "is_public", default: true
    t.boolean "is_featured", default: false
    t.string "related_resource_type"
    t.string "related_resource_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_team_recognitions_on_created_at"
    t.index ["given_by_id"], name: "index_team_recognitions_on_given_by_id"
    t.index ["is_featured"], name: "index_team_recognitions_on_is_featured"
    t.index ["is_public"], name: "index_team_recognitions_on_is_public"
    t.index ["recipient_id"], name: "index_team_recognitions_on_recipient_id"
    t.index ["team_id", "category"], name: "index_team_recognitions_on_team_id_and_category"
    t.index ["team_id", "recipient_id"], name: "index_team_recognitions_on_team_id_and_recipient_id"
    t.index ["team_id", "recognition_type"], name: "index_team_recognitions_on_team_id_and_recognition_type"
    t.index ["team_id"], name: "index_team_recognitions_on_team_id"
  end

  create_table "team_templates", id: :string, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.string "category", null: false
    t.string "template_type", default: "public", null: false
    t.string "created_by_id", null: false
    t.string "workspace_id"
    t.json "team_settings"
    t.json "default_roles"
    t.json "default_permissions"
    t.json "default_channels"
    t.json "default_goals"
    t.json "custom_fields"
    t.json "workflows"
    t.integer "usage_count", default: 0
    t.decimal "rating", precision: 3, scale: 2, default: "0.0"
    t.integer "rating_count", default: 0
    t.text "tags"
    t.boolean "is_featured", default: false
    t.boolean "is_active", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category"], name: "index_team_templates_on_category"
    t.index ["created_by_id"], name: "index_team_templates_on_created_by_id"
    t.index ["is_featured"], name: "index_team_templates_on_is_featured"
    t.index ["rating"], name: "index_team_templates_on_rating"
    t.index ["template_type"], name: "index_team_templates_on_template_type"
    t.index ["usage_count"], name: "index_team_templates_on_usage_count"
    t.index ["workspace_id", "template_type"], name: "index_team_templates_on_workspace_id_and_template_type"
    t.index ["workspace_id"], name: "index_team_templates_on_workspace_id"
  end

  create_table "teams", id: :string, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.string "workspace_id", null: false
    t.string "color", default: "#3B82F6"
    t.string "status", default: "active"
    t.string "leader_id"
    t.integer "member_count", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["leader_id"], name: "fk_rails_31ab97cd45"
    t.index ["status"], name: "index_teams_on_status"
    t.index ["workspace_id"], name: "index_teams_on_workspace_id"
  end

  create_table "users", id: :string, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "name"
    t.string "email"
    t.string "password_digest"
    t.string "role"
    t.string "status"
    t.timestamp "last_login_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "department_admin", default: false, null: false
    t.boolean "system_admin", default: false, null: false
    t.boolean "organization_admin", default: false, null: false
    t.text "avatarUrl"
    t.string "department"
    t.string "position"
    t.text "bio"
    t.string "current_workspace_id"
    t.index ["current_workspace_id"], name: "index_users_on_current_workspace_id"
    t.index ["department_admin"], name: "index_users_on_department_admin"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["organization_admin"], name: "index_users_on_organization_admin"
    t.index ["system_admin"], name: "index_users_on_system_admin"
  end

  create_table "workspace_memberships", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "user_id", null: false
    t.string "workspace_id", null: false
    t.string "role", default: "member"
    t.string "status", default: "active"
    t.datetime "joined_at"
    t.datetime "left_at"
    t.datetime "last_activity_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["joined_at"], name: "index_workspace_memberships_on_joined_at"
    t.index ["role"], name: "index_workspace_memberships_on_role"
    t.index ["status"], name: "index_workspace_memberships_on_status"
    t.index ["user_id", "workspace_id"], name: "index_workspace_memberships_on_user_id_and_workspace_id", unique: true
    t.index ["user_id"], name: "index_workspace_memberships_on_user_id"
    t.index ["workspace_id"], name: "index_workspace_memberships_on_workspace_id"
  end

  create_table "workspaces", id: :string, charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.string "subdomain", null: false
    t.string "invite_code"
    t.string "status", default: "active"
    t.boolean "is_public", default: false
    t.string "primary_color", default: "#3B82F6"
    t.string "accent_color", default: "#10B981"
    t.string "logo_url"
    t.json "settings"
    t.datetime "archived_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["invite_code"], name: "index_workspaces_on_invite_code", unique: true
    t.index ["status"], name: "index_workspaces_on_status"
    t.index ["subdomain"], name: "index_workspaces_on_subdomain", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "attendances", "users"
  add_foreign_key "attendances", "workspaces"
  add_foreign_key "leave_requests", "users"
  add_foreign_key "leave_requests", "workspaces"
  add_foreign_key "manuals", "users"
  add_foreign_key "manuals", "workspaces"
  add_foreign_key "meetings", "workspaces"
  add_foreign_key "organization_memberships", "organizations"
  add_foreign_key "organization_memberships", "users"
  add_foreign_key "tasks", "workspaces"
  add_foreign_key "team_activities", "teams"
  add_foreign_key "team_activities", "users"
  add_foreign_key "team_automations", "teams"
  add_foreign_key "team_automations", "users", column: "created_by_id"
  add_foreign_key "team_channels", "teams"
  add_foreign_key "team_channels", "users", column: "created_by_id"
  add_foreign_key "team_goal_updates", "team_goals"
  add_foreign_key "team_goal_updates", "users", column: "updated_by_id"
  add_foreign_key "team_goals", "teams"
  add_foreign_key "team_goals", "users", column: "created_by_id"
  add_foreign_key "team_goals", "users", column: "last_updated_by_id"
  add_foreign_key "team_health_metrics", "teams"
  add_foreign_key "team_memberships", "teams"
  add_foreign_key "team_memberships", "users"
  add_foreign_key "team_message_reads", "team_messages"
  add_foreign_key "team_message_reads", "users"
  add_foreign_key "team_messages", "team_channels"
  add_foreign_key "team_messages", "team_messages", column: "parent_message_id"
  add_foreign_key "team_messages", "users"
  add_foreign_key "team_permissions", "teams"
  add_foreign_key "team_permissions", "users"
  add_foreign_key "team_permissions", "users", column: "granted_by_id"
  add_foreign_key "team_recognitions", "teams"
  add_foreign_key "team_recognitions", "users", column: "given_by_id"
  add_foreign_key "team_recognitions", "users", column: "recipient_id"
  add_foreign_key "team_templates", "users", column: "created_by_id"
  add_foreign_key "team_templates", "workspaces"
  add_foreign_key "teams", "users", column: "leader_id"
  add_foreign_key "teams", "workspaces"
  add_foreign_key "users", "workspaces", column: "current_workspace_id"
  add_foreign_key "workspace_memberships", "users"
  add_foreign_key "workspace_memberships", "workspaces"
end
