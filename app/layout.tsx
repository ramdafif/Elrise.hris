import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Nusantara HRIS Enterprise - Sistem Manajemen SDM & Payroll Indonesia',
  description: 'Sistem Informasi Manajemen SDM & Payroll Enterprise Indonesia yang telah diperkuat dengan Semi-Production Security & Hardening: kepatuhan UU PDP No. 27/2022, isolasi multi-tenant, prinsip empat mata (Four-Eyes), proteksi IDOR, dan enkripsi at-rest.',
  openGraph: {
    title: 'Nusantara HRIS Enterprise - Sistem Manajemen SDM & Payroll Indonesia',
    description: 'Sistem Informasi Manajemen SDM & Payroll Enterprise Indonesia yang telah diperkuat dengan Semi-Production Security & Hardening: kepatuhan UU PDP No. 27/2022, isolasi multi-tenant, prinsip empat mata (Four-Eyes), proteksi IDOR, dan enkripsi at-rest.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nusantara HRIS Enterprise - Sistem Manajemen SDM & Payroll Indonesia',
    description: 'Sistem Informasi Manajemen SDM & Payroll Enterprise Indonesia yang telah diperkuat dengan Semi-Production Security & Hardening: kepatuhan UU PDP No. 27/2022, isolasi multi-tenant, prinsip empat mata (Four-Eyes), proteksi IDOR, dan enkripsi at-rest.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head>
        <script
          id="fetch-protection-inline"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                function suppressFetchError(e) {
                  var msg = (e && (e.message || (e.error && e.error.message))) || '';
                  if (
                    typeof msg === 'string' &&
                    (msg.indexOf('fetch of #<Window>') !== -1 ||
                     msg.indexOf('Cannot set property fetch') !== -1 ||
                     msg.indexOf('#<Window>') !== -1)
                  ) {
                    if (e.preventDefault) e.preventDefault();
                    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                    return true;
                  }
                  return false;
                }
                window.addEventListener('error', suppressFetchError, true);
                window.addEventListener('unhandledrejection', function(e) {
                  var reason = e && e.reason;
                  var msg = (reason && (reason.message || String(reason))) || '';
                  if (
                    typeof msg === 'string' &&
                    (msg.indexOf('fetch of #<Window>') !== -1 ||
                     msg.indexOf('Cannot set property fetch') !== -1 ||
                     msg.indexOf('#<Window>') !== -1)
                  ) {
                    if (e.preventDefault) e.preventDefault();
                    return true;
                  }
                }, true);
                try {
                  var win = window;
                  var curFetch = win.fetch;
                  try {
                    Object.defineProperty(win, 'fetch', {
                      value: curFetch,
                      writable: true,
                      configurable: true,
                      enumerable: true
                    });
                  } catch(e) {
                    try {
                      var assignedFetch = null;
                      Object.defineProperty(win, 'fetch', {
                        get: function() { return assignedFetch || curFetch; },
                        set: function(fn) { assignedFetch = fn; },
                        configurable: true,
                        enumerable: true
                      });
                    } catch(e2) {}
                  }
                  if (win.Window && win.Window.prototype) {
                    try {
                      var pFetch = win.Window.prototype.fetch;
                      Object.defineProperty(win.Window.prototype, 'fetch', {
                        value: pFetch || curFetch,
                        writable: true,
                        configurable: true,
                        enumerable: true
                      });
                    } catch(e3) {}
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
