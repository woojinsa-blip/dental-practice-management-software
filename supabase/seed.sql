-- Seed data for dental practice management
-- Note: operatories are already created in migration 20251101120000_add_operatories.sql

-- Insert dentists with conflict handling
INSERT INTO "public"."dentists" ("id", "first_name", "last_name", "email", "phone", "specialty", "created_at", "updated_at") VALUES
	('bc15397a-59e9-4008-8217-6cc65643bff4', 'Sarah', 'Johnson', 'sarah.johnson@dentalclinic.com', '555-0101', 'General Dentistry', '2025-11-02 17:41:26.809585+00', '2025-11-02 17:41:26.809585+00'),
	('33f53842-b6a8-4801-8a73-524c7dcd025f', 'Michael', 'Chen', 'michael.chen@dentalclinic.com', '555-0102', 'Orthodontics', '2025-11-02 17:41:26.809585+00', '2025-11-02 17:41:26.809585+00'),
	('9cc41ea4-0756-489b-ac75-c7c6494e020d', 'Emily', 'Rodriguez', 'emily.rodriguez@dentalclinic.com', '555-0103', 'Pediatric Dentistry', '2025-11-02 17:41:26.809585+00', '2025-11-02 17:41:26.809585+00')
ON CONFLICT (id) DO NOTHING;

-- Insert patients with conflict handling
INSERT INTO "public"."patients" ("id", "first_name", "last_name", "email", "phone", "date_of_birth", "address", "created_at", "updated_at") VALUES
	('554ba741-c06b-408c-ab63-173c1a260545', 'John', 'Doe', 'john.doe@email.com', '555-1001', '1985-06-15 00:00:00+00', '123 Main St, City, State 12345', '2025-11-02 17:41:26.809585+00', '2025-11-02 17:41:26.809585+00'),
	('ba31ea33-c03c-4ec9-b360-617b63cf1016', 'Jane', 'Smith', 'jane.smith@email.com', '555-1002', '1990-03-22 00:00:00+00', '456 Oak Ave, City, State 12345', '2025-11-02 17:41:26.809585+00', '2025-11-02 17:41:26.809585+00'),
	('5682f701-e1f6-4ec6-9330-d15c6a1ae964', 'Robert', 'Williams', 'robert.williams@email.com', '555-1003', '1978-11-08 00:00:00+00', '789 Pine Rd, City, State 12345', '2025-11-02 17:41:26.809585+00', '2025-11-02 17:41:26.809585+00'),
	('f6522077-4f20-4fd5-b40a-dadcb967bee8', 'Maria', 'Garcia', 'maria.garcia@email.com', '555-1004', '1995-09-30 00:00:00+00', '321 Elm St, City, State 12345', '2025-11-02 17:41:26.809585+00', '2025-11-02 17:41:26.809585+00'),
	('6baa799b-8aab-406b-8981-fa44057dfd40', 'David', 'Brown', 'david.brown@email.com', '555-1005', '1982-01-17 00:00:00+00', '654 Maple Dr, City, State 12345', '2025-11-02 17:41:26.809585+00', '2025-11-02 17:41:26.809585+00')
ON CONFLICT (id) DO NOTHING;

