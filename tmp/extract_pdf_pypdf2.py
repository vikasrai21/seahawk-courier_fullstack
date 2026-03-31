import PyPDF2
import sys

def extract_pdf_pypdf2(pdf_path):
    try:
        with open(pdf_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            print(text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract_pdf_pypdf2(sys.argv[1])
