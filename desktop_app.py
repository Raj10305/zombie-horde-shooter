"""Standalone Desktop App Launcher for DEADLINE: SKYFIRE (Windows .exe & macOS .app)."""

import functools
import http.server
import os
import socketserver
import sys
import threading
import webbrowser


def get_www_dir():
    base = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
    www = os.path.join(base, "www")
    if os.path.isdir(www):
        return www
    return base


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def start_local_server(directory):
    handler = functools.partial(QuietHandler, directory=directory)
    server = ThreadedHTTPServer(("127.0.0.1", 0), handler)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, port


def main():
    www_dir = get_www_dir()
    server, port = start_local_server(www_dir)
    url = f"http://127.0.0.1:{port}/index.html"

    try:
        import webview

        webview.create_window(
            "DEADLINE: SKYFIRE",
            url,
            width=1280,
            height=800,
            min_size=(900, 600),
            resizable=True,
        )
        webview.start()
    except Exception:
        webbrowser.open(url)
        try:
            threading.Event().wait()
        except KeyboardInterrupt:
            pass
    finally:
        server.shutdown()


if __name__ == "__main__":
    main()
