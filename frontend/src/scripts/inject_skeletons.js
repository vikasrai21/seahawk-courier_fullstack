import fs from 'fs';
import path from 'path';

const targetFiles = [
  'AllShipmentsPage.jsx',
  'InvoicesPage.jsx',
  'ClientsPage.jsx',
  'WalletPage.jsx',
  'NDRPage.jsx',
  'BookingsPage.jsx',
  'ReconciliationPage.jsx',
  'UsersPage.jsx',
  'ContractsPage.jsx'
];

const dir = 'c:/Users/hp/OneDrive/Desktop/seahawk-full_stack/frontend/src/pages';

targetFiles.forEach(file => {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`[!] Skipped ${file} (not found)`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Replace {loading ? <PageLoader /> : ...
  if (content.includes('<PageLoader />')) {
    if (!content.includes('SkeletonTable')) {
       content = "import { SkeletonTable } from '../components/ui/Skeleton';\n" + content;
    }
    content = content.replace(/\{loading \? <PageLoader \/>/g, '{loading ? <div className="p-6"><SkeletonTable rows={8} cols={6} /></div>');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[✓] Updated ${file}`);
  } else {
    console.log(`[-] No matching <PageLoader /> found in ${file}`);
  }
});
