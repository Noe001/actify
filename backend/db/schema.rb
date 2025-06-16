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

ActiveRecord::Schema[7.2].define(version: 2025_05_28_053438) do
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
    t.index ["user_id", "date"], name: "index_attendances_on_user_id_and_date", unique: true
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
    t.index ["user_id"], name: "index_leave_requests_on_user_id"
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
    t.index ["category"], name: "index_manuals_on_category"
    t.index ["department"], name: "index_manuals_on_department"
    t.index ["status"], name: "index_manuals_on_status"
    t.index ["user_id"], name: "index_manuals_on_user_id"
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
    t.index ["organizer_id"], name: "index_meetings_on_organizer_id"
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
    t.json "preferences"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["last_activity_at"], name: "index_workspace_memberships_on_last_activity_at"
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
    t.string "logo_url"
    t.string "primary_color", default: "#4A154B"
    t.string "accent_color", default: "#007A5A"
    t.json "settings"
    t.datetime "archived_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["invite_code"], name: "index_workspaces_on_invite_code", unique: true
    t.index ["is_public"], name: "index_workspaces_on_is_public"
    t.index ["status"], name: "index_workspaces_on_status"
    t.index ["subdomain"], name: "index_workspaces_on_subdomain", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "attendances", "users"
  add_foreign_key "leave_requests", "users"
  add_foreign_key "manuals", "users"
  add_foreign_key "organization_memberships", "organizations"
  add_foreign_key "organization_memberships", "users"
  add_foreign_key "tasks", "workspaces"
  add_foreign_key "users", "workspaces", column: "current_workspace_id"
  add_foreign_key "workspace_memberships", "users"
  add_foreign_key "workspace_memberships", "workspaces"
end
