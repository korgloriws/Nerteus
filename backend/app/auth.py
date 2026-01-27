from datetime import datetime, timedelta
from typing import Any, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt

from .config import get_settings


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


def authenticate_user(email: str, password: str) -> bool:
    settings = get_settings()
    return email == settings.admin_email and password == settings.admin_password


def create_access_token(data: dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    settings = get_settings()
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm="HS256")


async def get_current_editor(token: str = Depends(oauth2_scheme)) -> str:
    settings = get_settings()
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        email: str = payload.get("sub")  # type: ignore[assignment]
        if email is None:
            raise credentials_exception
    except JWTError as exc:
        raise credentials_exception from exc
    if email != settings.admin_email:
        raise credentials_exception
    return email


async def login(form_data: OAuth2PasswordRequestForm = Depends()) -> str:
    if not authenticate_user(form_data.username, form_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token({"sub": form_data.username})
    return token

