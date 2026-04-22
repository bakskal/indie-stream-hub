import { useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function Privacy() {
  useEffect(() => {
    document.title = "Privacy Policy — Rock On Motion Pictures";
  }, []);

  const lastUpdated = "April 22, 2026";

  return (
    <div className="min-h-screen flex flex-col stage-light">
      <SiteHeader />
      <main className="flex-1 container max-w-3xl py-10">
        <article className="rounded-3xl bg-white text-card-foreground shadow-card p-8 md:p-12">
          <p className="text-[11px] tracking-[0.3em] text-primary font-medium">PRIVACY POLICY</p>
          <h1 className="font-display text-4xl mt-2">Your privacy matters</h1>
          <p className="mt-3 text-sm text-card-foreground/65">Last updated: {lastUpdated}</p>

          <section className="mt-8 space-y-4 text-[15px] leading-relaxed text-card-foreground/80">
            <p>
              Rock On Motion Pictures ("we", "us", or "our") operates rockonmotionpictures.com (the
              "Site"). This Privacy Policy explains what information we collect, how we use it, and
              the choices you have. By using the Site, you agree to the practices described below.
            </p>
          </section>

          <h2 className="font-display text-2xl mt-10">Information we collect</h2>
          <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-card-foreground/80 list-disc pl-5">
            <li>
              <strong>Account information.</strong> When you create an account, we collect your
              email address and a hashed password. You may optionally provide a display name.
            </li>
            <li>
              <strong>Rental and payment information.</strong> When you rent a film, our payment
              processor (Stripe) handles your card details. We never see or store your full card
              number. We retain rental records (film, amount, currency, timestamps) to give you
              access to what you've purchased.
            </li>
            <li>
              <strong>Viewing activity.</strong> We store playback position so you can resume where
              you left off, and basic activity needed to enforce your rental window.
            </li>
            <li>
              <strong>Newsletter.</strong> If you subscribe, we store your email address and the
              date you subscribed so we can send updates about new releases.
            </li>
            <li>
              <strong>Technical data.</strong> Standard server and browser logs (IP address,
              browser type, pages visited) used to operate, secure, and improve the Site.
            </li>
          </ul>

          <h2 className="font-display text-2xl mt-10">How we use your information</h2>
          <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-card-foreground/80 list-disc pl-5">
            <li>To provide rentals, streaming access, and account features.</li>
            <li>To process payments and prevent fraud.</li>
            <li>To send transactional emails (receipts, password resets, rental confirmations).</li>
            <li>To send newsletters if you've opted in. You can unsubscribe at any time.</li>
            <li>To monitor performance, debug issues, and improve the experience.</li>
            <li>To comply with legal obligations and enforce our terms.</li>
          </ul>

          <h2 className="font-display text-2xl mt-10">Service providers</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-card-foreground/80">
            We share limited information with trusted vendors who help us run the Site, including
            Stripe (payments), our cloud database and authentication provider, and our video
            streaming provider. These providers may only use your data to deliver services to us.
          </p>

          <h2 className="font-display text-2xl mt-10">Cookies</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-card-foreground/80">
            We use cookies and similar technologies to keep you signed in, remember preferences, and
            understand how the Site is used. You can control cookies in your browser settings;
            disabling them may affect site functionality.
          </p>

          <h2 className="font-display text-2xl mt-10">Data retention</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-card-foreground/80">
            We retain account, rental, and payment records for as long as your account is active or
            as required for tax, accounting, and legal purposes. You can request deletion of your
            account at any time.
          </p>

          <h2 className="font-display text-2xl mt-10">Your rights</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-card-foreground/80">
            Depending on where you live, you may have the right to access, correct, export, or
            delete your personal information, and to object to or restrict certain processing. To
            exercise these rights, contact us using the details below.
          </p>

          <h2 className="font-display text-2xl mt-10">Children</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-card-foreground/80">
            The Site is not directed to children under 13, and we do not knowingly collect personal
            information from them. If you believe a child has provided us information, please
            contact us so we can remove it.
          </p>

          <h2 className="font-display text-2xl mt-10">Changes to this policy</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-card-foreground/80">
            We may update this Privacy Policy from time to time. When we do, we'll revise the "Last
            updated" date above. Material changes will be communicated through the Site or by email.
          </p>

          <h2 className="font-display text-2xl mt-10">Contact us</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-card-foreground/80">
            Questions or requests about this policy? Email{" "}
            <a
              href="mailto:info@rockonmotionpictures.com"
              className="text-primary underline underline-offset-2 hover:opacity-80"
            >
              info@rockonmotionpictures.com
            </a>
            .
          </p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
