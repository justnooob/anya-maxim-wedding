import 'server-only';
import definitions from '@/server/wishlist/approved-2026-11-04.json';
import {approvedImportAdminRequest} from '@/server/wishlist/approved-admin.mjs';
import {verifyApprovedAsset} from '@/server/wishlist/approved-assets.mjs';

export const runtime='nodejs';
export const dynamic='force-dynamic';

export function POST(request:Request){
 return approvedImportAdminRequest(request,{definitions,verifyAsset:verifyApprovedAsset});
}
