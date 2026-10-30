from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

from ..auth import authenticate_password, create_access_token, login
from ..config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    password: str


def _token_response(sub: str):
    settings = get_settings()
    token = create_access_token({"sub": sub})
    expires = timedelta(minutes=settings.access_token_expire_minutes)
    return {"access_token": token, "token_type": "bearer", "expires_in": int(expires.total_seconds())}


@router.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    await login(form_data)
    return _token_response(get_settings().admin_email)


@router.post("/login")
def login_with_password(payload: LoginRequest):
    if not authenticate_password(payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Senha incorreta",
        )
    return _token_response(get_settings().admin_email)