-- Get operatory IDs (since they're created in migration with different UUIDs)
DO $$
DECLARE
  op1_id UUID;
  op2_id UUID;
  op3_id UUID;
  op4_id UUID;
BEGIN
  SELECT id INTO op1_id FROM operatories WHERE operatory_number = 1;
  SELECT id INTO op2_id FROM operatories WHERE operatory_number = 2;
  SELECT id INTO op3_id FROM operatories WHERE operatory_number = 3;
  SELECT id INTO op4_id FROM operatories WHERE operatory_number = 4;

  -- Insert appointments using the actual operatory IDs
  INSERT INTO "public"."appointments" ("id", "patient_id", "dentist_id", "start_time", "end_time", "type", "status", "notes", "created_at", "updated_at", "operatory_id") VALUES
    ('ec70bb9f-c57b-419e-a54a-9fc3c4fe159e', '6baa799b-8aab-406b-8981-fa44057dfd40', '9cc41ea4-0756-489b-ac75-c7c6494e020d', '2025-11-04 01:40:00+00', '2025-11-04 05:00:00+00', 'filling', 'scheduled', '', '2025-11-04 06:05:44.848384+00', '2025-11-04 06:31:33.174673+00', op2_id),
    ('cfc5dd38-54a4-47a6-a017-b9f6ba744e66', '6baa799b-8aab-406b-8981-fa44057dfd40', 'bc15397a-59e9-4008-8217-6cc65643bff4', '2025-11-03 16:00:00+00', '2025-11-03 18:40:00+00', 'extraction', 'scheduled', '', '2025-11-04 06:03:33.219593+00', '2025-11-04 06:31:41.687719+00', op1_id)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Insert dentist schedules
INSERT INTO "public"."dentist_schedules" ("id", "dentist_id", "day_of_week", "start_time", "end_time", "is_available") VALUES
	('09f0726d-eb38-4fef-bbdc-3ac001438c72', 'bc15397a-59e9-4008-8217-6cc65643bff4', 1, '09:00', '17:00', true),
	('16c6681e-03df-4278-ab3f-7dfd3912bdb0', '33f53842-b6a8-4801-8a73-524c7dcd025f', 1, '09:00', '17:00', true),
	('28bf0810-2c4c-4129-95f5-1661a1713c99', '9cc41ea4-0756-489b-ac75-c7c6494e020d', 1, '09:00', '17:00', true),
	('c40d1e2e-b338-40cc-8855-c44bfd1a065b', 'bc15397a-59e9-4008-8217-6cc65643bff4', 2, '09:00', '17:00', true),
	('4e93c3fe-c312-4e3b-a606-116b129f8277', '33f53842-b6a8-4801-8a73-524c7dcd025f', 2, '09:00', '17:00', true),
	('0c637c94-7436-43a2-91b4-a48906a395b2', '9cc41ea4-0756-489b-ac75-c7c6494e020d', 2, '09:00', '17:00', true),
	('e37c6365-dc93-4c06-8e64-e8540fd1d8b7', 'bc15397a-59e9-4008-8217-6cc65643bff4', 3, '09:00', '17:00', true),
	('ea301bbe-b42f-4477-b739-5ae5556e2765', '33f53842-b6a8-4801-8a73-524c7dcd025f', 3, '09:00', '17:00', true),
	('4266d80b-84c3-4f19-8a78-d6dcb1cb44b0', '9cc41ea4-0756-489b-ac75-c7c6494e020d', 3, '09:00', '17:00', true),
	('c99fc72f-1b05-4d20-9515-2b6dba5725c1', 'bc15397a-59e9-4008-8217-6cc65643bff4', 4, '09:00', '17:00', true),
	('9fe8a725-c814-4d0d-be5a-1f568f59fed3', '33f53842-b6a8-4801-8a73-524c7dcd025f', 4, '09:00', '17:00', true),
	('fade027e-f000-456c-bd5e-1d509b73d34e', '9cc41ea4-0756-489b-ac75-c7c6494e020d', 4, '09:00', '17:00', true),
	('e0da4905-ef9a-426e-90cc-2d074ba2d3f3', 'bc15397a-59e9-4008-8217-6cc65643bff4', 5, '09:00', '17:00', true),
	('3a01651c-330c-422b-8ec6-a900a22019dc', '33f53842-b6a8-4801-8a73-524c7dcd025f', 5, '09:00', '17:00', true),
	('a7d2f7e6-4002-4e7d-a834-b307b310b7d0', '9cc41ea4-0756-489b-ac75-c7c6494e020d', 5, '09:00', '17:00', true)
ON CONFLICT (id) DO NOTHING;
