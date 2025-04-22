/*
  # Initial Schema Setup for Task Manager

  1. New Tables
    - `template_tasks`
      - `id` (uuid, primary key)
      - `text` (text, task description)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp with timezone)

    - `daily_checklists`
      - `id` (uuid, primary key)
      - `date` (date, the checklist date)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp with timezone)

    - `checklist_items`
      - `id` (uuid, primary key)
      - `checklist_id` (uuid, references daily_checklists)
      - `text` (text, task description)
      - `completed` (boolean)
      - `created_at` (timestamp with timezone)

    - `todos`
      - `id` (uuid, primary key)
      - `text` (text, todo description)
      - `deadline` (date)
      - `time` (time without timezone, optional)
      - `completed` (boolean)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamp with timezone)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create template_tasks table
CREATE TABLE template_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE template_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own template tasks"
  ON template_tasks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create daily_checklists table
CREATE TABLE daily_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(date, user_id)
);

ALTER TABLE daily_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own daily checklists"
  ON daily_checklists
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create checklist_items table
CREATE TABLE checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid REFERENCES daily_checklists ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage checklist items through their checklists"
  ON checklist_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM daily_checklists
      WHERE id = checklist_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_checklists
      WHERE id = checklist_id
      AND user_id = auth.uid()
    )
  );

-- Create todos table
CREATE TABLE todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  deadline date NOT NULL,
  time time,
  completed boolean DEFAULT false,
  user_id uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own todos"
  ON todos
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_daily_checklists_user_date ON daily_checklists(user_id, date);
CREATE INDEX idx_checklist_items_checklist ON checklist_items(checklist_id);
CREATE INDEX idx_todos_user_deadline ON todos(user_id, deadline);