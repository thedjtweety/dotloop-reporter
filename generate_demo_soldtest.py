
import csv
import random
import datetime
from datetime import timedelta

# Configuration
NUM_RECORDS = 400
AGENTS = [
    "Sarah Miller", "James Wilson", "Emily Chen", "Michael Brown", "Jessica Davis",
    "David Martinez", "Jennifer Taylor", "Robert Anderson", "Lisa Thomas", "William Jackson",
    "Elizabeth White", "Christopher Harris", "Ashley Martin", "Matthew Thompson", "Amanda Garcia"
]
LEAD_SOURCES = ["Zillow", "Referral", "Open House", "Sphere of Influence", "Facebook Ads", "Realtor.com", "Walk-in", "Direct Mail", "Past Client", "Agent Website"]
PROPERTY_TYPES = ["SingleFamily", "Condo", "Townhouse", "MultiFamily", "Land"]
CITIES = ["Boston", "Cambridge", "Somerville", "Brookline", "Newton", "Quincy", "Waltham", "Medford", "Malden", "Arlington"]
STATUSES = ["Sold", "Sold", "Sold", "Sold", "Active Listing", "Active Listing", "Under Contract", "Under Contract", "Archived"]

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
    if prop_type == "SingleFamily":
        base_price = random.randint(450, 2500) * 1000
    elif prop_type == "Condo":
        base_price = random.randint(300, 900) * 1000
    elif prop_type == "Townhouse":
        base_price = random.randint(400, 1200) * 1000
    elif prop_type == "MultiFamily":
        base_price = random.randint(600, 3000) * 1000
    elif prop_type == "Land":
        base_price = random.randint(100, 800) * 1000
    else:
        base_price = random.randint(300, 800) * 1000

    # Psychological pricing
    if random.random() < 0.7:
        price = base_price - 100 
    else:
        price = base_price

    # Original price logic
    if random.random() < 0.6:
        original_price = price + (random.randint(10, 100) * 1000)
    else:
        original_price = price
    
    # Dates logic
    listing_date = random_date(START_DATE, END_DATE - timedelta(days=60))
    created_date = listing_date
    
    offer_date = ""
    closing_date = ""
    contract_date = ""
    
    # Ensure future dates for pipeline items to populate Commission Projector
    if status in ["Under Contract", "Active Listing"]:
        # Force closing date to be in the future (next 15-85 days)
        days_to_future_close = random.randint(15, 85)
        closing_date_obj = datetime.date.today() + timedelta(days=days_to_future_close)
        closing_date = closing_date_obj.strftime("%Y-%m-%d")
        
        # Back-calculate offer date
        offer_date_obj = closing_date_obj - timedelta(days=45)
        offer_date = offer_date_obj.strftime("%Y-%m-%d")
        contract_date = offer_date

    elif status in ["Sold", "Archived"]:
        days_on_market = random.randint(5, 90)
        offer_date_obj = listing_date + timedelta(days=days_on_market)
        offer_date = offer_date_obj.strftime("%Y-%m-%d")
        contract_date = offer_date
        
        days_to_close = random.randint(30, 60)
        closing_date_obj = offer_date_obj + timedelta(days=days_to_close)
        closing_date = closing_date_obj.strftime("%Y-%m-%d")
        
        # If calculated closing date is in future, flip to Under Contract
        if closing_date_obj > datetime.date.today():
            status = "Under Contract"
            closing_date = closing_date_obj.strftime("%Y-%m-%d")

    # Commission Logic
    commission_rate = 0.025 # 2.5% per side in this market
    
    # Randomize split
    is_double_ended = random.random() < 0.10
    
    buy_side_comm = 0
    sell_side_comm = 0
    
    if is_double_ended:
        buy_side_comm = price * commission_rate
        sell_side_comm = price * commission_rate
    else:
        if random.random() < 0.5:
            buy_side_comm = price * commission_rate
            sell_side_comm = 0
        else:
            buy_side_comm = 0
            sell_side_comm = price * commission_rate
            
    total_comm = buy_side_comm + sell_side_comm
    
    # Address
    street_num = random.randint(1, 999)
    street_names = ["Beacon St", "Commonwealth Ave", "Boylston St", "Tremont St", "Washington St", "Massachusetts Ave", "Cambridge St", "Broadway", "Main St", "High St"]
    address = f"{street_num} {random.choice(street_names)}, {city}, MA 021{random.randint(10, 99)}"
    
    def fmt_money(val): return f"{val:.2f}" if val else ".00"
    def fmt_date(val): return val if val else ""

    return {
        "Loop View": loop_id,
        "Loop ID": loop_id,
        "Loop Name": address,
        "Loop Status": status,
        "Compliance Status": "Approved" if status == "Sold" else "Pending",
        "Tags": "Luxury" if price > 1500000 else "",
        "Created Date": created_date.strftime("%Y-%m-%d"),
        "Closing Date": closing_date,
        "Expiration Date": (listing_date + timedelta(days=180)).strftime("%Y-%m-%d"),
        "Listing Date": listing_date.strftime("%Y-%m-%d"),
        "Joined Date": created_date.strftime("%Y-%m-%d"),
        "Offer Date": offer_date,
        "Address": address,
        "Price": fmt_money(price), # Populating Price to ensure visibility in dashboard
        "Created By": agent,
        "Created By Admin": "false",
        "Agents": agent, # Populating Agents column to ensure Leaderboard works
        "Property Address / City, State/Prov, Zip/Postal Code (Address 2)": f"{city}, MA 021{random.randint(10, 99)}",
        "Property Address / Street Number, Street Name, Unit Number (Address 1)": f"{street_num} {address.split(',')[0].split(' ', 1)[1]}",
        "Car / other_terms": "",
        "Contract Dates / Closing Date": closing_date,
        "Contract Dates / Contract Agreement Date": contract_date,
        "Financials / Earnest Money Amount": fmt_money(price * 0.05),
        "Financials / Earnest Money Held By": "Brokerage",
        "Financials / Purchase/Sale Price": fmt_money(price),
        "Financials / Sale Commission Rate": "2.5",
        "Financials / Sale Commission Split $ - Buy Side": fmt_money(buy_side_comm),
        "Financials / Sale Commission Split $ - Sell Side": fmt_money(sell_side_comm),
        "Financials / Sale Commission Split % - Buy Side": "2.5" if buy_side_comm > 0 else "0",
        "Financials / Sale Commission Split % - Sell Side": "2.5" if sell_side_comm > 0 else "0",
        "Financials / Sale Commission Total": fmt_money(total_comm),
        "Geographic Description / Legal Description": "",
        "Lead Source / Lead Source": lead_source,
        "Listing Information / Current Price": fmt_money(price),
        "Listing Information / Expiration Date": (listing_date + timedelta(days=180)).strftime("%Y-%m-%d"),
        "Listing Information / Homeowner's Association Dues": str(random.randint(200, 800)) if prop_type == "Condo" else "",
        "Listing Information / Listing Date": listing_date.strftime("%m/%d/%Y"),
        "Listing Information / Original Price": fmt_money(original_price),
        "Listing Information / Property Excludes": "",
        "Listing Information / Remarks": "Beautiful property in prime location.",
        "Offer Dates / Occupancy Date": closing_date,
        "Property / Bathrooms": str(random.randint(1, 4)),
        "Property / Bedrooms": str(random.randint(2, 6)),
        "Property / Lot Size": str(random.randint(1000, 10000)),
        "Property / Square Footage": str(random.randint(800, 4000)),
        "Property / Type": prop_type,
        "Property / Year Built": str(random.randint(1900, 2024)),
        "Property Address / City": city,
        "Property Address / Country": "USA",
        "Property Address / County": "Suffolk",
        "Property Address / Full Address": address,
        "Property Address / MLS Number": str(random.randint(70000000, 79999999)),
        "Property Address / Parcel/Tax ID": "",
        "Property Address / State/Prov": "MA",
        "Property Address / Street Name": address.split(',')[0].split(' ', 1)[1],
        "Property Address / Street Number": str(street_num),
        "Property Address / Unit Number": "",
        "Property Address / Zip/Postal Code": f"021{random.randint(10, 99)}",
        "Referral / LEAD SOURCE": lead_source,
        "Referral / Referral %": "25" if lead_source == "Referral" else "0",
        "Referral / Referral Source": lead_source if lead_source == "Referral" else ""
    }

