import { NextResponse, type NextRequest } from "next/server";
import { ROUTES } from "@/config/routes";
import { getGrammar } from "@/lib/grammar/data";
import { decideGrammarRoute } from "@/lib/grammar/routing";

const COOKIE = process.env.SESSION_COOKIE_NAME ?? "izlan_session";

/**
 * Faqat /grammar/**. Grammatika ichki (login talab qiladi) bo'lim:
 * - sessiya cookie'si yo'q → /login (xuddi requireUser/apiGet kabi), mavjudligi oshkor qilinmaydi;
 * - eski slug → 308 (query saqlanadi);
 * - noma'lum til/slug → haqiqiy 404 (qobiqsiz statik sahifa).
 * Cookie'ning haqiqiyligi bu yerda emas, layout'dagi requireUser() da tekshiriladi.
 */
export async function proxy(request: NextRequest) {
  if (!request.cookies.get(COOKIE)?.value) {
    return NextResponse.redirect(new URL(ROUTES.login, request.url));
  }
  let store;
  try {
    store = await getGrammar();
  } catch {
    // Grammatika xizmati mavjud emas (fail-closed): sahifaning o'zi "vaqtincha mavjud emas" ko'rsatadi
    return NextResponse.next();
  }
  const decision = decideGrammarRoute(request.nextUrl.pathname, store);
  if (decision.kind === "redirect") {
    const target = new URL(decision.to, request.url);
    target.search = request.nextUrl.search;
    return NextResponse.redirect(target, 308);
  }
  if (decision.kind === "notFound") {
    return NextResponse.rewrite(new URL("/grammar-missing", request.url), { status: 404 });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/grammar", "/grammar/:path*"] };
