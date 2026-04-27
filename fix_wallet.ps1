$file = "c:\Users\hp\OneDrive\Desktop\seahawk-full_stack\frontend\src\pages\client\ClientWalletPage.jsx"
$content = [System.IO.File]::ReadAllText($file)
$content = $content.Replace('LTD #', 'Account #')
$content = $content.Replace('Wallet Control Center', 'Wallet')
$content = $content.Replace("Manage wallet balance, top-up rules, and transaction flow from one premium financial desk.", "Manage your wallet balance, recharge, and view transaction history.")
[System.IO.File]::WriteAllText($file, $content)
Write-Host "Done - 3 replacements applied"
