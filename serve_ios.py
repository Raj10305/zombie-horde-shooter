"""Local Wi-Fi HTTP server to install and play DEADLINE: SKYFIRE on iOS devices."""

import http.server
import os
import socket
import socketserver

PORT = 8080
ROOT = os.path.dirname(os.path.abspath(__file__))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


def get_lan_ips():
    ips = set()
    try:
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None, socket.AF_INET):
            ip = info[4][0]
            if not ip.startswith("127."):
                ips.add(ip)
    except Exception:
        pass
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        if not ip.startswith("127."):
            ips.add(ip)
        s.close()
    except Exception:
        pass
    return sorted(ips) or ["localhost"]


def main():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("0.0.0.0", PORT), NoCacheHandler) as httpd:
        ips = get_lan_ips()
        print("=" * 64)
        print("DEADLINE: SKYFIRE - iOS Mobile Wi-Fi Server")
        print("=" * 64)
        print("Make sure your iPhone/iPad is on the same Wi-Fi network.")
        print("Open Safari on iOS and visit:")
        for ip in ips:
            print(f"  ->  http://{ip}:{PORT}")
        print("")
        print("To install as a full-screen iOS app:")
        print("  1. Open the URL above in Safari on your iPhone/iPad")
        print("  2. Tap the Share icon (square with upward arrow)")
        print("  3. Tap 'Add to Home Screen' -> 'Add'")
        print("  4. Launch 'SKYFIRE' from your Home Screen (works offline!)")
        print("")
        print("Press Ctrl+C to stop the server.")
        print("=" * 64)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")


if __name__ == "__main__":
    main()
