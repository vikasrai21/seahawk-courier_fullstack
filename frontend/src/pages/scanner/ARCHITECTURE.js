// HomeScreen and CaptureView remain inline in MobileScannerPage.jsx
// because they are tightly coupled to camera refs (videoRef, scanbotRef,
// canvasRef) and real-time barcode scanning loops. Extracting them would
// require forwarding 20+ refs and risk breaking the camera lifecycle.
//
// These are intentionally NOT extracted as sub-components.
// The following components ARE safely extracted:
//
// - ScannerOverlays  → flash, duplicate warning, diagnostics panel
// - ConnectionScreen → connecting/disconnected state
// - PreviewView      → captured image preview + retake/submit
// - ProcessingView   → OCR skeleton loader
// - ReviewPanel      → review form + swipe gestures
// - ResultScreens    → approving/success/error/session summary/confirm
//
// This file exists as documentation only.
export {};
