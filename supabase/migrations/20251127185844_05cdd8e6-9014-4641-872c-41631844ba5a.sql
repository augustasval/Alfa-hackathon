-- Enable realtime for students table for instant updates when parents add new students
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;