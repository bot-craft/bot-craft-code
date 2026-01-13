import base64
import hashlib
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend


def encrypt_api_key(api_key, key):
    """
    Encrypt the API key using the provided key.
    """
    f = Fernet(key)
    encrypted = f.encrypt(api_key.encode())
    return encrypted.decode()

def decrypt_api_key(encrypted_api_key, key):
    """
    Decrypt the API key using the provided key.
    """
    f = Fernet(key)
    decrypted = f.decrypt(encrypted_api_key.encode())
    return decrypted.decode()

def derive_key(username, password_hash, salt=None):
    """
    Derive a cryptographic key from username and password hash using PBKDF2.
    The salt should be unique per user and stored with the encrypted data.
    """
    if salt is None:
        salt = hashlib.sha256(username.encode()).digest()
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100_000,
        backend=default_backend()
    )
    key = base64.urlsafe_b64encode(kdf.derive(password_hash.encode()))
    return key, salt