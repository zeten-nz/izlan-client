"use client";

import { useState, type SyntheticEvent } from "react";
import { AuthFrame, TextLink } from "@/features/auth/components/AuthFrame";
import { Field, FieldError, FormAlert, PasswordField, SubmitButton } from "@/features/auth/components/fields";
import { OtpInput } from "@/features/auth/components/OtpInput";
import { ResendCode } from "@/features/auth/components/ResendCode";
import { StrengthMeter } from "@/features/auth/components/StrengthMeter";
import { AUTH_REDIRECT, BIRTH_YEAR_MAX, BIRTH_YEAR_MIN, EMAIL_RE, USERNAME_RE } from "@/config/auth";
import { ROUTES } from "@/config/routes";
import { apiPost, type FieldErrors } from "@/lib/api";
import { isPasswordValid } from "@/lib/password";

type Values = {
  firstName: string;
  lastName: string;
  username: string;
  birthYear: string;
  email: string;
  password: string;
  confirmPassword: string;
};
const EMPTY: Values = { firstName: "", lastName: "", username: "", birthYear: "", email: "", password: "", confirmPassword: "" };

function validate(v: Values): FieldErrors {
  const e: FieldErrors = {};
  if (v.firstName.trim().length < 2) e.firstName = "Ismni kiriting";
  if (v.lastName.trim().length < 2) e.lastName = "Familyani kiriting";
  if (!USERNAME_RE.test(v.username.trim().toLowerCase()))
    e.username = "3-24 belgi: kichik lotin harf, raqam, nuqta yoki _";
  const y = Number(v.birthYear);
  if (!Number.isInteger(y) || y < BIRTH_YEAR_MIN || y > BIRTH_YEAR_MAX)
    e.birthYear = `${BIRTH_YEAR_MIN} - ${BIRTH_YEAR_MAX} oralig'ida yil kiriting`;
  if (!EMAIL_RE.test(v.email.trim())) e.email = "Email manzil noto'g'ri";
  if (!isPasswordValid(v.password)) e.password = "Parol talablarga javob bermaydi";
  if (v.confirmPassword !== v.password || !v.confirmPassword) e.confirmPassword = "Parollar mos kelmadi";
  return e;
}

export function RegisterForm() {
  const [step, setStep] = useState<"form" | "code">("form");
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(60);
  const [code, setCode] = useState("");

  const set = (k: keyof Values) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: "" }));
  };

  async function onSubmitForm(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const next = validate(values);
    setErrors(next);
    setFormError("");
    if (Object.keys(next).length) return;

    setPending(true);
    const res = await apiPost<{ email: string; resendInSeconds: number }>("/auth/register", {
      ...values,
      birthYear: Number(values.birthYear),
    });
    setPending(false);
    if (res.ok) {
      setValues((v) => ({ ...v, email: res.data.email }));
      setResendSeconds(res.data.resendInSeconds);
      setCode("");
      setErrors({});
      setStep("code");
      return;
    }
    // Kod allaqachon yuborilgan bo'lsa (kutish vaqti), foydalanuvchini kod bosqichiga o'tkazamiz.
    if (res.status === 429 && res.retryAfterSeconds) {
      setResendSeconds(res.retryAfterSeconds);
      setStep("code");
      return;
    }
    setErrors(res.fieldErrors);
    setFormError(Object.keys(res.fieldErrors).length ? "" : res.message);
  }

  async function verify(finalCode: string) {
    if (pending) return;
    setPending(true);
    setFormError("");
    const res = await apiPost("/auth/register/verify", { email: values.email, code: finalCode });
    if (res.ok) {
      window.location.assign(AUTH_REDIRECT);
      return;
    }
    setPending(false);
    setErrors({ code: res.fieldErrors.code ?? "" });
    if (!res.fieldErrors.code) setFormError(res.message);
  }

  async function resend(): Promise<number | null> {
    setFormError("");
    const res = await apiPost<{ resendInSeconds: number }>("/auth/register/resend", { email: values.email });
    if (res.ok) {
      setCode("");
      setErrors({});
      return res.data.resendInSeconds;
    }
    setFormError(res.message);
    return res.retryAfterSeconds ?? null;
  }

  if (step === "code") {
    return (
      <AuthFrame
        sticker="Email tasdiqlash"
        title={
          <>
            Kodni
            <br />
            <span className="serif-i normal-case">kiriting.</span>
          </>
        }
        lead={
          <>
            <b className="break-all">{values.email}</b> manziliga 6 xonali kod yubordik. Xat kelmasa, &quot;Spam&quot; papkasini ham tekshiring.
          </>
        }
        footer={
          <button
            type="button"
            onClick={() => {
              setStep("form");
              setErrors({});
              setFormError("");
            }}
            className="font-bold underline decoration-[3px] underline-offset-4 hover:bg-acid"
          >
            ← Email yoki ma&apos;lumotlarni o&apos;zgartirish
          </button>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (code.length === 6) void verify(code);
            else setErrors({ code: "6 ta raqamni kiriting" });
          }}
          className="space-y-6"
        >
          <FormAlert>{formError}</FormAlert>
          <div>
            <OtpInput
              value={code}
              onChange={(v) => {
                setCode(v);
                if (errors.code) setErrors({});
              }}
              onComplete={(v) => void verify(v)}
              error={!!errors.code}
              disabled={pending}
              autoFocus
            />
            <FieldError>{errors.code}</FieldError>
          </div>
          <SubmitButton pending={pending}>Tasdiqlash va kirish →</SubmitButton>
          <ResendCode initialSeconds={resendSeconds} onResend={resend} />
        </form>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      sticker="Ro'yxatdan o'tish"
      title={
        <>
          Boshlaymiz
          <span className="text-tomato">.</span>
        </>
      }
      lead="Ma'lumotlaringizni kiriting. Emailingizga 6 xonali tasdiqlash kodi yuboramiz."
      footer={
        <p>
          Hisobingiz bormi? <TextLink href={ROUTES.login}>Kiring</TextLink>
        </p>
      }
    >
      <form onSubmit={onSubmitForm} noValidate className="space-y-6">
        <FormAlert>{formError}</FormAlert>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Ism" name="firstName" autoComplete="given-name" value={values.firstName} onChange={set("firstName")} error={errors.firstName} autoFocus />
          <Field label="Familya" name="lastName" autoComplete="family-name" value={values.lastName} onChange={set("lastName")} error={errors.lastName} />
        </div>
        <div className="grid gap-6 sm:grid-cols-[1fr_150px]">
          <Field
            label="Username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={values.username}
            onChange={set("username")}
            error={errors.username}
            hint="Kirishda ishlatiladi. Masalan: ali.valiyev"
          />
          <Field
            label="Tug'ilgan yil"
            name="birthYear"
            type="number"
            inputMode="numeric"
            autoComplete="bday-year"
            min={BIRTH_YEAR_MIN}
            max={BIRTH_YEAR_MAX}
            placeholder="2008"
            value={values.birthYear}
            onChange={set("birthYear")}
            error={errors.birthYear}
          />
        </div>
        <Field label="Email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={values.email} onChange={set("email")} error={errors.email} />
        <div>
          <PasswordField label="Parol" name="password" autoComplete="new-password" value={values.password} onChange={set("password")} error={errors.password} />
          <StrengthMeter password={values.password} />
        </div>
        <PasswordField label="Parolni qayta kiriting" name="confirmPassword" autoComplete="new-password" value={values.confirmPassword} onChange={set("confirmPassword")} error={errors.confirmPassword} />
        <SubmitButton pending={pending}>Kod yuborish →</SubmitButton>
      </form>
    </AuthFrame>
  );
}
