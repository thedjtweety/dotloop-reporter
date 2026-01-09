
import csv
import random
import datetime
from datetime import timedelta

# Configuration
NUM_RECORDS = 350  # Enough to show trends and volume
AGENTS = [
    "Sarah Miller", "James Wilson", "Emily Chen", "Michael Brown", "Jessica Davis",
    "David Martinez", "Jennifer Taylor", "Robert Anderson", "Lisa Thomas", "William Jackson",
    "Elizabeth White", "Christopher Harris", "Ashley Martin", "Matthew Thompson", "Amanda Garcia"
]
LEAD_SOURCES = ["Zillow", "Referral", "Open House", "Sphere of Influence", "Facebook Ads", "Realtor.com", "Walk-in", "Direct Mail"]
PROPERTY_TYPES = ["Single Family", "Condo", "Townhouse", "Multi-Family", "Land"]
CITIES = ["Atlanta", "Marietta", "Roswell", "Alpharetta", "Sandy Springs", "Decatur", "Smyrna", "Woodstock", "Kennesaw", "Lawrenceville"]
STATUSES = ["Sold", "Sold", "Sold", "Sold", "Active Listings", "Active Listings", "Under Contract", "Under Contract", "Archived"] # Weighted towards Sold

# Date Range: Past 12 months + next 3 months
END_DATE = datetime.date.today() + timedelta(days=90)
START_DATE = END_DATE - timedelta(days=450)

def random_date(start, end):
    return start + timedelta(days=random.randint(0, (end - start).days))

def generate_record(loop_id):
    status = random.choice(STATUSES)
    prop_type = random.choice(PROPERTY_TYPES)
    city = random.choice(CITIES)
    agent = random.choice(AGENTS)
    lead_source = random.choice(LEAD_SOURCES)
    
    # Realistic Pricing Logic
    if prop_type == "Single Family":
        base_price = random.randint(350, 1500) * 1000
    elif prop_type == "Condo":
        base_price = random.randint(200, 600) * 1000
    elif prop_type == "Townhouse":
        base_price = random.randint(300, 750) * 1000
    elif prop_type == "Multi-Family":
        base_price = random.randint(450, 1200) * 1000
    elif prop_type == "Land":
        base_price = random.randint(50, 400) * 1000
    else:
        base_price = random.randint(300, 800) * 1000

    # Psychological pricing (e.g., 499,900 instead of 500,000)
    if random.random() < 0.7:
        price = base_price - 100 # e.g. 499,900
    else:
        price = base_price # e.g. 500,000

    # Original price logic (sometimes higher, sometimes same)
    if random.random() < 0.6:
        original_price = price + (random.randint(5, 50) * 1000)
    else:
        original_price = price
    
    # Dates logic
    listing_date = random_date(START_DATE, END_DATE - timedelta(days=60))
    created_date = listing_date
    
    offer_date = ""
    closing_date = ""
    contract_date = ""
    
    if status in ["Under Contract", "Sold", "Archived"]:
        days_on_market = random.randint(5, 90)
        offer_date_obj = listing_date + timedelta(days=days_on_market)
        offer_date = offer_date_obj.strftime("%Y-%m-%d")
        contract_date = offer_date
        
        if status == "Sold":
            days_to_close = random.randint(30, 60)
            closing_date_obj = offer_date_obj + timedelta(days=days_to_close)
            closing_date = closing_date_obj.strftime("%Y-%m-%d")
            # Ensure closing date isn't in the future for "Sold" unless it's very recent
            if closing_date_obj > datetime.date.today():
                status = "Under Contract" # Correct status if closing is future
                closing_date = "" # Clear closing date if not actually closed yet? Or keep as projected?
                # Actually, let's keep closing date for Under Contract as "Projected Closing"
                closing_date = closing_date_obj.strftime("%Y-%m-%d")
            else:
                # It's a past sale
                pass
        elif status == "Under Contract":
             days_to_close = random.randint(30, 60)
             closing_date_obj = offer_date_obj + timedelta(days=days_to_close)
             closing_date = closing_date_obj.strftime("%Y-%m-%d")

    # Commission Logic
    commission_rate = 0.03 # 3% per side usually
    total_commission_rate = 0.06
    
    # Randomize split
    is_double_ended = random.random() < 0.15 # 15% chance of double ending
    
    buy_side_comm = 0
    sell_side_comm = 0
    
    if is_double_ended:
        buy_side_comm = price * 0.03
        sell_side_comm = price * 0.03
    else:
        # Randomly assign side
        if random.random() < 0.5:
            buy_side_comm = price * 0.03
            sell_side_comm = 0
        else:
            buy_side_comm = 0
            sell_side_comm = price * 0.03
            
    total_comm = buy_side_comm + sell_side_comm
    
    # Company Dollar (Split)
    # Assume 80/20 split for agent
    company_dollar = total_comm * 0.20
    
    # Address
    street_num = random.randint(100, 9999)
    street_names = ["Main St", "Oak Ave", "Maple Dr", "Pine Ln", "Cedar Blvd", "Elm St", "Washington Ave", "Park Pl", "Lakeview Dr", "Hillcrest Rd"]
    address = f"{street_num} {random.choice(street_names)}, {city}, GA 30000"
    
    # Formatting
    def fmt_money(val): return f"${val:,.2f}" if val else ""
    def fmt_date(val): return val if val else ""

    return {
        "Loop View": loop_id,
        "Loop ID": loop_id,
        "Loop Name": address,
        "Loop Status": status,
        "Compliance Status": "Approved" if status == "Sold" else "Pending",
        "Tags": "Top Producer" if price > 800000 else "",
        "Created Date": created_date.strftime("%Y-%m-%d"),
        "Closing Date": closing_date,
        "Expiration Date": (listing_date + timedelta(days=180)).strftime("%Y-%m-%d"),
        "Listing Date": listing_date.strftime("%Y-%m-%d"),
        "Joined Date": created_date.strftime("%Y-%m-%d"),
        "Offer Date": offer_date,
        "Address": address,
        "Price": fmt_money(price),
        "Created By": agent,
        "Created By Admin": "false",
        "Agents": agent,
        "Property Address / City": city,
        "Property Address / Country": "USA",
        "Property Address / County": "Fulton", # Simplified
        "Property Address / State/Prov": "GA",
        "Property Address / Street Name": address.split(" ")[1] + " " + address.split(" ")[2],
        "Property Address / Street Number": str(street_num),
        "Property Address / Zip/Postal Code": "30000",
        "Contract Dates / Closing Date": closing_date,
        "Contract Dates / Contract Agreement Date": contract_date,
        "Financials / Earnest Money Amount": fmt_money(price * 0.01),
        "Financials / Earnest Money Held By": "Broker",
        "Financials / Purchase/Sale Price": fmt_money(price),
        "Financials / Sale Commission Rate": "3%",
        "Financials / Sale Commission Split $ - Buy Side": fmt_money(buy_side_comm),
        "Financials / Sale Commission Split $ - Sell Side": fmt_money(sell_side_comm),
        "Financials / Sale Commission Split % - Buy Side": "3%" if buy_side_comm > 0 else "0%",
        "Financials / Sale Commission Split % - Sell Side": "3%" if sell_side_comm > 0 else "0%",
        "Financials / Sale Commission Total": fmt_money(total_comm),
        "Listing Information / Current Price": fmt_money(price),
        "Listing Information / Original Price": fmt_money(original_price),
        "Listing Information / Listing Date": listing_date.strftime("%m/%d/%Y"),
        "Property / Bathrooms": random.randint(2, 5),
        "Property / Bedrooms": random.randint(3, 6),
        "Property / Lot Size": random.randint(5000, 40000),
        "Property / Square Footage": random.randint(1500, 5000),
        "Property / Type": prop_type,
        "Property / Year Built": random.randint(1980, 2024),
        "Referral / Referral %": "25%" if lead_source == "Referral" else "0%",
        "Referral / Referral Source": lead_source,
        "Company Information / office managing broker": "John Broker",
        "Net to Office": fmt_money(company_dollar) # Adding this explicitly as it's often mapped
    }

