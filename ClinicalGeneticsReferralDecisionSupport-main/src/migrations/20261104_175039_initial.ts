import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('en');
  CREATE TYPE "public"."enum_clinical_pathways_category" AS ENUM('gynecology', 'obstetrics', 'reproductive-genetics');
  CREATE TYPE "public"."enum__clinical_pathways_v_version_category" AS ENUM('gynecology', 'obstetrics', 'reproductive-genetics');
  CREATE TYPE "public"."enum_clinical_criteria_lifecycle" AS ENUM('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE', 'SUPERSEDED', 'RETIRED');
  CREATE TYPE "public"."enum_clinical_criteria_pathway_slug" AS ENUM('hereditary-cancer-risk', 'preconception-carrier-screening', 'nipt-results', 'abnormal-ultrasound-findings', 'infertility-recurrent-pregnancy-loss', 'positive-family-history');
  CREATE TYPE "public"."enum_clinical_criteria_urgency_outcome" AS ENUM('urgent', 'routine', 'borderline', 'none');
  CREATE TYPE "public"."enum_clinical_criteria_validation_status" AS ENUM('validated', 'unvalidated_placeholder', 'under_review');
  CREATE TYPE "public"."enum__clinical_criteria_v_version_lifecycle" AS ENUM('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE', 'SUPERSEDED', 'RETIRED');
  CREATE TYPE "public"."enum__clinical_criteria_v_version_pathway_slug" AS ENUM('hereditary-cancer-risk', 'preconception-carrier-screening', 'nipt-results', 'abnormal-ultrasound-findings', 'infertility-recurrent-pregnancy-loss', 'positive-family-history');
  CREATE TYPE "public"."enum__clinical_criteria_v_version_urgency_outcome" AS ENUM('urgent', 'routine', 'borderline', 'none');
  CREATE TYPE "public"."enum__clinical_criteria_v_version_validation_status" AS ENUM('validated', 'unvalidated_placeholder', 'under_review');
  CREATE TYPE "public"."enum_patients_pregnancy_status" AS ENUM('pregnant_first_trimester', 'pregnant_second_trimester', 'pregnant_third_trimester', 'preconception', 'not_pregnant', 'postpartum');
  CREATE TYPE "public"."enum__patients_v_version_pregnancy_status" AS ENUM('pregnant_first_trimester', 'pregnant_second_trimester', 'pregnant_third_trimester', 'preconception', 'not_pregnant', 'postpartum');
  CREATE TYPE "public"."enum_assessments_pathway_slug" AS ENUM('hereditary-cancer-risk', 'preconception-carrier-screening', 'nipt-results', 'abnormal-ultrasound-findings', 'infertility-recurrent-pregnancy-loss', 'positive-family-history');
  CREATE TYPE "public"."enum_assessments_decision" AS ENUM('urgent_referral', 'routine_referral', 'borderline_consideration', 'no_referral_needed');
  CREATE TYPE "public"."enum_assessments_action_taken" AS ENUM('referral_generated', 'logged_no_referral', 'borderline_watchlist');
  CREATE TYPE "public"."enum_assessments_provider_role" AS ENUM('obgyn_provider', 'nurse_ma', 'genetic_counselor', 'clinic_admin');
  CREATE TYPE "public"."enum__assessments_v_version_pathway_slug" AS ENUM('hereditary-cancer-risk', 'preconception-carrier-screening', 'nipt-results', 'abnormal-ultrasound-findings', 'infertility-recurrent-pregnancy-loss', 'positive-family-history');
  CREATE TYPE "public"."enum__assessments_v_version_decision" AS ENUM('urgent_referral', 'routine_referral', 'borderline_consideration', 'no_referral_needed');
  CREATE TYPE "public"."enum__assessments_v_version_action_taken" AS ENUM('referral_generated', 'logged_no_referral', 'borderline_watchlist');
  CREATE TYPE "public"."enum__assessments_v_version_provider_role" AS ENUM('obgyn_provider', 'nurse_ma', 'genetic_counselor', 'clinic_admin');
  CREATE TYPE "public"."enum_audit_logs_actor_role" AS ENUM('OB/GYN Provider', 'Nurse / MA', 'Genetic Counselor', 'Specialist Admin', 'Clinic Administrator');
  CREATE TYPE "public"."enum_audit_logs_action_type" AS ENUM('STAFF_ACCESS_CHANGED', 'PHI_ACCESS', 'ASSESSMENT_SAVED', 'REFERRAL_GENERATED', 'CRITERIA_UPDATED', 'CRITERIA_VALIDATED', 'METRICS_EXPORT');
  CREATE TYPE "public"."enum__audit_logs_v_version_actor_role" AS ENUM('OB/GYN Provider', 'Nurse / MA', 'Genetic Counselor', 'Specialist Admin', 'Clinic Administrator');
  CREATE TYPE "public"."enum__audit_logs_v_version_action_type" AS ENUM('STAFF_ACCESS_CHANGED', 'PHI_ACCESS', 'ASSESSMENT_SAVED', 'REFERRAL_GENERATED', 'CRITERIA_UPDATED', 'CRITERIA_VALIDATED', 'METRICS_EXPORT');
  CREATE TYPE "public"."enum_users_role" AS ENUM('provider', 'admin', 'nurse');
  CREATE TYPE "public"."enum__users_v_version_role" AS ENUM('provider', 'admin', 'nurse');
  CREATE TYPE "public"."enum_clinical_workflows_state" AS ENUM('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'FINALIZED');
  CREATE TYPE "public"."enum__clinical_workflows_v_version_state" AS ENUM('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'FINALIZED');
  CREATE TYPE "public"."enum_guideline_references_lifecycle" AS ENUM('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE', 'SUPERSEDED', 'RETIRED');
  CREATE TYPE "public"."enum__guideline_references_v_version_lifecycle" AS ENUM('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE', 'SUPERSEDED', 'RETIRED');
  CREATE TYPE "public"."enum_payload_llm_instructions_entity_type" AS ENUM('collection', 'global');
  CREATE TABLE "admins_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "admins" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "admins_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "media" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"alt" varchar NOT NULL,
  	"_h_folders_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"original_filename" varchar,
  	"original_url" varchar,
  	"original_mime_type" varchar,
  	"original_filesize" numeric,
  	"original_width" numeric,
  	"original_height" numeric,
  	"original_prefix" varchar,
  	"original__objectkey" varchar,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "media_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" uuid,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "_media_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_alt" varchar NOT NULL,
  	"version__h_folders_id" uuid,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version_url" varchar,
  	"version_thumbnail_u_r_l" varchar,
  	"version_filename" varchar,
  	"version_mime_type" varchar,
  	"version_filesize" numeric,
  	"version_width" numeric,
  	"version_height" numeric,
  	"version_original_filename" varchar,
  	"version_original_url" varchar,
  	"version_original_mime_type" varchar,
  	"version_original_filesize" numeric,
  	"version_original_width" numeric,
  	"version_original_height" numeric,
  	"version_original_prefix" varchar,
  	"version_original__objectkey" varchar,
  	"version_focal_x" numeric,
  	"version_focal_y" numeric,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_media_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" uuid,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "folders" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_h_folders_id" uuid,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "folders_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "_folders_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version__h_folders_id" uuid,
  	"version_name" varchar NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_folders_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "tags" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_h_tags_id" uuid,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tags_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "_tags_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version__h_tags_id" uuid,
  	"version_name" varchar NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_tags_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "clinical_pathways_clinical_pearls" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"term" varchar NOT NULL,
  	"plain_explanation" varchar NOT NULL
  );
  
  CREATE TABLE "clinical_pathways" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"short_code" varchar NOT NULL,
  	"category" "enum_clinical_pathways_category" NOT NULL,
  	"summary" varchar NOT NULL,
  	"estimated_seconds" numeric DEFAULT 75 NOT NULL,
  	"primary_guidelines" varchar NOT NULL,
  	"default_referral_target_routine" varchar NOT NULL,
  	"default_referral_target_urgent" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "clinical_pathways_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "_clinical_pathways_v_version_clinical_pearls" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"term" varchar NOT NULL,
  	"plain_explanation" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_clinical_pathways_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar NOT NULL,
  	"version_slug" varchar NOT NULL,
  	"version_short_code" varchar NOT NULL,
  	"version_category" "enum__clinical_pathways_v_version_category" NOT NULL,
  	"version_summary" varchar NOT NULL,
  	"version_estimated_seconds" numeric DEFAULT 75 NOT NULL,
  	"version_primary_guidelines" varchar NOT NULL,
  	"version_default_referral_target_routine" varchar NOT NULL,
  	"version_default_referral_target_urgent" varchar NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_clinical_pathways_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "clinical_criteria" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"lifecycle" "enum_clinical_criteria_lifecycle",
  	"source_u_r_l" varchar,
  	"source_organization" varchar,
  	"source_document" varchar,
  	"source_version" varchar,
  	"published_at" timestamp(3) with time zone,
  	"source_section" varchar,
  	"jurisdiction" varchar,
  	"population" varchar,
  	"applicability" varchar,
  	"exclusions" varchar,
  	"evidence_level" varchar,
  	"recommendation_grade" varchar,
  	"provenance" varchar,
  	"validation_evidence" varchar,
  	"effective_from" timestamp(3) with time zone,
  	"review_due_at" timestamp(3) with time zone,
  	"simulated" boolean,
  	"change_reason" varchar,
  	"authored_by_id" uuid,
  	"approved_snapshot" jsonb,
  	"governance_history" jsonb,
  	"approval_digest" varchar,
  	"guideline_id" uuid,
  	"revision_of_id" uuid,
  	"conditions" jsonb,
  	"approval_attested" boolean DEFAULT false,
  	"title" varchar NOT NULL,
  	"code" varchar NOT NULL,
  	"pathway_slug" "enum_clinical_criteria_pathway_slug" NOT NULL,
  	"trigger_key" varchar NOT NULL,
  	"urgency_outcome" "enum_clinical_criteria_urgency_outcome" NOT NULL,
  	"referral_target" varchar NOT NULL,
  	"plain_language_rationale" varchar NOT NULL,
  	"guideline_citation" varchar NOT NULL,
  	"jargon_tip" varchar,
  	"recommended_workup" varchar,
  	"version_number" varchar DEFAULT '1.0' NOT NULL,
  	"validation_status" "enum_clinical_criteria_validation_status" DEFAULT 'unvalidated_placeholder' NOT NULL,
  	"reviewed_by_specialist" varchar,
  	"last_reviewed_at" timestamp(3) with time zone,
  	"version_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "clinical_criteria_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "_clinical_criteria_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_lifecycle" "enum__clinical_criteria_v_version_lifecycle",
  	"version_source_u_r_l" varchar,
  	"version_source_organization" varchar,
  	"version_source_document" varchar,
  	"version_source_version" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_source_section" varchar,
  	"version_jurisdiction" varchar,
  	"version_population" varchar,
  	"version_applicability" varchar,
  	"version_exclusions" varchar,
  	"version_evidence_level" varchar,
  	"version_recommendation_grade" varchar,
  	"version_provenance" varchar,
  	"version_validation_evidence" varchar,
  	"version_effective_from" timestamp(3) with time zone,
  	"version_review_due_at" timestamp(3) with time zone,
  	"version_simulated" boolean,
  	"version_change_reason" varchar,
  	"version_authored_by_id" uuid,
  	"version_approved_snapshot" jsonb,
  	"version_governance_history" jsonb,
  	"version_approval_digest" varchar,
  	"version_guideline_id" uuid,
  	"version_revision_of_id" uuid,
  	"version_conditions" jsonb,
  	"version_approval_attested" boolean DEFAULT false,
  	"version_title" varchar NOT NULL,
  	"version_code" varchar NOT NULL,
  	"version_pathway_slug" "enum__clinical_criteria_v_version_pathway_slug" NOT NULL,
  	"version_trigger_key" varchar NOT NULL,
  	"version_urgency_outcome" "enum__clinical_criteria_v_version_urgency_outcome" NOT NULL,
  	"version_referral_target" varchar NOT NULL,
  	"version_plain_language_rationale" varchar NOT NULL,
  	"version_guideline_citation" varchar NOT NULL,
  	"version_jargon_tip" varchar,
  	"version_recommended_workup" varchar,
  	"version_version_number" varchar DEFAULT '1.0' NOT NULL,
  	"version_validation_status" "enum__clinical_criteria_v_version_validation_status" DEFAULT 'unvalidated_placeholder' NOT NULL,
  	"version_reviewed_by_specialist" varchar,
  	"version_last_reviewed_at" timestamp(3) with time zone,
  	"version_version_notes" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_clinical_criteria_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "patients" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"full_name" varchar NOT NULL,
  	"mrn" varchar NOT NULL,
  	"dob" varchar NOT NULL,
  	"age" numeric NOT NULL,
  	"pregnancy_status" "enum_patients_pregnancy_status" NOT NULL,
  	"gestational_age_weeks" numeric,
  	"gravida_para" varchar,
  	"ancestry_notes" varchar,
  	"intake_summary" varchar,
  	"intake_completed_by" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "patients_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "_patients_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_full_name" varchar NOT NULL,
  	"version_mrn" varchar NOT NULL,
  	"version_dob" varchar NOT NULL,
  	"version_age" numeric NOT NULL,
  	"version_pregnancy_status" "enum__patients_v_version_pregnancy_status" NOT NULL,
  	"version_gestational_age_weeks" numeric,
  	"version_gravida_para" varchar,
  	"version_ancestry_notes" varchar,
  	"version_intake_summary" varchar,
  	"version_intake_completed_by" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_patients_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "assessments" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"patient_id" uuid,
  	"assessment_code" varchar NOT NULL,
  	"patient_mrn" varchar NOT NULL,
  	"patient_name" varchar NOT NULL,
  	"patient_age" numeric,
  	"gestational_context" varchar,
  	"pathway_slug" "enum_assessments_pathway_slug" NOT NULL,
  	"pathway_title" varchar NOT NULL,
  	"decision" "enum_assessments_decision" NOT NULL,
  	"referral_target" varchar NOT NULL,
  	"rationale" varchar NOT NULL,
  	"guideline_citations" varchar NOT NULL,
  	"triggered_criteria_codes" varchar,
  	"contains_unvalidated_criteria" boolean DEFAULT false,
  	"clinical_inputs_summary" varchar NOT NULL,
  	"structured_inputs_json" jsonb,
  	"action_taken" "enum_assessments_action_taken" NOT NULL,
  	"referral_order_summary" varchar,
  	"provider_name" varchar NOT NULL,
  	"provider_role" "enum_assessments_provider_role" DEFAULT 'obgyn_provider' NOT NULL,
  	"duration_seconds" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "assessments_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "_assessments_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_patient_id" uuid,
  	"version_assessment_code" varchar NOT NULL,
  	"version_patient_mrn" varchar NOT NULL,
  	"version_patient_name" varchar NOT NULL,
  	"version_patient_age" numeric,
  	"version_gestational_context" varchar,
  	"version_pathway_slug" "enum__assessments_v_version_pathway_slug" NOT NULL,
  	"version_pathway_title" varchar NOT NULL,
  	"version_decision" "enum__assessments_v_version_decision" NOT NULL,
  	"version_referral_target" varchar NOT NULL,
  	"version_rationale" varchar NOT NULL,
  	"version_guideline_citations" varchar NOT NULL,
  	"version_triggered_criteria_codes" varchar,
  	"version_contains_unvalidated_criteria" boolean DEFAULT false,
  	"version_clinical_inputs_summary" varchar NOT NULL,
  	"version_structured_inputs_json" jsonb,
  	"version_action_taken" "enum__assessments_v_version_action_taken" NOT NULL,
  	"version_referral_order_summary" varchar,
  	"version_provider_name" varchar NOT NULL,
  	"version_provider_role" "enum__assessments_v_version_provider_role" DEFAULT 'obgyn_provider' NOT NULL,
  	"version_duration_seconds" numeric,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_assessments_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "audit_logs" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"event_code" varchar NOT NULL,
  	"actor_name" varchar NOT NULL,
  	"actor_role" "enum_audit_logs_actor_role" NOT NULL,
  	"action_type" "enum_audit_logs_action_type" NOT NULL,
  	"resource_ref" varchar NOT NULL,
  	"details" varchar NOT NULL,
  	"encryption_verified" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "audit_logs_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "_audit_logs_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_event_code" varchar NOT NULL,
  	"version_actor_name" varchar NOT NULL,
  	"version_actor_role" "enum__audit_logs_v_version_actor_role" NOT NULL,
  	"version_action_type" "enum__audit_logs_v_version_action_type" NOT NULL,
  	"version_resource_ref" varchar NOT NULL,
  	"version_details" varchar NOT NULL,
  	"version_encryption_verified" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_audit_logs_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar NOT NULL,
  	"clinical_qualification" varchar,
  	"reviewer_qualification" varchar,
  	"reviewer_authorized" boolean DEFAULT false,
  	"reviewer_authorization_expires_at" timestamp(3) with time zone,
  	"enabled" boolean DEFAULT true,
  	"role" "enum_users_role" DEFAULT 'provider',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "users_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "_users_v_version_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"_uuid" varchar NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "_users_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_name" varchar NOT NULL,
  	"version_clinical_qualification" varchar,
  	"version_reviewer_qualification" varchar,
  	"version_reviewer_authorized" boolean DEFAULT false,
  	"version_reviewer_authorization_expires_at" timestamp(3) with time zone,
  	"version_enabled" boolean DEFAULT true,
  	"version_role" "enum__users_v_version_role" DEFAULT 'provider',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version_email" varchar NOT NULL,
  	"version_reset_password_token" varchar,
  	"version_reset_password_expiration" timestamp(3) with time zone,
  	"version_salt" varchar,
  	"version_hash" varchar,
  	"version_reset_password_requested_at" timestamp(3) with time zone,
  	"version_login_attempts" numeric DEFAULT 0,
  	"version_lock_until" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_users_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "clinical_workflows" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"workflow_key" varchar,
  	"revision" numeric,
  	"revision_key" varchar NOT NULL,
  	"state" "enum_clinical_workflows_state",
  	"patient_id" uuid,
  	"synthetic_patient_reference" varchar,
  	"pathway_slug" varchar,
  	"intake" jsonb,
  	"pedigree" jsonb,
  	"anc" jsonb,
  	"assessment_inputs" jsonb,
  	"evaluation_snapshot" jsonb,
  	"signoff" jsonb,
  	"actor_id" uuid,
  	"decision" varchar,
  	"review_note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "clinical_workflows_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "_clinical_workflows_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_workflow_key" varchar,
  	"version_revision" numeric,
  	"version_revision_key" varchar NOT NULL,
  	"version_state" "enum__clinical_workflows_v_version_state",
  	"version_patient_id" uuid,
  	"version_synthetic_patient_reference" varchar,
  	"version_pathway_slug" varchar,
  	"version_intake" jsonb,
  	"version_pedigree" jsonb,
  	"version_anc" jsonb,
  	"version_assessment_inputs" jsonb,
  	"version_evaluation_snapshot" jsonb,
  	"version_signoff" jsonb,
  	"version_actor_id" uuid,
  	"version_decision" varchar,
  	"version_review_note" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_clinical_workflows_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "guideline_references" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"title" varchar,
  	"revision_of_id" uuid,
  	"lifecycle" "enum_guideline_references_lifecycle",
  	"source_u_r_l" varchar,
  	"source_organization" varchar,
  	"source_document" varchar,
  	"source_version" varchar,
  	"published_at" timestamp(3) with time zone,
  	"source_section" varchar,
  	"jurisdiction" varchar,
  	"population" varchar,
  	"applicability" varchar,
  	"exclusions" varchar,
  	"evidence_level" varchar,
  	"recommendation_grade" varchar,
  	"provenance" varchar,
  	"validation_evidence" varchar,
  	"effective_from" timestamp(3) with time zone,
  	"review_due_at" timestamp(3) with time zone,
  	"simulated" boolean,
  	"change_reason" varchar,
  	"authored_by_id" uuid,
  	"approved_snapshot" jsonb,
  	"governance_history" jsonb,
  	"approval_digest" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "guideline_references_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "_guideline_references_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_title" varchar,
  	"version_revision_of_id" uuid,
  	"version_lifecycle" "enum__guideline_references_v_version_lifecycle",
  	"version_source_u_r_l" varchar,
  	"version_source_organization" varchar,
  	"version_source_document" varchar,
  	"version_source_version" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_source_section" varchar,
  	"version_jurisdiction" varchar,
  	"version_population" varchar,
  	"version_applicability" varchar,
  	"version_exclusions" varchar,
  	"version_evidence_level" varchar,
  	"version_recommendation_grade" varchar,
  	"version_provenance" varchar,
  	"version_validation_evidence" varchar,
  	"version_effective_from" timestamp(3) with time zone,
  	"version_review_due_at" timestamp(3) with time zone,
  	"version_simulated" boolean,
  	"version_change_reason" varchar,
  	"version_authored_by_id" uuid,
  	"version_approved_snapshot" jsonb,
  	"version_governance_history" jsonb,
  	"version_approval_digest" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_guideline_references_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "governance_commands" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"command_key" varchar NOT NULL,
  	"target" varchar NOT NULL,
  	"actor_id" uuid NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "governance_commands_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "_governance_commands_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_command_key" varchar NOT NULL,
  	"version_target" varchar NOT NULL,
  	"version_actor_id" uuid NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_governance_commands_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "payload_kv" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"media_id" uuid,
  	"folders_id" uuid,
  	"tags_id" uuid,
  	"clinical_pathways_id" uuid,
  	"clinical_criteria_id" uuid,
  	"patients_id" uuid,
  	"assessments_id" uuid,
  	"audit_logs_id" uuid,
  	"users_id" uuid,
  	"clinical_workflows_id" uuid,
  	"guideline_references_id" uuid,
  	"governance_commands_id" uuid
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_llm_instructions" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"entity_slug" varchar NOT NULL,
  	"entity_type" "enum_payload_llm_instructions_entity_type" NOT NULL,
  	"additional_instructions" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_llm_instructions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  ALTER TABLE "admins_sessions" ADD CONSTRAINT "admins_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "admins_rels" ADD CONSTRAINT "admins_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "admins_rels" ADD CONSTRAINT "admins_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "admins_rels" ADD CONSTRAINT "admins_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media__h_folders_id_folders_id_fk" FOREIGN KEY ("_h_folders_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media_rels" ADD CONSTRAINT "media_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_rels" ADD CONSTRAINT "media_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_rels" ADD CONSTRAINT "media_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_rels" ADD CONSTRAINT "media_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_media_v" ADD CONSTRAINT "_media_v_parent_id_media_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_media_v" ADD CONSTRAINT "_media_v_version__h_folders_id_folders_id_fk" FOREIGN KEY ("version__h_folders_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_media_v_rels" ADD CONSTRAINT "_media_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_media_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_media_v_rels" ADD CONSTRAINT "_media_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_media_v_rels" ADD CONSTRAINT "_media_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_media_v_rels" ADD CONSTRAINT "_media_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "folders" ADD CONSTRAINT "folders__h_folders_id_folders_id_fk" FOREIGN KEY ("_h_folders_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "folders_rels" ADD CONSTRAINT "folders_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."folders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "folders_rels" ADD CONSTRAINT "folders_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "folders_rels" ADD CONSTRAINT "folders_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_folders_v" ADD CONSTRAINT "_folders_v_parent_id_folders_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_folders_v" ADD CONSTRAINT "_folders_v_version__h_folders_id_folders_id_fk" FOREIGN KEY ("version__h_folders_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_folders_v_rels" ADD CONSTRAINT "_folders_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_folders_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_folders_v_rels" ADD CONSTRAINT "_folders_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_folders_v_rels" ADD CONSTRAINT "_folders_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tags" ADD CONSTRAINT "tags__h_tags_id_tags_id_fk" FOREIGN KEY ("_h_tags_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tags_rels" ADD CONSTRAINT "tags_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tags_rels" ADD CONSTRAINT "tags_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tags_rels" ADD CONSTRAINT "tags_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_tags_v" ADD CONSTRAINT "_tags_v_parent_id_tags_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_tags_v" ADD CONSTRAINT "_tags_v_version__h_tags_id_tags_id_fk" FOREIGN KEY ("version__h_tags_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_tags_v_rels" ADD CONSTRAINT "_tags_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_tags_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_tags_v_rels" ADD CONSTRAINT "_tags_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_tags_v_rels" ADD CONSTRAINT "_tags_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "clinical_pathways_clinical_pearls" ADD CONSTRAINT "clinical_pathways_clinical_pearls_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."clinical_pathways"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "clinical_pathways_rels" ADD CONSTRAINT "clinical_pathways_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."clinical_pathways"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "clinical_pathways_rels" ADD CONSTRAINT "clinical_pathways_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "clinical_pathways_rels" ADD CONSTRAINT "clinical_pathways_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_clinical_pathways_v_version_clinical_pearls" ADD CONSTRAINT "_clinical_pathways_v_version_clinical_pearls_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_clinical_pathways_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_clinical_pathways_v" ADD CONSTRAINT "_clinical_pathways_v_parent_id_clinical_pathways_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."clinical_pathways"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_clinical_pathways_v_rels" ADD CONSTRAINT "_clinical_pathways_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_clinical_pathways_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_clinical_pathways_v_rels" ADD CONSTRAINT "_clinical_pathways_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_clinical_pathways_v_rels" ADD CONSTRAINT "_clinical_pathways_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "clinical_criteria" ADD CONSTRAINT "clinical_criteria_authored_by_id_users_id_fk" FOREIGN KEY ("authored_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "clinical_criteria" ADD CONSTRAINT "clinical_criteria_guideline_id_guideline_references_id_fk" FOREIGN KEY ("guideline_id") REFERENCES "public"."guideline_references"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "clinical_criteria" ADD CONSTRAINT "clinical_criteria_revision_of_id_clinical_criteria_id_fk" FOREIGN KEY ("revision_of_id") REFERENCES "public"."clinical_criteria"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "clinical_criteria_rels" ADD CONSTRAINT "clinical_criteria_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."clinical_criteria"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "clinical_criteria_rels" ADD CONSTRAINT "clinical_criteria_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "clinical_criteria_rels" ADD CONSTRAINT "clinical_criteria_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_clinical_criteria_v" ADD CONSTRAINT "_clinical_criteria_v_parent_id_clinical_criteria_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."clinical_criteria"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_clinical_criteria_v" ADD CONSTRAINT "_clinical_criteria_v_version_authored_by_id_users_id_fk" FOREIGN KEY ("version_authored_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_clinical_criteria_v" ADD CONSTRAINT "_clinical_criteria_v_version_guideline_id_guideline_references_id_fk" FOREIGN KEY ("version_guideline_id") REFERENCES "public"."guideline_references"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_clinical_criteria_v" ADD CONSTRAINT "_clinical_criteria_v_version_revision_of_id_clinical_criteria_id_fk" FOREIGN KEY ("version_revision_of_id") REFERENCES "public"."clinical_criteria"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_clinical_criteria_v_rels" ADD CONSTRAINT "_clinical_criteria_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_clinical_criteria_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_clinical_criteria_v_rels" ADD CONSTRAINT "_clinical_criteria_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_clinical_criteria_v_rels" ADD CONSTRAINT "_clinical_criteria_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "patients_rels" ADD CONSTRAINT "patients_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "patients_rels" ADD CONSTRAINT "patients_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "patients_rels" ADD CONSTRAINT "patients_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_patients_v" ADD CONSTRAINT "_patients_v_parent_id_patients_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."patients"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_patients_v_rels" ADD CONSTRAINT "_patients_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_patients_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_patients_v_rels" ADD CONSTRAINT "_patients_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_patients_v_rels" ADD CONSTRAINT "_patients_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "assessments" ADD CONSTRAINT "assessments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "assessments_rels" ADD CONSTRAINT "assessments_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "assessments_rels" ADD CONSTRAINT "assessments_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "assessments_rels" ADD CONSTRAINT "assessments_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_assessments_v" ADD CONSTRAINT "_assessments_v_parent_id_assessments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."assessments"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_assessments_v" ADD CONSTRAINT "_assessments_v_version_patient_id_patients_id_fk" FOREIGN KEY ("version_patient_id") REFERENCES "public"."patients"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_assessments_v_rels" ADD CONSTRAINT "_assessments_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_assessments_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_assessments_v_rels" ADD CONSTRAINT "_assessments_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_assessments_v_rels" ADD CONSTRAINT "_assessments_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "audit_logs_rels" ADD CONSTRAINT "audit_logs_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."audit_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "audit_logs_rels" ADD CONSTRAINT "audit_logs_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "audit_logs_rels" ADD CONSTRAINT "audit_logs_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_audit_logs_v" ADD CONSTRAINT "_audit_logs_v_parent_id_audit_logs_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."audit_logs"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_audit_logs_v_rels" ADD CONSTRAINT "_audit_logs_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_audit_logs_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_audit_logs_v_rels" ADD CONSTRAINT "_audit_logs_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_audit_logs_v_rels" ADD CONSTRAINT "_audit_logs_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_users_v_version_sessions" ADD CONSTRAINT "_users_v_version_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_users_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_users_v" ADD CONSTRAINT "_users_v_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_users_v_rels" ADD CONSTRAINT "_users_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_users_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_users_v_rels" ADD CONSTRAINT "_users_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_users_v_rels" ADD CONSTRAINT "_users_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "clinical_workflows" ADD CONSTRAINT "clinical_workflows_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "clinical_workflows" ADD CONSTRAINT "clinical_workflows_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "clinical_workflows_rels" ADD CONSTRAINT "clinical_workflows_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."clinical_workflows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "clinical_workflows_rels" ADD CONSTRAINT "clinical_workflows_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "clinical_workflows_rels" ADD CONSTRAINT "clinical_workflows_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_clinical_workflows_v" ADD CONSTRAINT "_clinical_workflows_v_parent_id_clinical_workflows_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."clinical_workflows"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_clinical_workflows_v" ADD CONSTRAINT "_clinical_workflows_v_version_patient_id_patients_id_fk" FOREIGN KEY ("version_patient_id") REFERENCES "public"."patients"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_clinical_workflows_v" ADD CONSTRAINT "_clinical_workflows_v_version_actor_id_users_id_fk" FOREIGN KEY ("version_actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_clinical_workflows_v_rels" ADD CONSTRAINT "_clinical_workflows_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_clinical_workflows_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_clinical_workflows_v_rels" ADD CONSTRAINT "_clinical_workflows_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_clinical_workflows_v_rels" ADD CONSTRAINT "_clinical_workflows_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_references" ADD CONSTRAINT "guideline_references_revision_of_id_guideline_references_id_fk" FOREIGN KEY ("revision_of_id") REFERENCES "public"."guideline_references"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_references" ADD CONSTRAINT "guideline_references_authored_by_id_users_id_fk" FOREIGN KEY ("authored_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guideline_references_rels" ADD CONSTRAINT "guideline_references_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guideline_references"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_references_rels" ADD CONSTRAINT "guideline_references_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guideline_references_rels" ADD CONSTRAINT "guideline_references_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_references_v" ADD CONSTRAINT "_guideline_references_v_parent_id_guideline_references_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guideline_references"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_references_v" ADD CONSTRAINT "_guideline_references_v_version_revision_of_id_guideline_references_id_fk" FOREIGN KEY ("version_revision_of_id") REFERENCES "public"."guideline_references"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_references_v" ADD CONSTRAINT "_guideline_references_v_version_authored_by_id_users_id_fk" FOREIGN KEY ("version_authored_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guideline_references_v_rels" ADD CONSTRAINT "_guideline_references_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_guideline_references_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_references_v_rels" ADD CONSTRAINT "_guideline_references_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guideline_references_v_rels" ADD CONSTRAINT "_guideline_references_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "governance_commands" ADD CONSTRAINT "governance_commands_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "governance_commands_rels" ADD CONSTRAINT "governance_commands_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."governance_commands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "governance_commands_rels" ADD CONSTRAINT "governance_commands_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "governance_commands_rels" ADD CONSTRAINT "governance_commands_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_governance_commands_v" ADD CONSTRAINT "_governance_commands_v_parent_id_governance_commands_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."governance_commands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_governance_commands_v" ADD CONSTRAINT "_governance_commands_v_version_actor_id_users_id_fk" FOREIGN KEY ("version_actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_governance_commands_v_rels" ADD CONSTRAINT "_governance_commands_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_governance_commands_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_governance_commands_v_rels" ADD CONSTRAINT "_governance_commands_v_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_governance_commands_v_rels" ADD CONSTRAINT "_governance_commands_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_folders_fk" FOREIGN KEY ("folders_id") REFERENCES "public"."folders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_clinical_pathways_fk" FOREIGN KEY ("clinical_pathways_id") REFERENCES "public"."clinical_pathways"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_clinical_criteria_fk" FOREIGN KEY ("clinical_criteria_id") REFERENCES "public"."clinical_criteria"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_patients_fk" FOREIGN KEY ("patients_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_assessments_fk" FOREIGN KEY ("assessments_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_logs_fk" FOREIGN KEY ("audit_logs_id") REFERENCES "public"."audit_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_clinical_workflows_fk" FOREIGN KEY ("clinical_workflows_id") REFERENCES "public"."clinical_workflows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_guideline_references_fk" FOREIGN KEY ("guideline_references_id") REFERENCES "public"."guideline_references"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_governance_commands_fk" FOREIGN KEY ("governance_commands_id") REFERENCES "public"."governance_commands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_llm_instructions_rels" ADD CONSTRAINT "payload_llm_instructions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_llm_instructions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_llm_instructions_rels" ADD CONSTRAINT "payload_llm_instructions_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_llm_instructions_rels" ADD CONSTRAINT "payload_llm_instructions_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "admins_sessions_order_idx" ON "admins_sessions" USING btree ("_order");
  CREATE INDEX "admins_sessions_parent_id_idx" ON "admins_sessions" USING btree ("_parent_id");
  CREATE INDEX "admins_updated_at_idx" ON "admins" USING btree ("updated_at");
  CREATE INDEX "admins_created_at_idx" ON "admins" USING btree ("created_at");
  CREATE UNIQUE INDEX "admins_email_idx" ON "admins" USING btree ("email");
  CREATE INDEX "admins_rels_order_idx" ON "admins_rels" USING btree ("order");
  CREATE INDEX "admins_rels_parent_idx" ON "admins_rels" USING btree ("parent_id");
  CREATE INDEX "admins_rels_path_idx" ON "admins_rels" USING btree ("path");
  CREATE INDEX "admins_rels_admins_id_idx" ON "admins_rels" USING btree ("admins_id");
  CREATE INDEX "admins_rels_users_id_idx" ON "admins_rels" USING btree ("users_id");
  CREATE INDEX "media__h_folders_idx" ON "media" USING btree ("_h_folders_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_original_original_filename_idx" ON "media" USING btree ("original_filename");
  CREATE INDEX "media_rels_order_idx" ON "media_rels" USING btree ("order");
  CREATE INDEX "media_rels_parent_idx" ON "media_rels" USING btree ("parent_id");
  CREATE INDEX "media_rels_path_idx" ON "media_rels" USING btree ("path");
  CREATE INDEX "media_rels_tags_id_idx" ON "media_rels" USING btree ("tags_id");
  CREATE INDEX "media_rels_admins_id_idx" ON "media_rels" USING btree ("admins_id");
  CREATE INDEX "media_rels_users_id_idx" ON "media_rels" USING btree ("users_id");
  CREATE INDEX "_media_v_parent_idx" ON "_media_v" USING btree ("parent_id");
  CREATE INDEX "_media_v_version_version__h_folders_idx" ON "_media_v" USING btree ("version__h_folders_id");
  CREATE INDEX "_media_v_version_version_updated_at_idx" ON "_media_v" USING btree ("version_updated_at");
  CREATE INDEX "_media_v_version_version_created_at_idx" ON "_media_v" USING btree ("version_created_at");
  CREATE INDEX "_media_v_version_version_filename_idx" ON "_media_v" USING btree ("version_filename");
  CREATE INDEX "_media_v_version_original_version_original_filename_idx" ON "_media_v" USING btree ("version_original_filename");
  CREATE INDEX "_media_v_created_at_idx" ON "_media_v" USING btree ("created_at");
  CREATE INDEX "_media_v_updated_at_idx" ON "_media_v" USING btree ("updated_at");
  CREATE INDEX "_media_v_rels_order_idx" ON "_media_v_rels" USING btree ("order");
  CREATE INDEX "_media_v_rels_parent_idx" ON "_media_v_rels" USING btree ("parent_id");
  CREATE INDEX "_media_v_rels_path_idx" ON "_media_v_rels" USING btree ("path");
  CREATE INDEX "_media_v_rels_tags_id_idx" ON "_media_v_rels" USING btree ("tags_id");
  CREATE INDEX "_media_v_rels_admins_id_idx" ON "_media_v_rels" USING btree ("admins_id");
  CREATE INDEX "_media_v_rels_users_id_idx" ON "_media_v_rels" USING btree ("users_id");
  CREATE INDEX "folders__h_folders_idx" ON "folders" USING btree ("_h_folders_id");
  CREATE INDEX "folders_updated_at_idx" ON "folders" USING btree ("updated_at");
  CREATE INDEX "folders_created_at_idx" ON "folders" USING btree ("created_at");
  CREATE INDEX "folders_rels_order_idx" ON "folders_rels" USING btree ("order");
  CREATE INDEX "folders_rels_parent_idx" ON "folders_rels" USING btree ("parent_id");
  CREATE INDEX "folders_rels_path_idx" ON "folders_rels" USING btree ("path");
  CREATE INDEX "folders_rels_admins_id_idx" ON "folders_rels" USING btree ("admins_id");
  CREATE INDEX "folders_rels_users_id_idx" ON "folders_rels" USING btree ("users_id");
  CREATE INDEX "_folders_v_parent_idx" ON "_folders_v" USING btree ("parent_id");
  CREATE INDEX "_folders_v_version_version__h_folders_idx" ON "_folders_v" USING btree ("version__h_folders_id");
  CREATE INDEX "_folders_v_version_version_updated_at_idx" ON "_folders_v" USING btree ("version_updated_at");
  CREATE INDEX "_folders_v_version_version_created_at_idx" ON "_folders_v" USING btree ("version_created_at");
  CREATE INDEX "_folders_v_created_at_idx" ON "_folders_v" USING btree ("created_at");
  CREATE INDEX "_folders_v_updated_at_idx" ON "_folders_v" USING btree ("updated_at");
  CREATE INDEX "_folders_v_rels_order_idx" ON "_folders_v_rels" USING btree ("order");
  CREATE INDEX "_folders_v_rels_parent_idx" ON "_folders_v_rels" USING btree ("parent_id");
  CREATE INDEX "_folders_v_rels_path_idx" ON "_folders_v_rels" USING btree ("path");
  CREATE INDEX "_folders_v_rels_admins_id_idx" ON "_folders_v_rels" USING btree ("admins_id");
  CREATE INDEX "_folders_v_rels_users_id_idx" ON "_folders_v_rels" USING btree ("users_id");
  CREATE INDEX "tags__h_tags_idx" ON "tags" USING btree ("_h_tags_id");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  CREATE INDEX "tags_rels_order_idx" ON "tags_rels" USING btree ("order");
  CREATE INDEX "tags_rels_parent_idx" ON "tags_rels" USING btree ("parent_id");
  CREATE INDEX "tags_rels_path_idx" ON "tags_rels" USING btree ("path");
  CREATE INDEX "tags_rels_admins_id_idx" ON "tags_rels" USING btree ("admins_id");
  CREATE INDEX "tags_rels_users_id_idx" ON "tags_rels" USING btree ("users_id");
  CREATE INDEX "_tags_v_parent_idx" ON "_tags_v" USING btree ("parent_id");
  CREATE INDEX "_tags_v_version_version__h_tags_idx" ON "_tags_v" USING btree ("version__h_tags_id");
  CREATE INDEX "_tags_v_version_version_updated_at_idx" ON "_tags_v" USING btree ("version_updated_at");
  CREATE INDEX "_tags_v_version_version_created_at_idx" ON "_tags_v" USING btree ("version_created_at");
  CREATE INDEX "_tags_v_created_at_idx" ON "_tags_v" USING btree ("created_at");
  CREATE INDEX "_tags_v_updated_at_idx" ON "_tags_v" USING btree ("updated_at");
  CREATE INDEX "_tags_v_rels_order_idx" ON "_tags_v_rels" USING btree ("order");
  CREATE INDEX "_tags_v_rels_parent_idx" ON "_tags_v_rels" USING btree ("parent_id");
  CREATE INDEX "_tags_v_rels_path_idx" ON "_tags_v_rels" USING btree ("path");
  CREATE INDEX "_tags_v_rels_admins_id_idx" ON "_tags_v_rels" USING btree ("admins_id");
  CREATE INDEX "_tags_v_rels_users_id_idx" ON "_tags_v_rels" USING btree ("users_id");
  CREATE INDEX "clinical_pathways_clinical_pearls_order_idx" ON "clinical_pathways_clinical_pearls" USING btree ("_order");
  CREATE INDEX "clinical_pathways_clinical_pearls_parent_id_idx" ON "clinical_pathways_clinical_pearls" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "clinical_pathways_slug_idx" ON "clinical_pathways" USING btree ("slug");
  CREATE INDEX "clinical_pathways_updated_at_idx" ON "clinical_pathways" USING btree ("updated_at");
  CREATE INDEX "clinical_pathways_created_at_idx" ON "clinical_pathways" USING btree ("created_at");
  CREATE INDEX "clinical_pathways_rels_order_idx" ON "clinical_pathways_rels" USING btree ("order");
  CREATE INDEX "clinical_pathways_rels_parent_idx" ON "clinical_pathways_rels" USING btree ("parent_id");
  CREATE INDEX "clinical_pathways_rels_path_idx" ON "clinical_pathways_rels" USING btree ("path");
  CREATE INDEX "clinical_pathways_rels_admins_id_idx" ON "clinical_pathways_rels" USING btree ("admins_id");
  CREATE INDEX "clinical_pathways_rels_users_id_idx" ON "clinical_pathways_rels" USING btree ("users_id");
  CREATE INDEX "_clinical_pathways_v_version_clinical_pearls_order_idx" ON "_clinical_pathways_v_version_clinical_pearls" USING btree ("_order");
  CREATE INDEX "_clinical_pathways_v_version_clinical_pearls_parent_id_idx" ON "_clinical_pathways_v_version_clinical_pearls" USING btree ("_parent_id");
  CREATE INDEX "_clinical_pathways_v_parent_idx" ON "_clinical_pathways_v" USING btree ("parent_id");
  CREATE INDEX "_clinical_pathways_v_version_version_slug_idx" ON "_clinical_pathways_v" USING btree ("version_slug");
  CREATE INDEX "_clinical_pathways_v_version_version_updated_at_idx" ON "_clinical_pathways_v" USING btree ("version_updated_at");
  CREATE INDEX "_clinical_pathways_v_version_version_created_at_idx" ON "_clinical_pathways_v" USING btree ("version_created_at");
  CREATE INDEX "_clinical_pathways_v_created_at_idx" ON "_clinical_pathways_v" USING btree ("created_at");
  CREATE INDEX "_clinical_pathways_v_updated_at_idx" ON "_clinical_pathways_v" USING btree ("updated_at");
  CREATE INDEX "_clinical_pathways_v_rels_order_idx" ON "_clinical_pathways_v_rels" USING btree ("order");
  CREATE INDEX "_clinical_pathways_v_rels_parent_idx" ON "_clinical_pathways_v_rels" USING btree ("parent_id");
  CREATE INDEX "_clinical_pathways_v_rels_path_idx" ON "_clinical_pathways_v_rels" USING btree ("path");
  CREATE INDEX "_clinical_pathways_v_rels_admins_id_idx" ON "_clinical_pathways_v_rels" USING btree ("admins_id");
  CREATE INDEX "_clinical_pathways_v_rels_users_id_idx" ON "_clinical_pathways_v_rels" USING btree ("users_id");
  CREATE INDEX "clinical_criteria_authored_by_idx" ON "clinical_criteria" USING btree ("authored_by_id");
  CREATE INDEX "clinical_criteria_guideline_idx" ON "clinical_criteria" USING btree ("guideline_id");
  CREATE INDEX "clinical_criteria_revision_of_idx" ON "clinical_criteria" USING btree ("revision_of_id");
  CREATE UNIQUE INDEX "clinical_criteria_code_idx" ON "clinical_criteria" USING btree ("code");
  CREATE INDEX "clinical_criteria_pathway_slug_idx" ON "clinical_criteria" USING btree ("pathway_slug");
  CREATE INDEX "clinical_criteria_trigger_key_idx" ON "clinical_criteria" USING btree ("trigger_key");
  CREATE INDEX "clinical_criteria_updated_at_idx" ON "clinical_criteria" USING btree ("updated_at");
  CREATE INDEX "clinical_criteria_created_at_idx" ON "clinical_criteria" USING btree ("created_at");
  CREATE INDEX "clinical_criteria_rels_order_idx" ON "clinical_criteria_rels" USING btree ("order");
  CREATE INDEX "clinical_criteria_rels_parent_idx" ON "clinical_criteria_rels" USING btree ("parent_id");
  CREATE INDEX "clinical_criteria_rels_path_idx" ON "clinical_criteria_rels" USING btree ("path");
  CREATE INDEX "clinical_criteria_rels_admins_id_idx" ON "clinical_criteria_rels" USING btree ("admins_id");
  CREATE INDEX "clinical_criteria_rels_users_id_idx" ON "clinical_criteria_rels" USING btree ("users_id");
  CREATE INDEX "_clinical_criteria_v_parent_idx" ON "_clinical_criteria_v" USING btree ("parent_id");
  CREATE INDEX "_clinical_criteria_v_version_version_authored_by_idx" ON "_clinical_criteria_v" USING btree ("version_authored_by_id");
  CREATE INDEX "_clinical_criteria_v_version_version_guideline_idx" ON "_clinical_criteria_v" USING btree ("version_guideline_id");
  CREATE INDEX "_clinical_criteria_v_version_version_revision_of_idx" ON "_clinical_criteria_v" USING btree ("version_revision_of_id");
  CREATE INDEX "_clinical_criteria_v_version_version_code_idx" ON "_clinical_criteria_v" USING btree ("version_code");
  CREATE INDEX "_clinical_criteria_v_version_version_pathway_slug_idx" ON "_clinical_criteria_v" USING btree ("version_pathway_slug");
  CREATE INDEX "_clinical_criteria_v_version_version_trigger_key_idx" ON "_clinical_criteria_v" USING btree ("version_trigger_key");
  CREATE INDEX "_clinical_criteria_v_version_version_updated_at_idx" ON "_clinical_criteria_v" USING btree ("version_updated_at");
  CREATE INDEX "_clinical_criteria_v_version_version_created_at_idx" ON "_clinical_criteria_v" USING btree ("version_created_at");
  CREATE INDEX "_clinical_criteria_v_created_at_idx" ON "_clinical_criteria_v" USING btree ("created_at");
  CREATE INDEX "_clinical_criteria_v_updated_at_idx" ON "_clinical_criteria_v" USING btree ("updated_at");
  CREATE INDEX "_clinical_criteria_v_rels_order_idx" ON "_clinical_criteria_v_rels" USING btree ("order");
  CREATE INDEX "_clinical_criteria_v_rels_parent_idx" ON "_clinical_criteria_v_rels" USING btree ("parent_id");
  CREATE INDEX "_clinical_criteria_v_rels_path_idx" ON "_clinical_criteria_v_rels" USING btree ("path");
  CREATE INDEX "_clinical_criteria_v_rels_admins_id_idx" ON "_clinical_criteria_v_rels" USING btree ("admins_id");
  CREATE INDEX "_clinical_criteria_v_rels_users_id_idx" ON "_clinical_criteria_v_rels" USING btree ("users_id");
  CREATE UNIQUE INDEX "patients_mrn_idx" ON "patients" USING btree ("mrn");
  CREATE INDEX "patients_updated_at_idx" ON "patients" USING btree ("updated_at");
  CREATE INDEX "patients_created_at_idx" ON "patients" USING btree ("created_at");
  CREATE INDEX "patients_rels_order_idx" ON "patients_rels" USING btree ("order");
  CREATE INDEX "patients_rels_parent_idx" ON "patients_rels" USING btree ("parent_id");
  CREATE INDEX "patients_rels_path_idx" ON "patients_rels" USING btree ("path");
  CREATE INDEX "patients_rels_admins_id_idx" ON "patients_rels" USING btree ("admins_id");
  CREATE INDEX "patients_rels_users_id_idx" ON "patients_rels" USING btree ("users_id");
  CREATE INDEX "_patients_v_parent_idx" ON "_patients_v" USING btree ("parent_id");
  CREATE INDEX "_patients_v_version_version_mrn_idx" ON "_patients_v" USING btree ("version_mrn");
  CREATE INDEX "_patients_v_version_version_updated_at_idx" ON "_patients_v" USING btree ("version_updated_at");
  CREATE INDEX "_patients_v_version_version_created_at_idx" ON "_patients_v" USING btree ("version_created_at");
  CREATE INDEX "_patients_v_created_at_idx" ON "_patients_v" USING btree ("created_at");
  CREATE INDEX "_patients_v_updated_at_idx" ON "_patients_v" USING btree ("updated_at");
  CREATE INDEX "_patients_v_rels_order_idx" ON "_patients_v_rels" USING btree ("order");
  CREATE INDEX "_patients_v_rels_parent_idx" ON "_patients_v_rels" USING btree ("parent_id");
  CREATE INDEX "_patients_v_rels_path_idx" ON "_patients_v_rels" USING btree ("path");
  CREATE INDEX "_patients_v_rels_admins_id_idx" ON "_patients_v_rels" USING btree ("admins_id");
  CREATE INDEX "_patients_v_rels_users_id_idx" ON "_patients_v_rels" USING btree ("users_id");
  CREATE INDEX "assessments_patient_idx" ON "assessments" USING btree ("patient_id");
  CREATE UNIQUE INDEX "assessments_assessment_code_idx" ON "assessments" USING btree ("assessment_code");
  CREATE INDEX "assessments_patient_mrn_idx" ON "assessments" USING btree ("patient_mrn");
  CREATE INDEX "assessments_pathway_slug_idx" ON "assessments" USING btree ("pathway_slug");
  CREATE INDEX "assessments_updated_at_idx" ON "assessments" USING btree ("updated_at");
  CREATE INDEX "assessments_created_at_idx" ON "assessments" USING btree ("created_at");
  CREATE INDEX "assessments_rels_order_idx" ON "assessments_rels" USING btree ("order");
  CREATE INDEX "assessments_rels_parent_idx" ON "assessments_rels" USING btree ("parent_id");
  CREATE INDEX "assessments_rels_path_idx" ON "assessments_rels" USING btree ("path");
  CREATE INDEX "assessments_rels_admins_id_idx" ON "assessments_rels" USING btree ("admins_id");
  CREATE INDEX "assessments_rels_users_id_idx" ON "assessments_rels" USING btree ("users_id");
  CREATE INDEX "_assessments_v_parent_idx" ON "_assessments_v" USING btree ("parent_id");
  CREATE INDEX "_assessments_v_version_version_patient_idx" ON "_assessments_v" USING btree ("version_patient_id");
  CREATE INDEX "_assessments_v_version_version_assessment_code_idx" ON "_assessments_v" USING btree ("version_assessment_code");
  CREATE INDEX "_assessments_v_version_version_patient_mrn_idx" ON "_assessments_v" USING btree ("version_patient_mrn");
  CREATE INDEX "_assessments_v_version_version_pathway_slug_idx" ON "_assessments_v" USING btree ("version_pathway_slug");
  CREATE INDEX "_assessments_v_version_version_updated_at_idx" ON "_assessments_v" USING btree ("version_updated_at");
  CREATE INDEX "_assessments_v_version_version_created_at_idx" ON "_assessments_v" USING btree ("version_created_at");
  CREATE INDEX "_assessments_v_created_at_idx" ON "_assessments_v" USING btree ("created_at");
  CREATE INDEX "_assessments_v_updated_at_idx" ON "_assessments_v" USING btree ("updated_at");
  CREATE INDEX "_assessments_v_rels_order_idx" ON "_assessments_v_rels" USING btree ("order");
  CREATE INDEX "_assessments_v_rels_parent_idx" ON "_assessments_v_rels" USING btree ("parent_id");
  CREATE INDEX "_assessments_v_rels_path_idx" ON "_assessments_v_rels" USING btree ("path");
  CREATE INDEX "_assessments_v_rels_admins_id_idx" ON "_assessments_v_rels" USING btree ("admins_id");
  CREATE INDEX "_assessments_v_rels_users_id_idx" ON "_assessments_v_rels" USING btree ("users_id");
  CREATE INDEX "audit_logs_updated_at_idx" ON "audit_logs" USING btree ("updated_at");
  CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");
  CREATE INDEX "audit_logs_rels_order_idx" ON "audit_logs_rels" USING btree ("order");
  CREATE INDEX "audit_logs_rels_parent_idx" ON "audit_logs_rels" USING btree ("parent_id");
  CREATE INDEX "audit_logs_rels_path_idx" ON "audit_logs_rels" USING btree ("path");
  CREATE INDEX "audit_logs_rels_admins_id_idx" ON "audit_logs_rels" USING btree ("admins_id");
  CREATE INDEX "audit_logs_rels_users_id_idx" ON "audit_logs_rels" USING btree ("users_id");
  CREATE INDEX "_audit_logs_v_parent_idx" ON "_audit_logs_v" USING btree ("parent_id");
  CREATE INDEX "_audit_logs_v_version_version_updated_at_idx" ON "_audit_logs_v" USING btree ("version_updated_at");
  CREATE INDEX "_audit_logs_v_version_version_created_at_idx" ON "_audit_logs_v" USING btree ("version_created_at");
  CREATE INDEX "_audit_logs_v_created_at_idx" ON "_audit_logs_v" USING btree ("created_at");
  CREATE INDEX "_audit_logs_v_updated_at_idx" ON "_audit_logs_v" USING btree ("updated_at");
  CREATE INDEX "_audit_logs_v_rels_order_idx" ON "_audit_logs_v_rels" USING btree ("order");
  CREATE INDEX "_audit_logs_v_rels_parent_idx" ON "_audit_logs_v_rels" USING btree ("parent_id");
  CREATE INDEX "_audit_logs_v_rels_path_idx" ON "_audit_logs_v_rels" USING btree ("path");
  CREATE INDEX "_audit_logs_v_rels_admins_id_idx" ON "_audit_logs_v_rels" USING btree ("admins_id");
  CREATE INDEX "_audit_logs_v_rels_users_id_idx" ON "_audit_logs_v_rels" USING btree ("users_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "users_rels_order_idx" ON "users_rels" USING btree ("order");
  CREATE INDEX "users_rels_parent_idx" ON "users_rels" USING btree ("parent_id");
  CREATE INDEX "users_rels_path_idx" ON "users_rels" USING btree ("path");
  CREATE INDEX "users_rels_admins_id_idx" ON "users_rels" USING btree ("admins_id");
  CREATE INDEX "users_rels_users_id_idx" ON "users_rels" USING btree ("users_id");
  CREATE INDEX "_users_v_version_sessions_order_idx" ON "_users_v_version_sessions" USING btree ("_order");
  CREATE INDEX "_users_v_version_sessions_parent_id_idx" ON "_users_v_version_sessions" USING btree ("_parent_id");
  CREATE INDEX "_users_v_parent_idx" ON "_users_v" USING btree ("parent_id");
  CREATE INDEX "_users_v_version_version_updated_at_idx" ON "_users_v" USING btree ("version_updated_at");
  CREATE INDEX "_users_v_version_version_created_at_idx" ON "_users_v" USING btree ("version_created_at");
  CREATE INDEX "_users_v_version_version_email_idx" ON "_users_v" USING btree ("version_email");
  CREATE INDEX "_users_v_created_at_idx" ON "_users_v" USING btree ("created_at");
  CREATE INDEX "_users_v_updated_at_idx" ON "_users_v" USING btree ("updated_at");
  CREATE INDEX "_users_v_rels_order_idx" ON "_users_v_rels" USING btree ("order");
  CREATE INDEX "_users_v_rels_parent_idx" ON "_users_v_rels" USING btree ("parent_id");
  CREATE INDEX "_users_v_rels_path_idx" ON "_users_v_rels" USING btree ("path");
  CREATE INDEX "_users_v_rels_admins_id_idx" ON "_users_v_rels" USING btree ("admins_id");
  CREATE INDEX "_users_v_rels_users_id_idx" ON "_users_v_rels" USING btree ("users_id");
  CREATE INDEX "clinical_workflows_workflow_key_idx" ON "clinical_workflows" USING btree ("workflow_key");
  CREATE UNIQUE INDEX "clinical_workflows_revision_key_idx" ON "clinical_workflows" USING btree ("revision_key");
  CREATE INDEX "clinical_workflows_state_idx" ON "clinical_workflows" USING btree ("state");
  CREATE INDEX "clinical_workflows_patient_idx" ON "clinical_workflows" USING btree ("patient_id");
  CREATE INDEX "clinical_workflows_pathway_slug_idx" ON "clinical_workflows" USING btree ("pathway_slug");
  CREATE INDEX "clinical_workflows_actor_idx" ON "clinical_workflows" USING btree ("actor_id");
  CREATE INDEX "clinical_workflows_decision_idx" ON "clinical_workflows" USING btree ("decision");
  CREATE INDEX "clinical_workflows_updated_at_idx" ON "clinical_workflows" USING btree ("updated_at");
  CREATE INDEX "clinical_workflows_created_at_idx" ON "clinical_workflows" USING btree ("created_at");
  CREATE INDEX "clinical_workflows_rels_order_idx" ON "clinical_workflows_rels" USING btree ("order");
  CREATE INDEX "clinical_workflows_rels_parent_idx" ON "clinical_workflows_rels" USING btree ("parent_id");
  CREATE INDEX "clinical_workflows_rels_path_idx" ON "clinical_workflows_rels" USING btree ("path");
  CREATE INDEX "clinical_workflows_rels_admins_id_idx" ON "clinical_workflows_rels" USING btree ("admins_id");
  CREATE INDEX "clinical_workflows_rels_users_id_idx" ON "clinical_workflows_rels" USING btree ("users_id");
  CREATE INDEX "_clinical_workflows_v_parent_idx" ON "_clinical_workflows_v" USING btree ("parent_id");
  CREATE INDEX "_clinical_workflows_v_version_version_workflow_key_idx" ON "_clinical_workflows_v" USING btree ("version_workflow_key");
  CREATE INDEX "_clinical_workflows_v_version_version_revision_key_idx" ON "_clinical_workflows_v" USING btree ("version_revision_key");
  CREATE INDEX "_clinical_workflows_v_version_version_state_idx" ON "_clinical_workflows_v" USING btree ("version_state");
  CREATE INDEX "_clinical_workflows_v_version_version_patient_idx" ON "_clinical_workflows_v" USING btree ("version_patient_id");
  CREATE INDEX "_clinical_workflows_v_version_version_pathway_slug_idx" ON "_clinical_workflows_v" USING btree ("version_pathway_slug");
  CREATE INDEX "_clinical_workflows_v_version_version_actor_idx" ON "_clinical_workflows_v" USING btree ("version_actor_id");
  CREATE INDEX "_clinical_workflows_v_version_version_decision_idx" ON "_clinical_workflows_v" USING btree ("version_decision");
  CREATE INDEX "_clinical_workflows_v_version_version_updated_at_idx" ON "_clinical_workflows_v" USING btree ("version_updated_at");
  CREATE INDEX "_clinical_workflows_v_version_version_created_at_idx" ON "_clinical_workflows_v" USING btree ("version_created_at");
  CREATE INDEX "_clinical_workflows_v_created_at_idx" ON "_clinical_workflows_v" USING btree ("created_at");
  CREATE INDEX "_clinical_workflows_v_updated_at_idx" ON "_clinical_workflows_v" USING btree ("updated_at");
  CREATE INDEX "_clinical_workflows_v_rels_order_idx" ON "_clinical_workflows_v_rels" USING btree ("order");
  CREATE INDEX "_clinical_workflows_v_rels_parent_idx" ON "_clinical_workflows_v_rels" USING btree ("parent_id");
  CREATE INDEX "_clinical_workflows_v_rels_path_idx" ON "_clinical_workflows_v_rels" USING btree ("path");
  CREATE INDEX "_clinical_workflows_v_rels_admins_id_idx" ON "_clinical_workflows_v_rels" USING btree ("admins_id");
  CREATE INDEX "_clinical_workflows_v_rels_users_id_idx" ON "_clinical_workflows_v_rels" USING btree ("users_id");
  CREATE INDEX "guideline_references_revision_of_idx" ON "guideline_references" USING btree ("revision_of_id");
  CREATE INDEX "guideline_references_authored_by_idx" ON "guideline_references" USING btree ("authored_by_id");
  CREATE INDEX "guideline_references_updated_at_idx" ON "guideline_references" USING btree ("updated_at");
  CREATE INDEX "guideline_references_created_at_idx" ON "guideline_references" USING btree ("created_at");
  CREATE INDEX "guideline_references_rels_order_idx" ON "guideline_references_rels" USING btree ("order");
  CREATE INDEX "guideline_references_rels_parent_idx" ON "guideline_references_rels" USING btree ("parent_id");
  CREATE INDEX "guideline_references_rels_path_idx" ON "guideline_references_rels" USING btree ("path");
  CREATE INDEX "guideline_references_rels_admins_id_idx" ON "guideline_references_rels" USING btree ("admins_id");
  CREATE INDEX "guideline_references_rels_users_id_idx" ON "guideline_references_rels" USING btree ("users_id");
  CREATE INDEX "_guideline_references_v_parent_idx" ON "_guideline_references_v" USING btree ("parent_id");
  CREATE INDEX "_guideline_references_v_version_version_revision_of_idx" ON "_guideline_references_v" USING btree ("version_revision_of_id");
  CREATE INDEX "_guideline_references_v_version_version_authored_by_idx" ON "_guideline_references_v" USING btree ("version_authored_by_id");
  CREATE INDEX "_guideline_references_v_version_version_updated_at_idx" ON "_guideline_references_v" USING btree ("version_updated_at");
  CREATE INDEX "_guideline_references_v_version_version_created_at_idx" ON "_guideline_references_v" USING btree ("version_created_at");
  CREATE INDEX "_guideline_references_v_created_at_idx" ON "_guideline_references_v" USING btree ("created_at");
  CREATE INDEX "_guideline_references_v_updated_at_idx" ON "_guideline_references_v" USING btree ("updated_at");
  CREATE INDEX "_guideline_references_v_rels_order_idx" ON "_guideline_references_v_rels" USING btree ("order");
  CREATE INDEX "_guideline_references_v_rels_parent_idx" ON "_guideline_references_v_rels" USING btree ("parent_id");
  CREATE INDEX "_guideline_references_v_rels_path_idx" ON "_guideline_references_v_rels" USING btree ("path");
  CREATE INDEX "_guideline_references_v_rels_admins_id_idx" ON "_guideline_references_v_rels" USING btree ("admins_id");
  CREATE INDEX "_guideline_references_v_rels_users_id_idx" ON "_guideline_references_v_rels" USING btree ("users_id");
  CREATE UNIQUE INDEX "governance_commands_command_key_idx" ON "governance_commands" USING btree ("command_key");
  CREATE INDEX "governance_commands_actor_idx" ON "governance_commands" USING btree ("actor_id");
  CREATE INDEX "governance_commands_updated_at_idx" ON "governance_commands" USING btree ("updated_at");
  CREATE INDEX "governance_commands_created_at_idx" ON "governance_commands" USING btree ("created_at");
  CREATE INDEX "governance_commands_rels_order_idx" ON "governance_commands_rels" USING btree ("order");
  CREATE INDEX "governance_commands_rels_parent_idx" ON "governance_commands_rels" USING btree ("parent_id");
  CREATE INDEX "governance_commands_rels_path_idx" ON "governance_commands_rels" USING btree ("path");
  CREATE INDEX "governance_commands_rels_admins_id_idx" ON "governance_commands_rels" USING btree ("admins_id");
  CREATE INDEX "governance_commands_rels_users_id_idx" ON "governance_commands_rels" USING btree ("users_id");
  CREATE INDEX "_governance_commands_v_parent_idx" ON "_governance_commands_v" USING btree ("parent_id");
  CREATE INDEX "_governance_commands_v_version_version_command_key_idx" ON "_governance_commands_v" USING btree ("version_command_key");
  CREATE INDEX "_governance_commands_v_version_version_actor_idx" ON "_governance_commands_v" USING btree ("version_actor_id");
  CREATE INDEX "_governance_commands_v_version_version_updated_at_idx" ON "_governance_commands_v" USING btree ("version_updated_at");
  CREATE INDEX "_governance_commands_v_version_version_created_at_idx" ON "_governance_commands_v" USING btree ("version_created_at");
  CREATE INDEX "_governance_commands_v_created_at_idx" ON "_governance_commands_v" USING btree ("created_at");
  CREATE INDEX "_governance_commands_v_updated_at_idx" ON "_governance_commands_v" USING btree ("updated_at");
  CREATE INDEX "_governance_commands_v_rels_order_idx" ON "_governance_commands_v_rels" USING btree ("order");
  CREATE INDEX "_governance_commands_v_rels_parent_idx" ON "_governance_commands_v_rels" USING btree ("parent_id");
  CREATE INDEX "_governance_commands_v_rels_path_idx" ON "_governance_commands_v_rels" USING btree ("path");
  CREATE INDEX "_governance_commands_v_rels_admins_id_idx" ON "_governance_commands_v_rels" USING btree ("admins_id");
  CREATE INDEX "_governance_commands_v_rels_users_id_idx" ON "_governance_commands_v_rels" USING btree ("users_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_admins_id_idx" ON "payload_locked_documents_rels" USING btree ("admins_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_folders_id_idx" ON "payload_locked_documents_rels" USING btree ("folders_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");
  CREATE INDEX "payload_locked_documents_rels_clinical_pathways_id_idx" ON "payload_locked_documents_rels" USING btree ("clinical_pathways_id");
  CREATE INDEX "payload_locked_documents_rels_clinical_criteria_id_idx" ON "payload_locked_documents_rels" USING btree ("clinical_criteria_id");
  CREATE INDEX "payload_locked_documents_rels_patients_id_idx" ON "payload_locked_documents_rels" USING btree ("patients_id");
  CREATE INDEX "payload_locked_documents_rels_assessments_id_idx" ON "payload_locked_documents_rels" USING btree ("assessments_id");
  CREATE INDEX "payload_locked_documents_rels_audit_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_logs_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_clinical_workflows_id_idx" ON "payload_locked_documents_rels" USING btree ("clinical_workflows_id");
  CREATE INDEX "payload_locked_documents_rels_guideline_references_id_idx" ON "payload_locked_documents_rels" USING btree ("guideline_references_id");
  CREATE INDEX "payload_locked_documents_rels_governance_commands_id_idx" ON "payload_locked_documents_rels" USING btree ("governance_commands_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_admins_id_idx" ON "payload_preferences_rels" USING btree ("admins_id");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "payload_llm_instructions_entity_slug_idx" ON "payload_llm_instructions" USING btree ("entity_slug");
  CREATE INDEX "payload_llm_instructions_updated_at_idx" ON "payload_llm_instructions" USING btree ("updated_at");
  CREATE INDEX "payload_llm_instructions_created_at_idx" ON "payload_llm_instructions" USING btree ("created_at");
  CREATE INDEX "payload_llm_instructions_rels_order_idx" ON "payload_llm_instructions_rels" USING btree ("order");
  CREATE INDEX "payload_llm_instructions_rels_parent_idx" ON "payload_llm_instructions_rels" USING btree ("parent_id");
  CREATE INDEX "payload_llm_instructions_rels_path_idx" ON "payload_llm_instructions_rels" USING btree ("path");
  CREATE INDEX "payload_llm_instructions_rels_admins_id_idx" ON "payload_llm_instructions_rels" USING btree ("admins_id");
  CREATE INDEX "payload_llm_instructions_rels_users_id_idx" ON "payload_llm_instructions_rels" USING btree ("users_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "admins_sessions" CASCADE;
  DROP TABLE "admins" CASCADE;
  DROP TABLE "admins_rels" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_rels" CASCADE;
  DROP TABLE "_media_v" CASCADE;
  DROP TABLE "_media_v_rels" CASCADE;
  DROP TABLE "folders" CASCADE;
  DROP TABLE "folders_rels" CASCADE;
  DROP TABLE "_folders_v" CASCADE;
  DROP TABLE "_folders_v_rels" CASCADE;
  DROP TABLE "tags" CASCADE;
  DROP TABLE "tags_rels" CASCADE;
  DROP TABLE "_tags_v" CASCADE;
  DROP TABLE "_tags_v_rels" CASCADE;
  DROP TABLE "clinical_pathways_clinical_pearls" CASCADE;
  DROP TABLE "clinical_pathways" CASCADE;
  DROP TABLE "clinical_pathways_rels" CASCADE;
  DROP TABLE "_clinical_pathways_v_version_clinical_pearls" CASCADE;
  DROP TABLE "_clinical_pathways_v" CASCADE;
  DROP TABLE "_clinical_pathways_v_rels" CASCADE;
  DROP TABLE "clinical_criteria" CASCADE;
  DROP TABLE "clinical_criteria_rels" CASCADE;
  DROP TABLE "_clinical_criteria_v" CASCADE;
  DROP TABLE "_clinical_criteria_v_rels" CASCADE;
  DROP TABLE "patients" CASCADE;
  DROP TABLE "patients_rels" CASCADE;
  DROP TABLE "_patients_v" CASCADE;
  DROP TABLE "_patients_v_rels" CASCADE;
  DROP TABLE "assessments" CASCADE;
  DROP TABLE "assessments_rels" CASCADE;
  DROP TABLE "_assessments_v" CASCADE;
  DROP TABLE "_assessments_v_rels" CASCADE;
  DROP TABLE "audit_logs" CASCADE;
  DROP TABLE "audit_logs_rels" CASCADE;
  DROP TABLE "_audit_logs_v" CASCADE;
  DROP TABLE "_audit_logs_v_rels" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "users_rels" CASCADE;
  DROP TABLE "_users_v_version_sessions" CASCADE;
  DROP TABLE "_users_v" CASCADE;
  DROP TABLE "_users_v_rels" CASCADE;
  DROP TABLE "clinical_workflows" CASCADE;
  DROP TABLE "clinical_workflows_rels" CASCADE;
  DROP TABLE "_clinical_workflows_v" CASCADE;
  DROP TABLE "_clinical_workflows_v_rels" CASCADE;
  DROP TABLE "guideline_references" CASCADE;
  DROP TABLE "guideline_references_rels" CASCADE;
  DROP TABLE "_guideline_references_v" CASCADE;
  DROP TABLE "_guideline_references_v_rels" CASCADE;
  DROP TABLE "governance_commands" CASCADE;
  DROP TABLE "governance_commands_rels" CASCADE;
  DROP TABLE "_governance_commands_v" CASCADE;
  DROP TABLE "_governance_commands_v_rels" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "payload_llm_instructions" CASCADE;
  DROP TABLE "payload_llm_instructions_rels" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_clinical_pathways_category";
  DROP TYPE "public"."enum__clinical_pathways_v_version_category";
  DROP TYPE "public"."enum_clinical_criteria_lifecycle";
  DROP TYPE "public"."enum_clinical_criteria_pathway_slug";
  DROP TYPE "public"."enum_clinical_criteria_urgency_outcome";
  DROP TYPE "public"."enum_clinical_criteria_validation_status";
  DROP TYPE "public"."enum__clinical_criteria_v_version_lifecycle";
  DROP TYPE "public"."enum__clinical_criteria_v_version_pathway_slug";
  DROP TYPE "public"."enum__clinical_criteria_v_version_urgency_outcome";
  DROP TYPE "public"."enum__clinical_criteria_v_version_validation_status";
  DROP TYPE "public"."enum_patients_pregnancy_status";
  DROP TYPE "public"."enum__patients_v_version_pregnancy_status";
  DROP TYPE "public"."enum_assessments_pathway_slug";
  DROP TYPE "public"."enum_assessments_decision";
  DROP TYPE "public"."enum_assessments_action_taken";
  DROP TYPE "public"."enum_assessments_provider_role";
  DROP TYPE "public"."enum__assessments_v_version_pathway_slug";
  DROP TYPE "public"."enum__assessments_v_version_decision";
  DROP TYPE "public"."enum__assessments_v_version_action_taken";
  DROP TYPE "public"."enum__assessments_v_version_provider_role";
  DROP TYPE "public"."enum_audit_logs_actor_role";
  DROP TYPE "public"."enum_audit_logs_action_type";
  DROP TYPE "public"."enum__audit_logs_v_version_actor_role";
  DROP TYPE "public"."enum__audit_logs_v_version_action_type";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum__users_v_version_role";
  DROP TYPE "public"."enum_clinical_workflows_state";
  DROP TYPE "public"."enum__clinical_workflows_v_version_state";
  DROP TYPE "public"."enum_guideline_references_lifecycle";
  DROP TYPE "public"."enum__guideline_references_v_version_lifecycle";
  DROP TYPE "public"."enum_payload_llm_instructions_entity_type";`)
}
