from http.server import BaseHTTPRequestHandler
import json
import base64
import io

# NOTE: Rate limiting is handled at the Vercel infrastructure level.
# For additional protection, consider configuring Vercel's rate limiting
# settings in vercel.json or using Vercel Firewall rules.

try:
    import msoffcrypto
    HAS_MSOFFCRYPTO = True
except ImportError:
    HAS_MSOFFCRYPTO = False

ALLOWED_ORIGINS = [
    'https://davichi-finance-tool-ai2z.vercel.app',
    'http://localhost:5173',
]

MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50MB
MAX_PASSWORD_LENGTH = 100


class handler(BaseHTTPRequestHandler):
    def _get_cors_origin(self):
        """Check the request Origin header and return it if allowed, otherwise None."""
        origin = self.headers.get('Origin', '')
        if origin in ALLOWED_ORIGINS:
            return origin
        return None

    def _set_cors_headers(self):
        """Set CORS headers based on the request Origin."""
        origin = self._get_cors_origin()
        if origin:
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Vary', 'Origin')

    def _send_json_error(self, status_code, message):
        """Send a JSON error response with CORS headers."""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps({'error': message}).encode())

    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)

            if not HAS_MSOFFCRYPTO:
                self._send_json_error(500, '서버에 msoffcrypto 모듈이 설치되어 있지 않습니다.')
                return

            file_b64 = data.get('file')
            password = data.get('password', '')

            if not file_b64:
                self._send_json_error(400, '파일이 전송되지 않았습니다.')
                return

            # Input validation: password length
            if len(password) > MAX_PASSWORD_LENGTH:
                self._send_json_error(400, f'비밀번호는 {MAX_PASSWORD_LENGTH}자 이하로 입력해주세요.')
                return

            # Input validation: file size (base64 length * 3/4 approximates decoded size)
            estimated_file_size = len(file_b64) * 3 / 4
            if estimated_file_size > MAX_FILE_SIZE_BYTES:
                self._send_json_error(400, '파일 크기가 50MB를 초과합니다. 더 작은 파일을 업로드해주세요.')
                return

            file_bytes = base64.b64decode(file_b64)
            encrypted_file = io.BytesIO(file_bytes)
            decrypted_file = io.BytesIO()

            office_file = msoffcrypto.OfficeFile(encrypted_file)
            office_file.load_key(password=password)
            office_file.decrypt(decrypted_file)

            decrypted_b64 = base64.b64encode(decrypted_file.getvalue()).decode('utf-8')

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({'file': decrypted_b64}).encode())

        except msoffcrypto.exceptions.DecryptionError:
            self._send_json_error(401, '암호가 올바르지 않습니다. 다시 확인해주세요.')

        except Exception as e:
            self._send_json_error(500, f'복호화 중 오류가 발생했습니다: {str(e)}')

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