headers = [
    "Loop View","Loop ID","Loop Name","Loop Status","Compliance Status","Tags","Created Date","Closing Date","Expiration Date","Listing Date","Joined Date","Offer Date","Address","Price","Created By","Created By Admin","Agents","Property Address / City, State/Prov, Zip/Postal Code (Address 2)","Property Address / Street Number, Street Name, Unit Number (Address 1)","Car / other_terms","Contract Dates / Closing Date","Contract Dates / Contract Agreement Date","Financials / Earnest Money Amount","Financials / Earnest Money Held By","Financials / Purchase/Sale Price","Financials / Sale Commission Rate","Financials / Sale Commission Split $ - Buy Side","Financials / Sale Commission Split $ - Sell Side","Financials / Sale Commission Split % - Buy Side","Financials / Sale Commission Split % - Sell Side","Financials / Sale Commission Total","Geographic Description / Legal Description","Lead Source / Lead Source","Listing Information / Current Price","Listing Information / Expiration Date","Listing Information / Homeowner's Association Dues","Listing Information / Listing Date","Listing Information / Original Price","Listing Information / Property Excludes","Listing Information / Remarks","Offer Dates / Occupancy Date","Property / Bathrooms","Property / Bedrooms","Property / Lot Size","Property / Square Footage","Property / Type","Property / Year Built","Property Address / City","Property Address / Country","Property Address / County","Property Address / Full Address","Property Address / MLS Number","Property Address / Parcel/Tax ID","Property Address / State/Prov","Property Address / Street Name","Property Address / Street Number","Property Address / Unit Number","Property Address / Zip/Postal Code","Referral / LEAD SOURCE","Referral / Referral %","Referral / Referral Source"
]

records = []
for i in range(NUM_RECORDS):
    records.append(generate_record(300000000 + i))

with open('/home/ubuntu/dotloop-reporter/Demo_SoldTest_Data_2025.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    writer.writerows(records)

print(f"Generated {NUM_RECORDS} records to /home/ubuntu/dotloop-reporter/Demo_SoldTest_Data_2025.csv")
