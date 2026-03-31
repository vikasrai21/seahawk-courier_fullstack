import sys
import subprocess

def extract_pdf(pdf_path):
    try:
        # Try using pdftotext if available on the system
        result = subprocess.run(['pdftotext', '-layout', pdf_path, '-'], capture_output=True, text=True)
        if result.returncode == 0:
            print(result.stdout)
        else:
            print(f"Error extracting PDF: {result.stderr}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    extract_pdf(sys.argv[1])
