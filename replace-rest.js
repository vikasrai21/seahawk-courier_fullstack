const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/MobileScannerPage.jsx', 'utf8');

const processingReplacement = `
        {/* ═══ PROCESSING (OCR) ═══ */}
        <ProcessingView
          step={step}
          STEPS={STEPS}
          stepClass={stepClass}
          theme={theme}
          capturedImage={capturedImage}
          docDetected={docDetected}
          docStableTicks={docStableTicks}
          BARCODE_FAIL_THRESHOLD={BARCODE_FAIL_THRESHOLD}
          captureQuality={captureQuality}
        />`;

const reviewReplacement = `
        {/* ═══ REVIEW ═══ */}
        <ReviewPanel
          step={step}
          STEPS={STEPS}
          stepClass={stepClass}
          theme={theme}
          reviewData={reviewData}
          reviewForm={reviewForm}
          setReviewForm={setReviewForm}
          setStep={setStep}
          pulseHaptic={pulseHaptic}
          ensureVideoStreamPlaying={ensureVideoStreamPlaying}
          videoRef={videoRef}
          errorMsg={errorMsg}
          handleFinalSubmit={handleFinalSubmit}
          confDotClass={confDotClass}
          sourceLabel={sourceLabel}
          startScanWorkflow={startScanWorkflow}
          clearOfflineQueue={clearOfflineQueue}
          manualAwb={manualAwb}
        />`;

const resultReplacement = `
        {/* ═══ SUCCESS / ERROR SCREENS ═══ */}
        <ResultScreens
          step={step}
          STEPS={STEPS}
          stepClass={stepClass}
          theme={theme}
          lastSuccess={lastSuccess}
          errorMsg={errorMsg}
          startScanWorkflow={startScanWorkflow}
          setStep={setStep}
          clearOfflineQueue={clearOfflineQueue}
          manualAwb={manualAwb}
        />`;

const lines = c.split(/\r?\n/);

const processStart = lines.findIndex(l => l.includes('{/* ═══ PROCESSING (OCR) ═══ */}'));
const reviewStart = lines.findIndex(l => l.includes('{/* ═══ REVIEW ═══ */}'));
const resultStart = lines.findIndex(l => l.includes('{/* ═══ SUCCESS / ERROR SCREENS ═══ */}'));
const resultEnd = lines.findIndex((l, i) => i > resultStart && l.includes('</>')); // End of component

if (processStart !== -1 && reviewStart !== -1 && resultStart !== -1 && resultEnd !== -1) {
    // Replace backwards to not mess up indices
    lines.splice(resultStart, (resultEnd - 1) - resultStart, resultReplacement); // up to the closing div before </>
    lines.splice(reviewStart, resultStart - reviewStart, reviewReplacement);
    lines.splice(processStart, reviewStart - processStart, processingReplacement);
    
    fs.writeFileSync('frontend/src/pages/MobileScannerPage.jsx', lines.join('\n'));
    console.log('Successfully replaced remaining blocks.');
} else {
    console.log('Error finding blocks', {processStart, reviewStart, resultStart, resultEnd});
}
