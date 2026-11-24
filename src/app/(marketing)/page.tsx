import { ScrollToTop } from "@/features/landing/ScrollToTop";
import { Contrast } from "@/features/landing/sections/Contrast";
import { Faq } from "@/features/landing/sections/Faq";
import { Features } from "@/features/landing/sections/Features";
import { FinalCta } from "@/features/landing/sections/FinalCta";
import { FitAdvisor } from "@/features/landing/sections/FitAdvisor";
import { Hero } from "@/features/landing/sections/Hero";
import { HowItWorks } from "@/features/landing/sections/HowItWorks";
import { Prices } from "@/features/landing/sections/Prices";
import { Rewards } from "@/features/landing/sections/Rewards";

export default function LandingPage() {
  return (
    <>
      <ScrollToTop />
      <Hero />
      <Contrast />
      <HowItWorks />
      <Features />
      <FitAdvisor />
      <Rewards />
      <Prices />
      <Faq />
      <FinalCta />
    </>
  );
}
