import { useState } from 'react';
import { ChevronDown, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLocation } from 'wouter';

interface FAQItem {
  question: string;
  answer: string;
  category: 'data-quality' | 'csv-uploads' | 'data-mapping' | 'commission' | 'troubleshooting';
}

const faqItems: FAQItem[] = [
  {
    category: 'data-quality',
    question: 'What is "Good Data In = Good Data Out"?',
    answer: `This is the fundamental principle of data analysis. The quality of your insights is directly proportional to the quality of your input data. If you upload incomplete, inaccurate, or poorly formatted data, the reports and metrics you receive will reflect those same issues. Conversely, clean, complete, and accurate data produces reliable, actionable insights.`,
  },
  {
    category: 'data-quality',
    question: 'What makes data "good" for this tool?',
    answer: `Good data has these characteristics:

• Completeness: Key fields like Loop Name, Status, Price, and Closing Date are filled in
• Accuracy: Data values are correct and reflect reality
• Consistency: Data follows a consistent format (dates, status values)
• Timeliness: Data is current and reflects recent transactions
• Validity: Data values are within expected ranges and types`,
  },
  {
    category: 'data-quality',
    question: 'What happens if I upload data with missing fields?',
    answer: `The tool will process your data and include whatever information is available. However, reports and metrics will be incomplete. Missing prices mean volume calculations will be inaccurate. Missing agent names mean leaderboard rankings will be incomplete. Missing closing dates mean timeline analysis won't work properly.

The tool won't crash, but your insights will be limited. We recommend reviewing your Dotloop export and ensuring key fields are populated before uploading.`,
  },
  {
    category: 'data-quality',
    question: 'How can I improve my data quality before uploading?',
    answer: `Follow these steps:

1. Review your Dotloop export - Open the CSV file in Excel or Google Sheets
2. Check for missing values - Look for blank cells in key columns
3. Verify data accuracy - Spot-check a few records to ensure prices, dates, and agent names are correct
4. Standardize status values - Ensure status values match expected values
5. Fix formatting issues - Ensure dates are in a consistent format, prices are numbers
6. Remove test/duplicate records - Delete any test loops or duplicate entries
7. Save and upload - Export the cleaned CSV and upload to this tool

Even 10 minutes of data cleanup can significantly improve your results.`,
  },
  {
    category: 'csv-uploads',
    question: 'What CSV format does this tool accept?',
    answer: `The tool accepts standard CSV (Comma-Separated Values) files exported directly from Dotloop. The file should be a .csv file (not .xlsx), use comma as the delimiter, include headers in the first row, and use UTF-8 encoding.

If you export from Dotloop using the standard Export function, the format will be correct automatically.`,
  },
  {
    category: 'csv-uploads',
    question: 'How do I export data from Dotloop?',
    answer: `To export your Dotloop data:

1. Log into your Dotloop account
2. Navigate to your Loops or Transactions view
3. Select the loops/transactions you want to analyze
4. Click the Export button
5. Choose CSV format
6. Save the file to your computer
7. Upload the CSV file to this tool

The exported file will contain all your loop data in the correct format for analysis.`,
  },
  {
    category: 'csv-uploads',
    question: 'What is the maximum file size I can upload?',
    answer: `The tool supports CSV files up to 50MB in size. This typically translates to approximately 500,000 transactions in a single file, or 5-10 years of transaction history for most brokerages.

If your file is larger, consider splitting it by date range or agent and uploading multiple files separately. You can then compare results across uploads.`,
  },
  {
    category: 'csv-uploads',
    question: 'Can I upload multiple CSV files?',
    answer: `Yes! You can upload multiple CSV files, and the tool will process each one separately. This is useful for analyzing different time periods, comparing results across different agents or teams, testing different commission plans on the same data, and building historical trends.

Each upload is stored separately, so you can access previous uploads from the Recent Uploads section.`,
  },
  {
    category: 'data-mapping',
    question: 'What is data mapping and why do I need it?',
    answer: `Data mapping is the process of matching your CSV column names to the tool's standard fields. Different Dotloop exports may use different column names, so mapping tells the tool which column contains which information.

For example, your CSV might have a column called "Transaction Name" while the tool expects "Loop Name". Mapping connects these so the tool knows to use "Transaction Name" data for Loop Name analysis.

If your CSV uses standard Dotloop export column names, mapping happens automatically.`,
  },
  {
    category: 'data-mapping',
    question: 'What columns does the tool require?',
    answer: `The tool works best with these columns:

Essential: Loop Name, Status, Price, Closing Date
Recommended: Agent Name, Lead Source, Property Type, Transaction Type
Optional: Tags, Created Date, List Price, Commission

If your CSV is missing some columns, the tool will still work but certain reports will be incomplete. For example, without Agent Name, the Agent Leaderboard won't display.`,
  },
  {
    category: 'data-mapping',
    question: 'What if my column names are different from the standard?',
    answer: `The tool includes a mapping wizard that appears when it detects non-standard column names. The wizard shows your column names and asks you to match them to the tool's standard fields.

Example mappings: "Transaction Name" maps to "Loop Name", "Deal Status" maps to "Status", "Sale Price" maps to "Price", "Close Date" maps to "Closing Date", "Agent" maps to "Agent Name".

Once you complete the mapping, it's saved for future uploads, so you only need to do this once per CSV format.`,
  },
  {
    category: 'commission',
    question: 'How does the tool calculate commissions?',
    answer: `The tool calculates commissions using this formula:

Commission = Sale Price × Commission Rate × (1 - Risk Adjustment)

Where Sale Price is the transaction price from your data, Commission Rate is the percentage you set (default 3%), and Risk Adjustment accounts for deals that might not close.

Example: A $500,000 deal with 3% commission equals $15,000. If 20% risk adjustment is applied, the projected commission is $12,000.

You can customize commission rates and risk adjustments in the Commission Projector section.`,
  },
  {
    category: 'commission',
    question: 'What is the "Risk Adjustment" slider?',
    answer: `The Risk Adjustment slider accounts for deals that might not close. It reduces projected commission to reflect realistic expectations.

0% risk assumes all deals will close (optimistic). 25% risk assumes 75% of deals will close (realistic). 50% risk assumes 50% of deals will close (conservative).

The slider helps you forecast revenue based on your historical close rate. If you historically close 70% of deals, use a 30% risk adjustment.`,
  },
  {
    category: 'commission',
    question: 'Why are my commission calculations showing $0?',
    answer: `This usually happens when:

1. Missing price data - Records don't have sale prices. Check your CSV for missing values in the Price column.
2. Invalid price format - Prices are stored as text instead of numbers. Clean your data before uploading.
3. Wrong commission rate - The commission rate is set to 0%. Check the Commission Projector settings.
4. No deals in the selected status - If you're filtering by status, ensure you have deals in that status.

Solution: Review your data quality, ensure prices are numbers, and verify your commission settings.`,
  },
  {
    category: 'commission',
    question: 'Can I set different commission rates for different agents?',
    answer: `Yes! The Commission Plans Manager lets you create multiple commission structures like Standard Plan (80/20), Team Member Plan (50/50), Referral Plan (90/10), and Custom Plans.

You can then assign different plans to different agents in the Agent Assignment section. This is useful for new agents (lower splits), top producers (higher splits), referral partners (custom rates), and team members (fixed splits).`,
  },
  {
    category: 'troubleshooting',
    question: 'Why are my metrics showing incorrect numbers?',
    answer: `This is almost always a data quality issue. Check:

1. Missing data - Are key fields populated? (Loop Name, Status, Price, Closing Date)
2. Incorrect data - Are prices actual sale prices? Are statuses correct?
3. Duplicate records - Does your CSV have duplicate entries for the same deal?
4. Test data - Does your CSV include test loops from Dotloop? Remove these before uploading.
5. Date range - Are you filtering by a date range that excludes your data?

Solution: Review your CSV in Excel, clean it up, and re-upload. Remember: garbage data in = garbage data out.`,
  },
  {
    category: 'troubleshooting',
    question: 'Why is the Agent Leaderboard empty?',
    answer: `The leaderboard requires agent names in your data. Check:

1. Missing agent data - Does your CSV have an Agent Name column? Is it populated for all records?
2. Column mapping - If your agent column has a different name, ensure it's mapped correctly.
3. Data format - Are agent names consistent? Different formats will be treated as different agents.

Solution: Ensure your CSV has an Agent Name column with consistent formatting, then re-upload.`,
  },
  {
    category: 'troubleshooting',
    question: 'Why are my charts not displaying?',
    answer: `Charts require data in specific fields:

• Pipeline chart requires Status field
• Lead Source chart requires Lead Source field
• Property Type chart requires Property Type field
• Geographic chart requires State/City field

If a chart is blank, the corresponding field is missing or empty in your data. Solution: Add the missing field to your Dotloop export and re-upload.`,
  },
  {
    category: 'troubleshooting',
    question: 'What should I do if the tool crashes or shows an error?',
    answer: `If you encounter an error:

1. Note the error message - Screenshot or copy the exact error text
2. Check your data - Review your CSV for obvious issues
3. Try a smaller file - Upload a subset of your data to isolate the problem
4. Contact support - Email dotloopreport@gmail.com with the error message and a sample of your CSV

Most errors are caused by data quality issues. Cleaning your data often resolves the problem.`,
  },
  {
    category: 'troubleshooting',
    question: 'How do I reset my data and start over?',
    answer: `To start fresh:

1. Click "Back to Upload" in the dashboard header
2. Upload a new CSV file
3. The new data will replace the previous data

Your previous uploads are saved in the Recent Uploads section, so you can always go back to them. To delete a previous upload, click the delete button next to it in Recent Uploads.`,
  },
];

