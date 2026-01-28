import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vttfuadwmjapwxebwhen.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dGZ1YWR3bWphcHd4ZWJ3aGVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NzU5NjgsImV4cCI6MjA4NTE1MTk2OH0.6jmZfbKB_LEQoHNE1XiAM9pLn0YpNRFVcSpSmK8tJMU";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
