import Link from 'next/link';

export function CommunityFooter() {
  return (
    <footer className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-2">
      <div className="flex items-center gap-6 text-xs text-slate-400">
        <Link href="/about" className="hover:text-[#043658]">About</Link>
        <Link href="/privacy" className="hover:text-[#043658]">Privacy Policy</Link>
        <Link href="/help" className="hover:text-[#043658]">Help Center</Link>
        <Link href="/cookies" className="hover:text-[#043658]">Cookie Policy</Link>
      </div>
      <p className="text-xs text-slate-300">© 2026 ServeLink Community. All rights reserved.</p>
    </footer>
  );
}
