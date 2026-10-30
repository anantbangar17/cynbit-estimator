import { z } from "zod";

export const leadSchema = z.object({
  projectType: z.string().min(1),
  features: z.array(z.string()).max(20),
  timeline: z.string().min(1),
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number").optional().or(z.literal("")),
  website: z.string().optional(), // honeypot: real users never fill this; the route silently drops bots
});
export type LeadInput = z.infer<typeof leadSchema>;
