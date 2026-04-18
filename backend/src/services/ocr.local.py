#!/usr/bin/env python3
"""
Local OCR extractor for Seahawk shipment labels.

Reads JSON from stdin:
{
  "imageBase64": "<base64 | data-url>",
  "mimeType": "image/jpeg|image/png",
  "knownAwb": "optional-awb"
}

Writes JSON result to stdout with fields expected by ocr.service.js.
"""

from __future__ import annotations

import base64
import json
import re
import sys
import time
from urllib.parse import parse_qs, urlparse

try:
    import cv2
except Exception as exc:  # pragma: no cover - runtime environment guard
    sys.stderr.write(
        f"OCR_LOCAL_SETUP: Missing OpenCV dependency (opencv-python). Error: {exc}\n"
    )
    raise SystemExit(2)

try:
    import numpy as np
except Exception as exc:  # pragma: no cover - runtime environment guard
    sys.stderr.write(
        f"OCR_LOCAL_SETUP: Missing numpy dependency. Error: {exc}\n"
    )
    raise SystemExit(2)

try:
    import zxingcpp
except Exception as exc:  # pragma: no cover - runtime environment guard
    sys.stderr.write(
        f"OCR_LOCAL_SETUP: Missing zxing-cpp dependency. Install with "
        f"'python -m pip install zxing-cpp'. Error: {exc}\n"
    )
    raise SystemExit(2)

try:
    from rapidocr_onnxruntime import RapidOCR
except Exception as exc:  # pragma: no cover - runtime environment guard
    sys.stderr.write(
        f"OCR_LOCAL_SETUP: Missing rapidocr-onnxruntime dependency. Install with "
        f"'python -m pip install rapidocr-onnxruntime'. Error: {exc}\n"
    )
    raise SystemExit(2)


_OCR = None


def get_ocr():
    global _OCR
    if _OCR is None:
        _OCR = RapidOCR()
    return _OCR


def read_payload() -> dict:
    raw = sys.stdin.read().strip()
    if not raw:
        raise ValueError("OCR_LOCAL_RUNTIME: Empty stdin payload.")
    payload = json.loads(raw)
    if not isinstance(payload, dict):
        raise ValueError("OCR_LOCAL_RUNTIME: Payload must be a JSON object.")
    return payload


def normalize_base64(data: str) -> str:
    text = (data or "").strip()
    if not text:
        return ""
    if text.startswith("data:") and "," in text:
        return text.split(",", 1)[1].strip()
    return text


def decode_image(base64_data: str):
    normalized = normalize_base64(base64_data)
    if not normalized:
        raise ValueError("OCR_LOCAL_RUNTIME: imageBase64 is required.")
    binary = base64.b64decode(normalized, validate=False)
    arr = np.frombuffer(binary, dtype=np.uint8)
    image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("OCR_LOCAL_RUNTIME: Could not decode image data.")
    return image


def resize_with_limit(image, fx=1.0, fy=1.0, interpolation=cv2.INTER_CUBIC, max_side=2200):
    resized = cv2.resize(image, None, fx=fx, fy=fy, interpolation=interpolation)
    h, w = resized.shape[:2]
    longest = max(h, w)
    if longest <= max_side:
        return resized
    scale = max_side / float(longest)
    width = max(1, int(round(w * scale)))
    height = max(1, int(round(h * scale)))
    return cv2.resize(resized, (width, height), interpolation=cv2.INTER_AREA)


