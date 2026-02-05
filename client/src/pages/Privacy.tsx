/**
 * Privacy Policy Page
 * 
 * Comprehensive privacy information for the Dotloop Reporting Tool
 */

import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Privacy() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-xl font-display font-bold text-foreground">
              Privacy Policy
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Introduction */}
          <Card className="p-6 bg-card/50">
            <p className="text-foreground/80 leading-relaxed">
              <strong>Last Updated:</strong> February 2026
            </p>
            <p className="text-foreground/80 leading-relaxed mt-4">
              The Dotloop Reporting Tool ("we," "us," "our," or "Tool") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
            </p>
          </Card>

          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">1. Information We Collect</h2>
            
            <Card className="p-6 bg-card/50">
              <h3 className="text-lg font-semibold text-foreground mb-3">CSV File Data</h3>
              <p className="text-foreground/80 leading-relaxed">
                When you upload a CSV file to analyze, we process the data locally in your browser. This data is not transmitted to external servers for processing. The data remains in your browser's memory during your session and is cleared when you close the browser or navigate away from the application.
              </p>
            </Card>

            <Card className="p-6 bg-card/50">
              <h3 className="text-lg font-semibold text-foreground mb-3">Authentication Data</h3>
              <p className="text-foreground/80 leading-relaxed">
                If you choose to connect your Dotloop account, we receive authentication tokens from Dotloop's OAuth system. These tokens are stored securely and used only to fetch your transaction data from Dotloop's API. We do not store your Dotloop password.
              </p>
            </Card>

            <Card className="p-6 bg-card/50">
              <h3 className="text-lg font-semibold text-foreground mb-3">Usage Data</h3>
              <p className="text-foreground/80 leading-relaxed">
                We may collect non-personally identifiable usage data such as page views, feature usage, and error logs to improve the Tool's functionality and user experience. This data does not identify you personally.
              </p>
            </Card>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">2. How We Use Your Information</h2>
            
            <Card className="p-6 bg-card/50">
              <ul className="space-y-3 text-foreground/80">
                <li className="flex gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>To process and analyze your CSV data for reporting and insights</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>To authenticate with Dotloop and fetch your transaction data</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>To improve the Tool's features and performance</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>To respond to your inquiries and provide support</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>To comply with legal obligations and prevent fraud</span>
                </li>
              </ul>
            </Card>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">3. Data Storage and Security</h2>
            
            <Card className="p-6 bg-card/50">
              <h3 className="text-lg font-semibold text-foreground mb-3">Local Processing</h3>
              <p className="text-foreground/80 leading-relaxed">
                CSV data you upload is processed entirely in your browser. We do not store your CSV data on our servers. Once you close your browser session, this data is automatically cleared.
              </p>
            </Card>

            <Card className="p-6 bg-card/50">
              <h3 className="text-lg font-semibold text-foreground mb-3">Dotloop Integration</h3>
              <p className="text-foreground/80 leading-relaxed">
                When you connect your Dotloop account, your authentication token is stored securely on our servers. We use industry-standard encryption to protect this data. Your transaction data fetched from Dotloop is processed and displayed in your browser but is not permanently stored on our servers.
              </p>
            </Card>

            <Card className="p-6 bg-card/50">
              <h3 className="text-lg font-semibold text-foreground mb-3">Security Measures</h3>
              <p className="text-foreground/80 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
              </p>
            </Card>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">4. Data Sharing and Disclosure</h2>
            
            <Card className="p-6 bg-card/50">
              <p className="text-foreground/80 leading-relaxed mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share information only in the following circumstances:
              </p>
              <ul className="space-y-3 text-foreground/80">
                <li className="flex gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Dotloop API:</strong> We share your authentication token with Dotloop to fetch your transaction data as requested</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our legal rights</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Service Providers:</strong> We may use third-party services for hosting and analytics, subject to confidentiality agreements</span>
                </li>
              </ul>
            </Card>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">5. Your Rights and Choices</h2>
            
            <Card className="p-6 bg-card/50">
              <h3 className="text-lg font-semibold text-foreground mb-3">Access and Control</h3>
              <p className="text-foreground/80 leading-relaxed">
                You have the right to access, correct, or delete your personal information. You can disconnect your Dotloop account at any time through the Settings page. Disconnecting will revoke our access to your Dotloop data.
              </p>
            </Card>

            <Card className="p-6 bg-card/50">
              <h3 className="text-lg font-semibold text-foreground mb-3">Browser Data</h3>
              <p className="text-foreground/80 leading-relaxed">
                You can clear your browser's local storage and cookies at any time to remove any cached data. This will also clear your field mapping preferences and recent file history.
              </p>
            </Card>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">6. Cookies and Tracking</h2>
            
            <Card className="p-6 bg-card/50">
              <p className="text-foreground/80 leading-relaxed">
                We use cookies to maintain your session and remember your preferences (such as field mapping). These cookies are essential for the Tool to function properly. You can control cookie settings through your browser preferences.
              </p>
            </Card>
          </section>

          {/* Section 7 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">7. Third-Party Links</h2>
            
            <Card className="p-6 bg-card/50">
              <p className="text-foreground/80 leading-relaxed">
                This Tool may contain links to external websites, including Dotloop. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any personal information.
              </p>
            </Card>
          </section>

          {/* Section 8 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">8. Children's Privacy</h2>
            
            <Card className="p-6 bg-card/50">
              <p className="text-foreground/80 leading-relaxed">
                This Tool is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will delete such information and terminate the child's account.
              </p>
            </Card>
          </section>

          {/* Section 9 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">9. Changes to This Privacy Policy</h2>
            
            <Card className="p-6 bg-card/50">
              <p className="text-foreground/80 leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by updating the "Last Updated" date at the top of this policy. Your continued use of the Tool after any modifications constitutes your acceptance of the updated Privacy Policy.
              </p>
            </Card>
          </section>

          {/* Section 10 */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">10. Contact Us</h2>
            
            <Card className="p-6 bg-card/50">
              <p className="text-foreground/80 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <div className="space-y-2 text-foreground/80">
                <p>
                  <strong>Email:</strong>{' '}
                  <a 
                    href="mailto:dotloopreport@gmail.com"
                    className="text-primary hover:text-primary/80 underline"
                  >
                    dotloopreport@gmail.com
                  </a>
                </p>
                <p>
                  <strong>Note:</strong> This is an independent passion project and is not affiliated with Dotloop, Inc.
                </p>
              </div>
            </Card>
          </section>

          {/* Footer Spacing */}
          <div className="pt-8 pb-16" />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur-sm">
        <div className="container py-6 px-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-foreground/70 text-center leading-relaxed">
              <span className="font-semibold text-foreground">Disclaimer:</span> This tool is strictly an independent passion project and is <span className="font-semibold">NOT</span> an official dotloop product. For questions or support, please email{' '}
              <a 
                href="mailto:dotloopreport@gmail.com" 
                className="text-primary hover:text-primary/80 underline transition-colors"
              >
                dotloopreport@gmail.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