# Headers from the user's file + standard ones we need
headers = [
    "Loop View","Loop ID","Loop Name","Loop Status","Compliance Status","Tags","Created Date","Closing Date","Expiration Date","Listing Date","Joined Date","Offer Date","Address","Price","Created By","Created By Admin","Agents","Property Address / City","Property Address / Country","Property Address / County","Property Address / State/Prov","Property Address / Street Name","Property Address / Street Number","Property Address / Zip/Postal Code","Contract Dates / Closing Date","Contract Dates / Contract Agreement Date","Financials / Earnest Money Amount","Financials / Earnest Money Held By","Financials / Purchase/Sale Price","Financials / Sale Commission Rate","Financials / Sale Commission Split $ - Buy Side","Financials / Sale Commission Split $ - Sell Side","Financials / Sale Commission Split % - Buy Side","Financials / Sale Commission Split % - Sell Side","Financials / Sale Commission Total","Listing Information / Current Price","Listing Information / Original Price","Listing Information / Listing Date","Property / Bathrooms","Property / Bedrooms","Property / Lot Size","Property / Square Footage","Property / Type","Property / Year Built","Referral / Referral %","Referral / Referral Source","Company Information / office managing broker", "Net to Office"
]

records = []
for i in range(NUM_RECORDS):
    records.append(generate_record(300000000 + i))

# Write CSV
with open('/home/ubuntu/dotloop-reporter/Demo_Brokerage_Data_2025.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerows(records)

print(f"Generated {NUM_RECORDS} records to /home/ubuntu/dotloop-reporter/Demo_Brokerage_Data_2025.csv")
