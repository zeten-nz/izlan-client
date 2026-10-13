"use client";

import { useState, type SyntheticEvent } from "react";
import { AuthFrame, TextLink } from "@/features/auth/components/AuthFrame";
import { Checkbox, Field, FormAlert, PasswordField, SubmitButton } from "@/features/auth/components/fields";
import { ROUTES, roleHome, type Role } from "@/config/routes";
import { apiPost, type FieldErrors } from "@/lib/api";

export function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: FieldErrors = {};
    if (identifier.trim().length < 3) next.identifier = "Username yoki emailni kiriting";
    if (!password) next.password = "Parolni kiriting";
    setErrors(next);
    setFormError("");
    if (Object.keys(next).length) return;

    setPending(true);
    const res = await apiPost<{ user: { role: Role } }>("/auth/login", { identifier: identifier.trim(), password, remember });
    if (res.ok) {
      // To‘liq yuklash: oldingi foydalanuvchining keshlangan sahifalari qolmasin.
      window.location.assign(roleHome(res.data.user.role));
      return;
    }
    setPending(false);
    setErrors(res.fieldErrors);
    setFormError(Object.keys(res.fieldErrors).length ? "" : res.message);
  }

  return (
    <AuthFrame
      sticker="Kirish"
      title={
        <>
          Qaytganingiz
          <br />
          <span className="serif-i normal-case">yaxshi bo&apos;ldi.</span>
        </>
      }
      lead="Username yoki email va parol bilan kiring."
      footer={
        <p>
          Hisobingiz yo&apos;qmi? <TextLink href={ROUTES.register}>Ro&apos;yxatdan o&apos;ting</TextLink>
        </p>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <FormAlert>{formError}</FormAlert>
        <Field
          label="Username yoki email"
          name="identifier"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          error={errors.identifier}
          autoFocus
        />
        <PasswordField
          label="Parol"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <Checkbox label="Meni eslab qol" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <TextLink href={ROUTES.forgotPassword} className="text-[15px]">
            Parolni unutdingizmi?
          </TextLink>
        </div>
        <SubmitButton pending={pending}>Kirish →</SubmitButton>
        <p className="text-sm text-ink/65">
          Belgilanmasa, sessiya 24 soatdan keyin tugaydi.
        </p>
      </form>
    </AuthFrame>
  );
}
