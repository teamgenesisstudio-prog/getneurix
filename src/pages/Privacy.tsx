import { Link } from "react-router-dom";

const C = {
  bg: "#080808",
  surface: "#0e0e0e",
  surface2: "#141414",
  border: "#242424",
  border2: "#2e2e2e",
  text: "#f5f5f5",
  muted: "#999999",
  subtle: "#555555",
  blue: "#3b82f6",
};
const sans = { fontFamily: "'DM Sans', system-ui, sans-serif" } as const;
const mono = { fontFamily: "'DM Mono', ui-monospace, monospace" } as const;

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={{ marginBottom: 56 }}>
    <h2 style={{ ...sans, fontSize: 20, fontWeight: 600, color: C.text, margin: "0 0 16px", letterSpacing: "-0.01em" }}>
      {title}
    </h2>
    <div style={{ ...sans, fontSize: 15, lineHeight: 1.7, color: C.muted }}>{children}</div>
  </section>
);

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li style={{ marginBottom: 8, paddingLeft: 4 }}>{children}</li>
);

export default function Privacy() {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, ...sans }}>
      {/* Nav */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "rgba(8,8,8,0.72)",
          backdropFilter: "blur(14px) saturate(140%)",
          WebkitBackdropFilter: "blur(14px) saturate(140%)",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            height: 60,
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            to="/"
            style={{ fontWeight: 700, letterSpacing: 0.5, fontSize: 16, color: C.text, textDecoration: "none" }}
          >
            NEUR<span style={{ color: C.blue }}>IX</span>
          </Link>
          <Link
            to="/"
            style={{
              fontSize: 13,
              color: C.muted,
              textDecoration: "none",
              transition: "color .2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
          >
            Back to home
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "64px 24px 96px" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ ...mono, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.blue, marginBottom: 12 }}>
            Legal
          </div>
          <h1 style={{ ...sans, fontSize: "clamp(32px,4vw,48px)", fontWeight: 600, letterSpacing: "-0.025em", margin: 0, color: C.text }}>
            Privacy Policy
          </h1>
          <p style={{ color: C.subtle, fontSize: 14, marginTop: 12 }}>
            Last updated: June 13, 2026
          </p>
        </div>

        <Section title="1. What data we collect">
          <p style={{ margin: "0 0 16px" }}>
            Neurix collects the following categories of data to provide and improve our AI reliability platform:
          </p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <Bullet>
              <strong style={{ color: C.text }}>Prompts you submit for scanning.</strong> When you use our AI Firewall,
              Red Team, or other security tools, the prompts you enter are sent to our AI analysis engine for threat
              detection and safety evaluation.
            </Bullet>
            <Bullet>
              <strong style={{ color: C.text }}>Email address if you sign up.</strong> If you create an account or join
              our beta program, we collect your email address to authenticate you and send service-related
              communications.
            </Bullet>
            <Bullet>
              <strong style={{ color: C.text }}>Usage data and analytics.</strong> We collect information about how you
              interact with the platform, including feature usage, scan counts, error rates, and performance metrics to
              help us improve reliability and user experience.
            </Bullet>
          </ul>
        </Section>

        <Section title="2. How we use the data">
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <Bullet>
              <strong style={{ color: C.text }}>To run AI security scans.</strong> Prompts and inputs are processed by
              our AI engine to detect prompt injection, data exfiltration, PII exposure, and other threats.
            </Bullet>
            <Bullet>
              <strong style={{ color: C.text }}>To improve the platform.</strong> Usage patterns and scan outcomes help
              us train better detection models, reduce false positives, and build new reliability features.
            </Bullet>
            <Bullet>
              <strong style={{ color: C.text }}>We do NOT sell your data.</strong> Neurix does not sell, rent, or trade
              personal data to third parties for marketing or any other purpose.
            </Bullet>
          </ul>
        </Section>

        <Section title="3. Data storage">
          <p style={{ margin: "0 0 16px" }}>
            Your data is stored securely in cloud infrastructure with encryption at rest and in transit.
          </p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <Bullet>
              <strong style={{ color: C.text }}>Retention.</strong> Scan results and prompts are retained for up to
              90 days unless you delete them earlier. Account information is retained for as long as your account is
              active.
            </Bullet>
            <Bullet>
              <strong style={{ color: C.text }}>Location.</strong> Data is stored in the United States via our cloud
              providers (Supabase and Netlify). We use appropriate safeguards for international transfers.
            </Bullet>
          </ul>
        </Section>

        <Section title="4. Third party services">
          <p style={{ margin: "0 0 16px" }}>
            Neurix relies on select third-party services to operate the platform. Each provider is bound by strict data
            processing agreements:
          </p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <Bullet>
              <strong style={{ color: C.text }}>Anthropic API</strong> — Used for AI processing and security analysis
              of submitted prompts. Data is transmitted securely and not used by Anthropic to train models outside of
              our agreement.
            </Bullet>
            <Bullet>
              <strong style={{ color: C.text }}>Supabase</strong> — Provides our managed database, authentication, and
              edge function infrastructure. User data is encrypted and isolated per project.
            </Bullet>
            <Bullet>
              <strong style={{ color: C.text }}>Netlify</strong> — Hosts the Neurix web application and serves static
              assets securely over HTTPS.
            </Bullet>
          </ul>
        </Section>

        <Section title="5. User rights">
          <p style={{ margin: "0 0 16px" }}>
            You have control over your data. At any time, you can:
          </p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <Bullet>
              <strong style={{ color: C.text }}>Right to delete your data.</strong> Contact us to request deletion of
              your account and associated scan history. We will process verified requests within 30 days.
            </Bullet>
            <Bullet>
              <strong style={{ color: C.text }}>Right to access your data.</strong> You may request a copy of the
              personal data we hold about you.
            </Bullet>
            <Bullet>
              <strong style={{ color: C.text }}>How to contact us.</strong> Reach out at{" "}
              <a href="mailto:team.genesisstudio@gmail.com" style={{ color: C.blue, textDecoration: "none" }}>
                team.genesisstudio@gmail.com
              </a>{" "}
              for any data-related requests.
            </Bullet>
          </ul>
        </Section>

        <Section title="6. GDPR compliance">
          <p style={{ margin: 0 }}>
            For users in the European Economic Area (EEA), Neurix processes personal data in accordance with the
            General Data Protection Regulation (GDPR). We act as a data controller for account information and a data
            processor for scan content. If you are an EEA resident, you have the right to lodge a complaint with your
            local supervisory authority. To exercise GDPR rights, contact us at{" "}
            <a href="mailto:team.genesisstudio@gmail.com" style={{ color: C.blue, textDecoration: "none" }}>
              team.genesisstudio@gmail.com
            </a>.
          </p>
        </Section>

        <Section title="7. Changes to this policy">
          <p style={{ margin: 0 }}>
            We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements.
            When we make material changes, we will notify users by email (if you have provided one) or by posting a
            prominent notice on the website before the changes take effect. The "Last updated" date at the top of this
            page indicates when this policy was last revised.
          </p>
        </Section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "32px 24px", color: C.muted }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 12,
          }}
        >
          <div style={{ ...sans, color: C.text, fontWeight: 700, letterSpacing: 0.5 }}>
            NEUR<span style={{ color: C.blue }}>IX</span>
          </div>
          <div style={{ display: "flex", gap: 24, ...sans }}>
            <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>Product</Link>
            <span>Docs</span>
            <span>Blog</span>
            <span>Twitter</span>
          </div>
          <div style={{ ...mono, fontSize: 11 }}>© 2025 Neurix. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