def barcode_variants(image, extended=False):
    h, w = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (0, 0), 1.2)
    sharp = cv2.addWeighted(gray, 1.8, blur, -0.8, 0)
    _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    adaptive = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 7
    )

    variants = [
        ("orig", image),
        ("gray", gray),
        ("sharp", sharp),
        ("gray_x2", resize_with_limit(gray, fx=2.0, fy=2.0)),
        ("gray_x3", resize_with_limit(gray, fx=3.0, fy=3.0)),
        ("otsu", otsu),
        ("adaptive", adaptive),
    ]
    if not extended:
        return variants

    variants.extend(
        [
            ("gray_x4", resize_with_limit(gray, fx=4.0, fy=4.0)),
            ("otsu_inv", 255 - otsu),
            ("adaptive_inv", 255 - adaptive),
        ]
    )
    if max(h, w) <= 1400:
        variants.append(("gray_x5", cv2.resize(gray, None, fx=5.0, fy=5.0, interpolation=cv2.INTER_CUBIC)))

    crops = [
        ("top_half", image[0 : h // 2, :]),
        ("mid_band", image[h // 4 : (3 * h) // 4, :]),
        ("bottom_half", image[h // 2 :, :]),
        ("left_half", image[:, 0 : w // 2]),
        ("right_half", image[:, w // 2 :]),
        ("top_right", image[0 : h // 2, w // 2 :]),
        ("center", image[h // 3 : (2 * h) // 3, w // 4 : (3 * w) // 4]),
    ]
    for name, crop in crops:
        if crop.size == 0:
            continue
        crop_gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        variants.append((name, crop))
        variants.append(
            (f"{name}_x3", resize_with_limit(crop_gray, fx=3.0, fy=3.0))
        )

    for k, name in ((1, "rot90"), (2, "rot180"), (3, "rot270")):
        rotated = np.rot90(gray, k)
        variants.append((name, rotated))
        variants.append(
            (f"{name}_x3", resize_with_limit(rotated, fx=3.0, fy=3.0))
        )

    return variants


def has_strong_barcode_candidate(candidates):
    for candidate in candidates:
        text = str(candidate.get("text", "")).strip()
        if re.fullmatch(r"\d{10,14}", text):
            return True
        if re.search(r"(?:AwbNo|awb|tracking(?:no|number)?)\s*=\s*[A-Z0-9]{8,16}", text, flags=re.IGNORECASE):
            return True
    return False


def decode_barcodes(image):
    seen = set()
    out = []
    for extended in (False, True):
        for variant_name, variant in barcode_variants(image, extended=extended):
            try:
                decoded = zxingcpp.read_barcodes(variant)
            except Exception:
                decoded = []
            for item in decoded:
                fmt = str(item.format)
                text = (item.text or "").strip()
                if not text:
                    continue
                key = (fmt, text)
                if key in seen:
                    continue
                seen.add(key)
                out.append({"format": fmt, "text": text, "variant": variant_name})
        if out and has_strong_barcode_candidate(out):
            break
    return out


def extract_lines_from_variant(image):
    ocr = get_ocr()
    result, _ = ocr(image)
    lines = []
    for row in result or []:
        text = str(row[1] or "").strip()
        if text:
            lines.append(text)
    return lines


def line_key(value):
    return re.sub(r"[^A-Za-z0-9]+", "", str(value or "")).upper()


def merge_unique_lines(primary, extra):
    merged = []
    seen = set()
    for line in list(primary or []) + list(extra or []):
        text = str(line or "").strip()
        if not text:
            continue
        key = line_key(text)
        if not key or key in seen:
            continue
        seen.add(key)
        merged.append(text)
    return merged


def fallback_ocr_variants(image):
    h, w = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8)).apply(gray)
    variants = [("gray_x2", resize_with_limit(gray, fx=2.0, fy=2.0))]
    crops = [
        ("bottom_half_x3", gray[h // 2 :, :]),
        ("clahe_x2", clahe),
        ("mid_band_x2", gray[h // 4 : (3 * h) // 4, :]),
        ("bottom_half_x2", gray[h // 2 :, :]),
    ]
    for name, crop in crops:
        if crop.size == 0:
            continue
        scale = 3.0 if name.endswith("_x3") else 2.0
        variants.append((name, resize_with_limit(crop, fx=scale, fy=scale)))
    return variants


def extract_lines(image):
    return extract_lines_from_variant(image)


def normalize_city(text: str) -> str:
    value = re.sub(r"[^A-Za-z ]+", " ", text or "")
    value = re.sub(r"\s+", " ", value).strip().upper()
    return value


def find_after_anchor(lines, anchors):
    if not lines:
        return ""
    upper_lines = [line.upper() for line in lines]
    for idx, line in enumerate(upper_lines):
        if any(anchor in line for anchor in anchors):
            for probe in range(idx + 1, min(idx + 7, len(lines))):
                candidate = lines[probe].strip()
                if len(candidate) < 4:
                    continue
                upper = candidate.upper()
                if any(
                    token in upper
                    for token in [
                        "DATE",
                        "TIME",
                        "PIN",
                        "TRACKON",
                        "SIGNATURE",
                        "COPY",
                        "BRANCH",
                        "PHONE",
                        "READTERMS",
                        "OVERLEAF",
                        "BOOKING",
                    ]
                ):
                    continue
                return candidate
    return ""


def parse_destination_and_pin(lines, raw_text):
    disallowed_city_tokens = {
        "PIN CODE",
        "TRACKON",
        "CONSIGNEE",
        "CONSIGNOR",
        "READ TERMS",
        "VISIT US",
        "BOOKING",
        "WEIGHT",
        "VALUE",
        "PCS",
        "VOL",
        "ACTUAL",
        "CHGD",
        "RESTRICTION",
        "DELIVERY",
        "LOCATION",
        "PHONE",
    }

    for line in lines:
        upper = line.upper()
        if "CIN" in upper:
            continue
        match = re.search(r"([A-Za-z][A-Za-z .,&-]{2,40})[-,\s]+(\d{6})\b", line)
        if not match:
            continue
        city = normalize_city(match.group(1))
        pin = match.group(2)
        if city and len(city) >= 3 and not any(token in city for token in disallowed_city_tokens):
            return city, pin

    for line in lines:
        upper = line.upper()
        if "CIN" in upper:
            continue
        match = re.search(r"\b(\d{6})\b", line)
        if match:
            return "", match.group(1)

    text_match = re.search(r"\b(\d{6})\b", raw_text)
    return "", text_match.group(1) if text_match else ""


def parse_amount(raw_text, awb):
    match = re.search(
        r"(?:rs\.?|rupees|cod|amount|value)\s*[:\-]?\s*(\d{2,5}(?:\.\d{1,2})?)",
        raw_text,
        flags=re.IGNORECASE,
    )
    if match:
        numeric = match.group(1)
        if awb and numeric in awb and len(numeric) >= 5:
            return None
        return float(numeric)
    if re.search(r"\btwo\s+thousand\b", raw_text, flags=re.IGNORECASE):
        return 2000.0
    return None


def parse_weight(raw_text):
    match = re.search(
        r"\b(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilograms?)\b",
        raw_text,
        flags=re.IGNORECASE,
    )
    if not match:
        return None
    return float(match.group(1))


def parse_order_no(raw_text):
    match = re.search(
        r"\b(?:order|oid|invoice|ref(?:erence)?|docket|c\s*note|cnote)[\s#:\-]*([A-Z0-9\-/]{4,})\b",
        raw_text,
        flags=re.IGNORECASE,
    )
    return match.group(1) if match else ""


def parse_phone(raw_text):
    match = re.search(r"\b([6-9]\d{9})\b", raw_text)
    return match.group(1) if match else ""


def clean_token(value):
    return re.sub(r"[^A-Za-z0-9]+", "", str(value or "")).upper()


def select_numeric_awb_candidate(raw_text):
    phone = parse_phone(raw_text)
    values = []
    best_value = ""
    best_score = -999
    for match in re.finditer(r"\b\d{10,14}\b", raw_text):
        value = match.group(0)
        values.append(value)
        score = 0
        if value == phone:
            score -= 6
        if value.startswith("91") and len(value) == 12:
            score -= 2
        if re.fullmatch(r"(100|200|500)\d{9}", value):
            score += 6
        elif len(value) >= 11:
            score += 2
        else:
            score += 1

        context = (
            raw_text[max(0, match.start() - 28) : match.start()]
            + " "
            + raw_text[match.end() : match.end() + 28]
        ).lower()
        if any(token in context for token in ["awb", "consignment", "tracking", "docket", "cnote", "waybill"]):
            score += 5
        if any(token in context for token in ["phone", "mobile", "mob", "tel", "+91"]):
            score -= 5
        if any(token in context for token in ["rs", "rupees", "amount", "value"]):
            score -= 1

        if score > best_score:
            best_score = score
            best_value = value

    if best_score >= 1 and best_value:
        return best_value

    unique = []
    for value in values:
        if value not in unique:
            unique.append(value)
    if len(unique) == 1 and unique[0] != phone and len(unique[0]) >= 10:
        return unique[0]
    return ""


def parse_awb(known_awb, barcodes, raw_text):
    if known_awb:
        return known_awb, "known_awb"

    for barcode in barcodes:
        text = clean_token(barcode.get("text", ""))
        if re.fullmatch(r"\d{10,14}", text):
            return text, "barcode"

    for barcode in barcodes:
        text = barcode.get("text", "")
        match = re.search(
            r"(?:AwbNo|awb|tracking(?:\s*(?:no|number))?)\s*[:=]\s*([A-Z0-9\-]{8,16})",
            text,
            flags=re.IGNORECASE,
        )
        if match:
            token = clean_token(match.group(1))
            if token:
                return token, "barcode_qr_url"

    context_match = re.search(
        r"\b(?:awb(?:\s*no)?|consignment\s*number|tracking(?:\s*(?:no|number))?|docket|c\s*note|cnote|waybill)\s*[:#\-]?\s*([A-Z0-9\-]{8,16})\b",
        raw_text,
        flags=re.IGNORECASE,
    )
    if context_match:
        token = clean_token(context_match.group(1))
        if token:
            return token, "ocr_context"

    numeric_candidate = select_numeric_awb_candidate(raw_text)
    if numeric_candidate:
        return numeric_candidate, "ocr_text"

    for barcode in barcodes:
        token = clean_token(barcode.get("text", ""))
        if re.fullmatch(r"[A-Z0-9]{8,16}", token) and re.search(r"[A-Z]", token) and re.search(r"\d", token):
            return token, "barcode_alnum"

    text_token = re.search(r"\b([A-Z]{1,4}\d{6,12})\b", raw_text, flags=re.IGNORECASE)
    if text_token:
        token = clean_token(text_token.group(1))
        if token:
            return token, "ocr_alnum"

    return "", "none"


def detect_courier(raw_text, awb):
    text = (raw_text or "").lower()
    if "trackon" in text:
        return "Trackon"
    if "dtdc" in text:
        return "DTDC"
    if "delhivery" in text:
        return "Delhivery"
    if "bluedart" in text or re.search(r"\bblue\s*dart\b", text):
        return "BlueDart"
    if "xpressbees" in text:
        return "XpressBees"
    if re.fullmatch(r"(100|200|500)\d{9}", awb or ""):
        return "Trackon"
    return ""


def label_type(raw_text):
    lower = (raw_text or "").lower()
    if any(word in lower for word in ["trackon", "dtdc", "delhivery", "bluedart"]):
        return "courier_printed"
    return "marketplace"


def confidence(value, score):
    if value is None:
        return None
    if isinstance(value, str) and not value.strip():
        return None
    return float(score)


def build_response(known_awb, lines, barcodes):
    raw_text = " ".join(lines).strip()
    awb, awb_source = parse_awb(known_awb, barcodes, raw_text)
    destination, pincode = parse_destination_and_pin(lines, raw_text)
    consignee = find_after_anchor(lines, ["CONSIGNEE", "DELIVER TO", " TO "])
    sender_company = find_after_anchor(lines, ["CONSIGNOR", "SHIPPER", "FROM"])
    sender_address = find_after_anchor(lines, ["ADDRESS", "ADDR"])
    amount = parse_amount(raw_text, awb)
    weight = parse_weight(raw_text)
    order_no = parse_order_no(raw_text)
    phone = parse_phone(raw_text)
    courier = detect_courier(raw_text, awb)

    return {
        "success": bool(awb or raw_text),
        "labelType": label_type(raw_text),
        "awb": awb,
        "courier": courier,
        "clientName": sender_company,
        "clientNameConfidence": confidence(sender_company, 0.55),
        "clientNameSource": "ocr_direct" if sender_company else "",
        "senderName": "",
        "senderCompany": sender_company,
        "senderAddress": sender_address,
        "merchant": "",
        "consignee": consignee,
        "consigneeConfidence": confidence(consignee, 0.50),
        "phone": phone,
        "destination": destination,
        "destinationConfidence": confidence(destination, 0.75),
        "pincode": pincode,
        "pincodeConfidence": confidence(pincode, 0.90),
        "returnAddress": "",
        "weight": weight,
        "weightConfidence": confidence(weight, 0.65),
        "amount": amount,
        "amountConfidence": confidence(amount, 0.65),
        "orderNo": order_no,
        "oid": "",
        "rawText": raw_text,
        "awbSource": awb_source,
        "barcodeCandidates": barcodes,
    }


def run_payload(payload: dict):
    image_base64 = payload.get("imageBase64") or payload.get("base64Data") or ""
    known_awb = str(payload.get("knownAwb") or "").strip()
    image = decode_image(image_base64)
    barcodes = decode_barcodes(image)
    lines = extract_lines(image)
    response = build_response(known_awb, lines, barcodes)

    # Retry OCR with stronger preprocessing only for weak AWB outcomes.
    if not response.get("awb"):
        merged_lines = list(lines or [])
        fallback_deadline = time.perf_counter() + 35.0
        for _, variant in fallback_ocr_variants(image):
            if time.perf_counter() >= fallback_deadline:
                break
            variant_lines = extract_lines_from_variant(variant)
            if not variant_lines:
                continue
            merged_lines = merge_unique_lines(merged_lines, variant_lines)
            enriched = build_response(known_awb, merged_lines, barcodes)
            if enriched.get("awb"):
                response = enriched
                break
            if len(enriched.get("rawText", "")) > len(response.get("rawText", "")):
                response = enriched

    return response


def run_once():
    payload = read_payload()
    response = run_payload(payload)
    sys.stdout.write(json.dumps(response))


def run_server():
    for raw_line in sys.stdin:
        line = raw_line.strip()
        if not line:
            continue
        req_id = None
        try:
            message = json.loads(line)
            req_id = message.get("id")
            payload = message.get("payload") or {}
            result = run_payload(payload)
            response = {"id": req_id, "ok": True, "result": result}
        except Exception as exc:
            response = {"id": req_id, "ok": False, "error": str(exc)}
        sys.stdout.write(json.dumps(response) + "\n")
        sys.stdout.flush()


if __name__ == "__main__":
    try:
        if len(sys.argv) > 1 and sys.argv[1] == "--server":
            run_server()
        else:
            run_once()
    except Exception as exc:
        sys.stderr.write(f"OCR_LOCAL_RUNTIME: {exc}\n")
        raise SystemExit(1)
