import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Sticker } from "@/components/ui/Sticker";

type Props = {
  sticker: string;
  title: ReactNode;
  lead?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

/** Barcha auth formalarining umumiy ko'rinishi: sticker, katta sarlavha, forma, pastki havola. */
export function AuthFrame({ sticker, title, lead, children, footer }: Props) {
  return (
    <div className="w-full max-w-[520px]">
      <Sticker tone="acid" rotate={-2}>
        {sticker}
      </Sticker>
      <h1 className="display-cond mt-5 text-[clamp(40px,7vw,64px)]">{title}</h1>
      {lead && <p className="mt-4 max-w-md text-lg leading-snug text-ink/80">{lead}</p>}
      <div className="mt-8">{children}</div>
      {footer && <div className="mt-8 border-t-[3px] border-ink pt-6 text-[17px]">{footer}</div>}
    </div>
  );
}

export function TextLink({ children, className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={cn("font-bold underline decoration-[3px] underline-offset-4 hover:bg-acid focus-visible:bg-acid", typeof className === "string" && className)}
    >
      {children}
    </Link>
  );
}
