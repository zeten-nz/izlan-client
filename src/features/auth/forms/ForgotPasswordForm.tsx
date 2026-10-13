"use client";

import Link from "next/link";
import { useState, type SyntheticEvent } from "react";
import { AuthFrame, TextLink } from "@/features/auth/components/AuthFrame";
import { Field, FieldError, FormAlert, PasswordField, SubmitButton } from "@/features/auth/components/fields";
import { OtpInput } from "@/features/auth/components/OtpInput";
import { ResendCode } from "@/features/auth/components/ResendCode";
import { StrengthMeter } from "@/features/auth/components/StrengthMeter";
import { buttonClasses } from "@/components/ui/Button";
import { EMAIL_RE } from "@/config/auth";
import { ROUTES } from "@/config/routes";
import { apiPost, type FieldErrors } from "@/lib/api";
import { isPasswordValid } from "@/lib/password";

type Step = "email" | "reset" | "done";

export function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(60);

  async function sendCode(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    if (!EMAIL_RE.test(email.trim())) {
      setErrors({ email: "Email manzil noto'g'ri" });
      return;
    }
    setErrors({});
    setPending(true);
    const res = await apiPost<{ resendInSeconds: number }>("/auth/forgot", { email });
    setPending(false);
    if (res.ok) {
      setResendSeconds(res.data.resendInSeconds);
      setStep("reset");
      return;
    }
    setErrors(res.fieldErrors);
    setFormError(Object.keys(res.fieldErrors).length ? "" : res.message);
  }

  async function resend(): Promise<number | null> {
    setFormError("");
    const res = await apiPost<{ resendInSeconds: number }>("/auth/forgot", { email });
    if (res.ok) {
      setCode("");
      return res.data.resendInSeconds;
    }
    setFormError(res.message);
    return null;
  }

  async function reset(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const next: FieldErrors = {};
    if (code.length !== 6) next.code = "6 ta raqamni kiriting";
    if (!isPasswordValid(password)) next.password = "Parol talablarga javob bermaydi";
    if (!confirmPassword || confirmPassword !== password) next.confirmPassword = "Parollar mos kelmadi";
    setErrors(next);
    if (Object.keys(next).length) return;

    setPending(true);
    const res = await apiPost("/auth/reset", { email, code, password, confirmPassword });
    setPending(false);
    if (res.ok) {
      setStep("done");
      return;
    }
    setErrors(res.fieldErrors);
    setFormError(Object.keys(res.fieldErrors).length ? "" : res.message);
  }

  if (step === "done") {
    return (
      <AuthFrame
        sticker="Tayyor"
        title={
          <>
            Parol
            <br />
            <span className="serif-i normal-case">yangilandi.</span>
          </>
        }
        lead="Xavfsizlik uchun barcha qurilmalardan chiqarildingiz. Yangi parol bilan kiring."
      >
        <Link href={ROUTES.login} className={buttonClasses("acid", "lg", "w-full")}>
          Kirishga o&apos;tish →
        </Link>
      </AuthFrame>
    );
  }

  if (step === "reset") {
    return (
      <AuthFrame
        sticker="Yangi parol"
        title={
          <>
            Kod va
            <br />
            <span className="serif-i normal-case">yangi parol.</span>
          </>
        }
        lead={
          <>
            <b className="break-all">{email}</b> manzili ro&apos;yxatdan o&apos;tgan bo&apos;lsa, unga 6 xonali kod yubordik.
          </>
        }
        footer={
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setErrors({});
              setFormError("");
            }}
            className="font-bold underline decoration-[3px] underline-offset-4 hover:bg-acid"
          >
            ← Emailni o&apos;zgartirish
          </button>
        }
      >
        <form onSubmit={reset} noValidate className="space-y-6">
          <FormAlert>{formError}</FormAlert>
          <div>
            <span className="label mb-2 block">Tasdiqlash kodi</span>
            <OtpInput
              value={code}
              onChange={(v) => {
                setCode(v);
                if (errors.code) setErrors((er) => ({ ...er, code: "" }));
              }}
              error={!!errors.code}
              disabled={pending}
              autoFocus
            />
            <FieldError>{errors.code}</FieldError>
          </div>
          <div>
            <PasswordField
              label="Yangi parol"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((er) => ({ ...er, password: "" }));
              }}
              error={errors.password}
            />
            <StrengthMeter password={password} />
          </div>
          <PasswordField
            label="Yangi parolni qayta kiriting"
            name="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors((er) => ({ ...er, confirmPassword: "" }));
            }}
            error={errors.confirmPassword}
          />
          <SubmitButton pending={pending}>Parolni yangilash →</SubmitButton>
          <ResendCode initialSeconds={resendSeconds} onResend={resend} />
        </form>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      sticker="Parolni tiklash"
      title={
        <>
          Parolni
          <br />
          <span className="serif-i normal-case">unutdingizmi?</span>
        </>
      }
      lead="Emailingizni kiriting, 6 xonali kod yuboramiz. Kod bilan yangi parol o'rnatasiz."
      footer={
        <p>
          Esladingizmi? <TextLink href={ROUTES.login}>Kirishga qaytish</TextLink>
        </p>
      }
    >
      <form onSubmit={sendCode} noValidate className="space-y-6">
        <FormAlert>{formError}</FormAlert>
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors({});
          }}
          error={errors.email}
          autoFocus
        />
        <SubmitButton pending={pending}>Kod yuborish →</SubmitButton>
      </form>
    </AuthFrame>
  );
}
