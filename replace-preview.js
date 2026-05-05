const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/MobileScannerPage.jsx', 'utf8');

const previewReplacement = `
        {/* ═══ IDLE / HOME & SCANNING VIEWS ═══ */}
        <PreviewView
          step={step}
          STEPS={STEPS}
          stepClass={stepClass}
          theme={theme}
          connStatus={connStatus}
          sessionCtx={sessionCtx}
          totalWeight={totalWeight}
          sessionDuration={sessionDuration}
          handleSessionCompletion={handleSessionCompletion}
          setStep={setStep}
          startScanWorkflow={startScanWorkflow}
          offlineQueue={offlineQueue}
          formatDisplayDate={formatDisplayDate}
          editingQueueItemId={editingQueueItemId}
          editingQueueDate={editingQueueDate}
          setEditingQueueDate={setEditingQueueDate}
          queueActionBusyId={queueActionBusyId}
          saveQueueDateEdit={saveQueueDateEdit}
          cancelQueueDateEdit={cancelQueueDateEdit}
          beginQueueDateEdit={beginQueueDateEdit}
          deleteQueueItem={deleteQueueItem}
          scanbotRef={scanbotRef}
          guideRef={guideRef}
          guideLocked={guideLocked}
          scanMode={scanMode}
          BARCODE_SCAN_REGION={BARCODE_SCAN_REGION}
          DOC_CAPTURE_REGION={DOC_CAPTURE_REGION}
          errorMsg={errorMsg}
          isStandalone={isStandalone}
          pin={pin}
          scannerEngine={scannerEngine}
          scanWorkflowMode={scanWorkflowMode}
          barcodeReframeCount={barcodeReframeCount}
          BARCODE_REFRAME_ATTEMPTS={BARCODE_REFRAME_ATTEMPTS}
          handleCaptureWithoutBarcode={handleCaptureWithoutBarcode}
          syncBarcodeFailCount={syncBarcodeFailCount}
          syncBarcodeReframeCount={syncBarcodeReframeCount}
          setErrorMsg={setErrorMsg}
          setScanMode={setScanMode}
          pulseHaptic={pulseHaptic}
          setScanWorkflowMode={setScanWorkflowMode}
          voiceEnabled={voiceEnabled}
          setVoiceEnabled={setVoiceEnabled}
          DEVICE_PROFILES={DEVICE_PROFILES}
          deviceProfile={deviceProfile}
          setDeviceProfile={setDeviceProfile}
          manualAwb={manualAwb}
          setManualAwb={setManualAwb}
          handleManualAwbSubmit={handleManualAwbSubmit}
          saveAndUpload={saveAndUpload}
          setSessionSummaryOpen={setSessionSummaryOpen}
          normalizeReviewCourier={normalizeReviewCourier}
          getCourierPalette={getCourierPalette}
          ISO_DATE_REGEX={ISO_DATE_REGEX}
          setConfirmDialog={setConfirmDialog}
        />`;

const lines = c.split(/\r?\n/);
const startIdx = lines.findIndex(l => l.includes('{/* ═══ IDLE / HOME ═══ */}'));
const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('{/* ═══ CAPTURING (Document mode) ═══ */}'));

if (startIdx !== -1 && endIdx !== -1) {
    lines.splice(startIdx, endIdx - startIdx, previewReplacement);
    fs.writeFileSync('frontend/src/pages/MobileScannerPage.jsx', lines.join('\n'));
    console.log('Successfully replaced PreviewView block. Lines removed:', endIdx - startIdx);
} else {
    console.log('Error finding blocks', startIdx, endIdx);
}
