#!/usr/bin/env python3
"""
Extract horse racing data from PDF programs using PyMuPDF.
Usage: PYTHONPATH=~/.vendor:$PYTHONPATH python3 extract-race.py <pdf_path>
"""
import sys
import os
import json
import re

def setup_vendor_path():
    """Add vendor path to Python path for mupdf import."""
    vendor_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.vendor')
    if vendor_dir not in sys.path:
        sys.path.insert(0, vendor_dir)
        
def extract_text(pdf_path):
    """Extract text from PDF using PyMuPDF."""
    setup_vendor_path()
    
    try:
        import pymupdf
    except ImportError:
        import fitz as pymupdf
    
    doc = pymupdf.open(pdf_path)
    text = ""
    for page_num, page in enumerate(doc):
        text += f"\n--- PAGE {page_num + 1} ---\n"
        text += page.get_text()
    doc.close()
    return text

def parse_race_data(text):
    """Parse extracted text for race information."""
    race_data = {
        "race_number": None,
        "distance": None,
        "surface": None,
        "track": "RP",  # Default to Remington Park
        "purse": None,
        "entries": []
    }
    
    # Extract race number
    race_match = re.search(r'Race\s+(\d+)', text, re.IGNORECASE)
    if race_match:
        race_data["race_number"] = int(race_match.group(1))
    
    # Extract distance (yards)
    dist_match = re.search(r'(\d+)\s*YARDS?', text, re.IGNORECASE)
    if dist_match:
        race_data["distance"] = int(dist_match.group(1))
    
    # Extract purse
    purse_match = re.search(r'\$?([\d,]+)\s*(?:PURSE|GUARANTEED)', text, re.IGNORECASE)
    if purse_match:
        race_data["purse"] = purse_match.group(1).replace(',', '')
    
    # Extract post positions and horse names
    # Pattern: Post number, color, horse name
    entry_pattern = r'(\d+)\s+(?:Red|White|Blue|Green|Yellow|Orange|Purple|Black|Gray|Brown|Silver|Gold|Aqua|Lime)\s+([^(]+)\s*\(QH\)'
    entries = re.findall(entry_pattern, text, re.IGNORECASE)
    
    # Extract odds (pattern like "5-2" or "10-1")
    odds_pattern = r'(\d{1,2})-(\d)'
    all_odds = re.findall(odds_pattern, text)
    
    # Extract jockey names
    jockey_pattern = r'Jockey:\s*([A-Za-z\s\.]+)'
    jockeys = re.findall(jockey_pattern, text)
    
    # Extract trainer names  
    trainer_pattern = r'Trainer:\s*([A-Za-z\s\.]+)'
    trainers = re.findall(trainer_pattern, text)
    
    return race_data

def main():
    if len(sys.argv) < 2:
        print("Usage: python extract-race.py <pdf_path>")
        print("Or: PYTHONPATH=./.vendor:$PYTHONPATH python extract-race.py <pdf_path>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    if not os.path.exists(pdf_path):
        print(f"Error: File not found: {pdf_path}")
        sys.exit(1)
    
    print(f"Extracting: {pdf_path}")
    print("=" * 60)
    
    text = extract_text(pdf_path)
    
    # Save raw text for inspection
    output_base = os.path.splitext(os.path.basename(pdf_path))[0]
    txt_path = f"/tmp/{output_base}_extracted.txt"
    
    with open(txt_path, 'w') as f:
        f.write(text)
    
    print(f"Raw text saved to: {txt_path}")
    
    # Parse race data
    race_data = parse_race_data(text)
    
    print("\nParsed Race Data:")
    print(json.dumps(race_data, indent=2))
    
    # Show first 2000 chars of text for manual review
    print("\n" + "=" * 60)
    print("EXTRACTED TEXT (first 2000 chars):")
    print("=" * 60)
    print(text[:2000])
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
