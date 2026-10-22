CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 display_name text NOT NULL DEFAULT '' CHECK (char_length(display_name) <= 80),
 semester integer CHECK (semester BETWEEN 1 AND 10),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE FUNCTION public.create_student_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN INSERT INTO public.profiles(id, display_name) VALUES (NEW.id, left(coalesce(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),80)); RETURN NEW; END; $$;
CREATE TRIGGER create_student_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_student_profile();
CREATE TABLE public.bcq_attempts (
 id uuid PRIMARY KEY,
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 course_id text NOT NULL,
 question_version text NOT NULL DEFAULT 'intro-v1' CHECK (question_version = 'intro-v1'),
 selected_option integer NOT NULL CHECK (selected_option BETWEEN 0 AND 3),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.bcq_attempts TO authenticated;
GRANT ALL ON public.bcq_attempts TO service_role;
ALTER TABLE public.bcq_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own BCQ attempts" ON public.bcq_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Save own BCQ attempts" ON public.bcq_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX bcq_attempts_user_created ON public.bcq_attempts(user_id, created_at DESC);