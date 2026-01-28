from datetime import datetime, timedelta
from typing import Any, Dict, Optional
from fastapi import HTTPException, Request
from fastapi.security import OAuth2PasswordBearer
from jose import ExpiredSignatureError, JWTError, jwt
from bcrypt import hashpw, checkpw, gensalt
import uuid
from functools import wraps

SECRET_KEY = "xwing-secret-phrase"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def create_access_token(subject: str):
    expire = datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    jti = str(uuid.uuid4())
    data = {"sub": subject, "exp": expire, "jti": jti}
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def hash_password(password: str):
    return hashpw(password.encode("utf-8"), gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str):
    return checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))



def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify JWT token and return payload
    Returns None if token is invalid or expired.
    """

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload  # contains "sub", "exp", "iat"

    except ExpiredSignatureError:
        # Token is expired
        return None

    except JWTError:
        # Invalid token (bad signature, corrupted, etc.)
        return None



async def get_current_token(request: Request):
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(401, "Missing or invalid token")
    token = token.split(" ")[1]
    user = verify_token(token)
    if not user:
        raise HTTPException(401, "Invalid or expired token")
    request.state.user = user
    request.state.token = token
    return token


def auth_required(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        request: Request = kwargs.get("request") or next(
            (a for a in args if isinstance(a, Request)), None
        )
        if request is None:
            raise HTTPException(400, "Request object missing")

        token = request.headers.get("Authorization")
        if not token or not token.startswith("Bearer "):
            raise HTTPException(401, "Missing or invalid token")
        token = token.split(" ")[1]

        # verify token
        user = verify_token(token)
        if not user:
            raise HTTPException(401, "Invalid or expired token")

        # store user in request.state
        request.state.user = user
        request.state.token = token
        print(token)
        print(request.state.token)

        result = func(*args, **kwargs)
        if hasattr(result, "__await__"):
            return await result
        return result

    return wrapper