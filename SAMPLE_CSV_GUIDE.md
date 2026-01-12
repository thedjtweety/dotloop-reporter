# Sample Dotloop CSV Test Data

This guide explains the sample CSV file included in the project for testing the commission calculator and CSV upload widget.

## File Location

The sample CSV file is located at: `sample-data/dotloop-export-sample.csv`

## File Contents

The sample file contains **20 realistic residential real estate transactions** from the Austin, Texas market. Each transaction includes:

- **Transaction Details**: Loop ID, status, dates (created, listing, offer, closing)
- **Property Information**: Address, price, type, bedrooms, bathrooms, square footage
- **Location Data**: City, state, county, subdivision
- **Commission Data**: Commission rate, total, agent split, company dollar
- **Agent Information**: Assigned agent name for each transaction
- **Additional Fields**: Lead source, earnest money, referral information, compliance status

## Sample Data Characteristics

| Characteristic | Details |
|---|---|
| **Number of Transactions** | 20 |
| **Price Range** | $285,000 - $735,000 |
| **Average Price** | ~$520,000 |
| **Property Types** | Single Family (14), Condo (4), Townhome (2) |
| **Agents Represented** | 10 (Alice Johnson, Bob Smith, Carol Williams, David Brown, Emma Davis, Frank Miller, Grace Wilson, Henry Moore, Iris Taylor, Jack Anderson) |
| **Commission Rate** | 6% (standard) |
| **Date Range** | January 5 - February 22, 2024 |
| **Location** | Austin, TX (Travis County) |

## How to Use the Sample Data

### 1. Testing the CSV Upload Widget

To test the CSV upload functionality:

1. Navigate to the **Calculate** tab in the Commission Management section
2. Click the CSV upload area or drag-and-drop the sample file
3. The widget will validate the file and display success/error messages
4. Once uploaded, the transactions will be loaded into the calculator

### 2. Testing Commission Calculations

After uploading the sample CSV:

1. Ensure you have created at least one commission plan in the **Plans** tab
2. Ensure you have assigned agents in the **Agents** tab
3. Click **Calculate Commissions** to process the transactions
4. Review the results showing commission breakdowns by agent and tier

### 3. Verifying Data Quality

The sample data includes:

- **Realistic price distributions** across Austin neighborhoods
- **Multiple agents** to test agent assignment and filtering
- **Various property types** to test different transaction scenarios
- **Consistent commission structures** for easy verification
- **Proper date formatting** (YYYY-MM-DD) for parsing validation

## CSV Column Reference

| Column | Description | Example |
|---|---|---|
| `loopId` | Unique transaction identifier | DL-001 |
| `loopViewUrl` | Link to Dotloop transaction | https://dotloop.com/loop/001 |
| `loopName` | Transaction name | 123 Oak Street - Residential |
| `loopStatus` | Transaction status | Closed |
| `createdDate` | Date transaction created | 2024-01-05 |
| `closingDate` | Closing date | 2024-02-15 |
| `listingDate` | Listing date | 2024-01-01 |
| `offerDate` | Offer date | 2024-01-10 |
| `address` | Property address | 123 Oak Street |
| `price` | Listed price | 425000 |
| `propertyType` | Type of property | Single Family |
| `bedrooms` | Number of bedrooms | 4 |
| `bathrooms` | Number of bathrooms | 2.5 |
| `squareFootage` | Property size | 2400 |
| `city` | City | Austin |
| `state` | State | TX |
| `county` | County | Travis |
| `leadSource` | How lead was generated | MLS |
| `earnestMoney` | Earnest money amount | 8500 |
| `salePrice` | Final sale price | 425000 |
| `commissionRate` | Commission percentage | 0.06 |
| `commissionTotal` | Total commission | 25500 |
| `agents` | Agent(s) involved | Alice Johnson |
| `createdBy` | User who created record | Alice Johnson |
| `buySideCommission` | Buy side commission | 12750 |
| `sellSideCommission` | Sell side commission | 12750 |
| `companyDollar` | Company dollar amount | 0 |
| `referralSource` | Referral source | Direct |
| `referralPercentage` | Referral percentage | 0 |
| `complianceStatus` | Compliance status | Compliant |
| `tags` | Transaction tags | residential |
| `originalPrice` | Original listing price | 425000 |
| `yearBuilt` | Year property was built | 2005 |
| `lotSize` | Lot size in acres | 0.25 |
| `subdivision` | Subdivision name | Westlake Hills |

## Expected Commission Calculations

Based on the sample data and typical commission plans:

- **Total Transaction Value**: ~$10.4 million (sum of all sale prices)
- **Total Commissions at 6%**: ~$624,000
- **Agent Distribution**: Each agent handles 2 transactions
- **Average Commission per Agent**: ~$62,400
- **Commission Range**: $17,100 - $44,100 per transaction

## Modifying the Sample Data

To create your own test data:

1. Export a real Dotloop report as CSV
2. Keep the same column headers as shown above
3. Adjust the data to match your testing scenarios
4. Save as CSV format
5. Upload using the CSV upload widget

## Troubleshooting

### File Upload Fails

- Ensure the file is in CSV format (not Excel or other formats)
- Verify all required columns are present
- Check that the file size is under 10MB
- Ensure proper date formatting (YYYY-MM-DD)

### Commission Calculations Don't Match

- Verify commission plans are created and active
- Ensure agents are assigned to the correct plans
- Check that agent names in CSV match assigned agents exactly
- Review commission plan tier thresholds and splits

### Data Not Appearing in Calculator

- Refresh the page after uploading
- Check browser console for error messages
- Verify the CSV file has valid data in all rows
- Ensure you're logged in with proper tenant access

## Next Steps

After testing with the sample data, you can:

1. Create additional sample files for different scenarios
2. Test edge cases (high-value transactions, multiple agents, tier transitions)
3. Verify tier advancement tracking with the sample data
4. Generate reports and exports from the sample calculations
