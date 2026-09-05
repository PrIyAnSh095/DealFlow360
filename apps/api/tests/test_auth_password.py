from src.core.security import validate_password_strength, generate_secure_password, get_password_hash, verify_password

def test_password_validation_weak():
    is_valid, msg = validate_password_strength("weak")
    assert not is_valid
    assert "8 characters" in msg

def test_password_validation_no_uppercase():
    is_valid, msg = validate_password_strength("password123!")
    assert not is_valid
    assert "uppercase" in msg

def test_password_validation_no_special():
    is_valid, msg = validate_password_strength("Password123")
    assert not is_valid
    assert "special character" in msg

def test_password_validation_valid():
    is_valid, msg = validate_password_strength("StrongP@ss123!")
    assert is_valid
    assert "meets strength" in msg

def test_generate_secure_password():
    pwd = generate_secure_password(16)
    assert len(pwd) >= 12
    is_valid, _ = validate_password_strength(pwd)
    assert is_valid

def test_password_hashing():
    pwd = "MySecur3Password!"
    hashed = get_password_hash(pwd)
    assert verify_password(pwd, hashed)
    assert not verify_password("WrongPassword!", hashed)
