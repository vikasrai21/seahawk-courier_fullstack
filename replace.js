const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/MobileScannerPage.jsx', 'utf8');

// 1. Replace ScannerOverlays
content = content.replace(
  /\{\/\* ——— Flash overlay ——— \*\/\}[\s\S]*?Use this to verify whether Trackon labels.*?<\/div>\s*<\/div>\s*\)\}/g,
  '<ScannerOverlays flash={flash} setFlash={setFlash} duplicateWarning={duplicateWarning} diagnosticsOpen={diagnosticsOpen} setDiagnosticsOpen={setDiagnosticsOpen} diagnosticsRows={diagnosticsRows} />'
);

// 2. Replace ConnectionScreen
content = content.replace(
  /\{\/\* ═══ IDLE \/ CONNECTING ═══ \*\/\}[\s\S]*?\{\/\* ═══ PERSISTENT CAMERA VIDEO ═══ \*\/\}/g,
  '<ConnectionScreen connStatus={connStatus} errorMsg={errorMsg} isStandalone={isStandalone} pin={pin} stepClass={stepClass} STEPS={STEPS} theme={theme} />\n\n        {/* ═══ PERSISTENT CAMERA VIDEO ═══ */}'
);

// 3. Replace PreviewView
content = content.replace(
  /\{\/\* ═══ PREVIEW ═══ \*\/\}[\s\S]*?\{\/\* ═══ PROCESSING ═══ \*\/\}/g,
  '<PreviewView stepClass={stepClass} STEPS={STEPS} theme={theme} lockedAwb={lockedAwb} capturedImage={capturedImage} captureMeta={captureMeta} goStep={goStep} setCapturedImage={setCapturedImage} submitForProcessing={submitForProcessing} />\n\n        {/* ═══ PROCESSING ═══ */}'
);

// 4. Replace ProcessingView
content = content.replace(
  /\{\/\* ═══ PROCESSING ═══ \*\/\}[\s\S]*?\{\/\* ═══ REVIEWING ═══ \*\/\}/g,
  '<ProcessingView stepClass={stepClass} STEPS={STEPS} theme={theme} lockedAwb={lockedAwb} capturedImage={capturedImage} goStep={goStep} setErrorMsg={setErrorMsg} />\n\n        {/* ═══ REVIEWING ═══ */}'
);

// 5. Replace ReviewPanel
content = content.replace(
  /\{\/\* ═══ REVIEWING ═══ \*\/\}[\s\S]*?\{\/\* ═══ APPROVING ═══ \*\/\}/g,
  '<ReviewPanel stepClass={stepClass} STEPS={STEPS} step={step} theme={theme} reviewData={reviewData} reviewForm={reviewForm} setReviewForm={setReviewForm} lockedAwb={lockedAwb} reviewCourier={reviewCourier} inferredCourier={inferredCourier} intelligence={intelligence} reviewConfidence={reviewConfidence} fieldConfidence={fieldConfidence} stickyClientCode={stickyClientCode} setStickyClientCode={setStickyClientCode} reviewDateLabel={reviewDateLabel} swipeProgress={swipeProgress} handleSwipeTouchStart={handleSwipeTouchStart} handleSwipeTouchMove={handleSwipeTouchMove} handleSwipeTouchEnd={handleSwipeTouchEnd} confDotClass={confDotClass} sourceLabel={sourceLabel} normalizeClientCode={normalizeClientCode} lookupPincodeCity={lookupPincodeCity} pulseHaptic={pulseHaptic} cycleReviewCourier={cycleReviewCourier} copyAwb={copyAwb} awbCopied={awbCopied} submitApproval={submitApproval} resetForNextScan={resetForNextScan} isStandalone={isStandalone} navigate={navigate} />\n\n        {/* ═══ APPROVING ═══ */}'
);

// 6. Replace ResultScreens
content = content.replace(
  /\{\/\* ═══ APPROVING ═══ \*\/\}[\s\S]*?(?=\{\/\* Global keyframes \*\/)/g,
  '<ResultScreens stepClass={stepClass} STEPS={STEPS} step={step} theme={theme} reviewData={reviewData} lockedAwb={lockedAwb} lastSuccess={lastSuccess} errorMsg={errorMsg} offlineQueue={offlineQueue} sessionCtx={sessionCtx} totalWeight={totalWeight} sessionDuration={sessionDuration} successAutoSeconds={successAutoSeconds} scanWorkflowMode={scanWorkflowMode} connStatus={connStatus} showLockRing={showLockRing} setShowLockRing={setShowLockRing} sessionSummaryOpen={sessionSummaryOpen} setSessionSummaryOpen={setSessionSummaryOpen} confirmDialog={confirmDialog} getCourierPalette={getCourierPalette} normalizeReviewCourier={normalizeReviewCourier} goStep={goStep} resetForNextScan={resetForNextScan} setErrorMsg={setErrorMsg} terminateSession={terminateSession} approvalResultTimerRef={approvalResultTimerRef} />\n\n      '
);

fs.writeFileSync('frontend/src/pages/MobileScannerPage.jsx', content);
console.log("Lines remaining:", content.split("\\n").length);