const categories = [
  { id: 'data-quality', label: 'Data Quality' },
  { id: 'csv-uploads', label: 'CSV Uploads' },
  { id: 'data-mapping', label: 'Data Mapping' },
  { id: 'commission', label: 'Commission' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
];

export default function FAQ() {
  const [, setLocation] = useLocation();
  const [expandedId, setExpandedId] = useState<number | null>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('data-quality');

  const filteredFAQs = faqItems.filter(item => item.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation('/')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-foreground">FAQ</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="p-6 border-amber-500/30 bg-amber-500/5">
            <div className="flex gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-foreground">The Golden Rule</h2>
                <p className="text-foreground font-bold text-lg">
                  Good Data In = Good Data Out
                </p>
                <p className="text-foreground">
                  The quality of your insights depends entirely on the quality of your data. Clean, complete, and accurate data produces reliable, actionable insights. This tool cannot fix bad data—only good data produces good results.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setExpandedId(null);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-foreground hover:bg-card/80'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredFAQs.map((item, index) => (
              <Card
                key={index}
                className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setExpandedId(expandedId === index ? null : index)}
              >
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-lg">{item.question}</h3>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${
                      expandedId === index ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                {expandedId === index && (
                  <div className="px-4 pb-4 border-t border-border pt-4">
                    <div className="text-foreground whitespace-pre-wrap leading-relaxed">
                      {item.answer}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>

          <Card className="p-6 bg-card border-primary/30">
            <div className="flex gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground text-lg">Still Need Help?</h3>
                <p className="text-foreground">
                  If you can't find the answer you're looking for, please reach out to us at{' '}
                  <a
                    href="mailto:dotloopreport@gmail.com"
                    className="text-primary hover:underline font-medium"
                  >
                    dotloopreport@gmail.com
                  </a>
                </p>
                <p className="text-foreground text-sm">
                  Please include a sample of your CSV file (with sensitive data removed) so we can help diagnose any issues.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>

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
