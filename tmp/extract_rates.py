import pandas as pd
import sys

def extract_excel(file_path):
    try:
        df = pd.read_excel(file_path)
        print("--- HEADER ---")
        print(df.columns.tolist())
        print("--- DATA ---")
        print(df.to_string())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract_excel(sys.argv[1])
