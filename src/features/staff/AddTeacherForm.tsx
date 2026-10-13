"use client";

import { useState, type SyntheticEvent } from "react";
import { Field, FormAlert, PasswordField, SubmitButton } from "@/features/auth/components/fields";
import { StrengthMeter } from "@/features/auth/components/StrengthMeter";
import { EMAIL_RE, USERNAME_RE } from "@/config/auth";
import { SITE } from "@/config/site";
import { apiPost, type FieldErrors } from "@/lib/api";
import { isPasswordValid } from "@/lib/password";

const EMPTY = { firstName: "", lastName: "", username: "", birthYear: "", email: "", password: "", confirmPassword: "" };
const MAX_YEAR = SITE.year - 18;

const rnd = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
const pick = (set: string, n: number) => Array.from({ length: n }, () => set[rnd(set.length)]);

/** Tasodifiy, parol siyosatiga mos parol (kriptografik tasodifiy, Fisher-Yates bilan aralashtirilgan). */
function generatePassword(): string {
  const chars = [...pick("ABCDEFGHJKLMNPQRSTUVWXYZ", 3), ...pick("abcdefghijkmnpqrstuvwxyz", 6), ...pick("23456789", 3)];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export function AddTeacherForm() {
  const [v, setV] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState<{ username: string; email: string; password: string } | null>(null);

  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => {
    setV((s) => ({ ...s, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: "" }));
  };

  async function submit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    setCreated(null);
    const next: FieldErrors = {};
    if (v.firstName.trim().length < 2) next.firstName = "Ismni kiriting";
    if (v.lastName.trim().length < 2) next.lastName = "Familyani kiriting";
    if (!USERNAME_RE.test(v.username.trim().toLowerCase())) next.username = "3-24 belgi: kichik lotin harf, raqam, nuqta yoki _";
    const y = Number(v.birthYear);
    if (!Number.isInteger(y) || y < 1940 || y > MAX_YEAR) next.birthYear = `1940 - ${MAX_YEAR} oralig'ida yil kiriting`;
    if (!EMAIL_RE.test(v.email.trim())) next.email = "Email manzil noto'g'ri";
    if (!isPasswordValid(v.password)) next.password = "Parol talablarga javob bermaydi";
    if (!v.confirmPassword || v.confirmPassword !== v.password) next.confirmPassword = "Parollar mos kelmadi";
    setErrors(next);
    if (Object.keys(next).length) return;

    setPending(true);
    const res = await apiPost<{ teacher: { username: string; email: string } }>("/admin/teachers", { ...v, birthYear: y });
    setPending(false);
    if (res.ok) {
      setCreated({ username: res.data.teacher.username, email: res.data.teacher.email, password: v.password });
      setV(EMPTY);
      return;
    }
    setErrors(res.fieldErrors);
    setFormError(Object.keys(res.fieldErrors).length ? "" : res.message);
  }

  return (
    <div className="space-y-8">
      {created && (
        <div role="status" className="border-[3px] border-ink bg-acid p-5 shadow-[6px_6px_0_0_var(--color-ink)]">
          <p className="display-cond text-2xl">Ustoz qo&apos;shildi ✓</p>
          <dl className="mt-3 grid gap-1 font-mono text-sm">
            <div>
              <dt className="inline font-bold">Username: </dt>
              <dd className="inline">{created.username}</dd>
            </div>
            <div>
              <dt className="inline font-bold">Email: </dt>
              <dd className="inline">{created.email}</dd>
            </div>
            <div>
              <dt className="inline font-bold">Parol: </dt>
              <dd className="inline">{created.password}</dd>
            </div>
          </dl>
          <p className="mt-3 text-sm">
            Parol faqat hozir ko&apos;rinadi, ustozga xavfsiz yo&apos;l bilan yetkazing. Ustoz keyin &quot;Parolni unutdingizmi?&quot; orqali o&apos;zgartira oladi.
          </p>
        </div>
      )}

      <form onSubmit={submit} noValidate className="space-y-6">
        <FormAlert>{formError}</FormAlert>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Ism" name="firstName" value={v.firstName} onChange={set("firstName")} error={errors.firstName} autoComplete="off" />
          <Field label="Familya" name="lastName" value={v.lastName} onChange={set("lastName")} error={errors.lastName} autoComplete="off" />
        </div>
        <div className="grid gap-6 sm:grid-cols-[1fr_150px]">
          <Field label="Username" name="username" value={v.username} onChange={set("username")} error={errors.username} autoCapitalize="none" spellCheck={false} autoComplete="off" />
          <Field label="Tug'ilgan yil" name="birthYear" type="number" inputMode="numeric" min={1940} max={MAX_YEAR} value={v.birthYear} onChange={set("birthYear")} error={errors.birthYear} autoComplete="off" />
        </div>
        <Field label="Email" name="email" type="email" value={v.email} onChange={set("email")} error={errors.email} autoCapitalize="none" spellCheck={false} autoComplete="off" />
        <div>
          <PasswordField label="Boshlang'ich parol" name="password" value={v.password} onChange={set("password")} error={errors.password} autoComplete="new-password" />
          <StrengthMeter password={v.password} />
          <button
            type="button"
            onClick={() => {
              const p = generatePassword();
              setV((s) => ({ ...s, password: p, confirmPassword: p }));
              setErrors((er) => ({ ...er, password: "", confirmPassword: "" }));
            }}
            className="label mt-3 border-[3px] border-ink bg-white px-3 py-2 shadow-[3px_3px_0_0_var(--color-ink)] hover:bg-acid"
          >
            Parol yaratish
          </button>
        </div>
        <PasswordField label="Parolni qayta kiriting" name="confirmPassword" value={v.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword} autoComplete="new-password" />
        <SubmitButton pending={pending}>Ustoz qo&apos;shish →</SubmitButton>
      </form>
    </div>
  );
}
