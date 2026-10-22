import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { gradeAttempt, type Attempt } from "@/lib/bcq-activity";

export const getStudentActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile, error } = await context.supabase.from("profiles").select("display_name, semester").eq("id", context.userId).single();
    if (error) throw new Error("Your profile could not be loaded. Please try again.");
    const attempts: Attempt[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error: readError } = await context.supabase.from("bcq_attempts").select("id, course_id, selected_option, created_at").eq("user_id", context.userId).order("created_at", { ascending: false }).order("id").range(offset, offset + 999);
      if (readError) throw new Error("Your BCQ activity could not be loaded. Please try again.");
      attempts.push(...data);
      if (data.length < 1000) break;
    }
    return { profile, attempts };
  });

export const saveBcqAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), courseId: z.string(), selectedOption: z.number().int().min(0).max(3) }).parse(input))
  .handler(async ({ data, context }) => {
    const correct = gradeAttempt({ course_id: data.courseId, selected_option: data.selectedOption });
    const { error } = await context.supabase.from("bcq_attempts").insert({ id: data.id, user_id: context.userId, course_id: data.courseId, selected_option: data.selectedOption });
    if (error) {
      if (error.code !== "23505") throw new Error("Answer not saved. Please retry.");
      const { data: existing } = await context.supabase.from("bcq_attempts").select("course_id, selected_option").eq("id", data.id).eq("user_id", context.userId).single();
      if (existing?.course_id !== data.courseId || existing?.selected_option !== data.selectedOption) throw new Error("Answer not saved. Please retry.");
    }
    return { correct };
  });

export const updateStudentProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ displayName: z.string().trim().min(1).max(80), semester: z.number().int().min(1).max(10).nullable() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("profiles").update({ display_name: data.displayName, semester: data.semester }).eq("id", context.userId);
    if (error) throw new Error("Profile not saved. Please try again.");
    return { ok: true };
  });