import hashlib
import hmac
import os
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

from fastapi import APIRouter, HTTPException
from firebase_admin import auth, firestore
from pydantic import BaseModel, EmailStr, Field

from app.services.firebase import get_firestore_client


router = APIRouter(prefix="/api/auth", tags=["Auth"])

OTP_TTL_MINUTES = 10
RESEND_COOLDOWN_SECONDS = 120
MAX_OTP_ATTEMPTS = 5


class EmailRequest(BaseModel):
    email: EmailStr


class VerifyOtpRequest(EmailRequest):
    otp: str = Field(pattern=r"^\d{6}$")


class RegisterRequest(EmailRequest):
    password: str = Field(min_length=6, max_length=128)
    verification_token: str = Field(min_length=1)


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _email_key(email: str) -> str:
    return hashlib.sha256(_normalize_email(email).encode()).hexdigest()


def _otp_hash(otp: str) -> str:
    secret = os.environ["OTP_HASH_SECRET"].encode()
    return hmac.new(secret, otp.encode(), hashlib.sha256).hexdigest()


def _send_otp_email(email: str, otp: str) -> None:
    message = EmailMessage()
    message["Subject"] = "Your Nutrio verification code"
    message["From"] = os.environ["SMTP_FROM_EMAIL"]
    message["To"] = email
    message.set_content(
        f"Your Nutrio verification code is {otp}. It expires in {OTP_TTL_MINUTES} minutes."
    )

    with smtplib.SMTP(os.environ["SMTP_HOST"], int(os.environ.get("SMTP_PORT", "587"))) as smtp:
        smtp.starttls()
        smtp.login(os.environ["SMTP_USERNAME"], os.environ["SMTP_PASSWORD"])
        smtp.send_message(message)


@router.post("/send-email-otp")
def send_email_otp(request: EmailRequest):
    email = _normalize_email(str(request.email))
    reference = get_firestore_client().collection("emailOtps").document(_email_key(email))
    existing = reference.get()
    now = datetime.now(timezone.utc)

    if existing.exists:
        data = existing.to_dict() or {}
        resend_at = data.get("resendAt")
        if resend_at and resend_at > now:
            seconds = max(1, int((resend_at - now).total_seconds()))
            raise HTTPException(429, detail=f"Please wait {seconds} seconds before requesting another code.")

    otp = f"{secrets.randbelow(1_000_000):06d}"
    try:
        _send_otp_email(email, otp)
    except Exception as error:
        print("OTP EMAIL ERROR:", repr(error))
        raise HTTPException(502, detail="Unable to send the verification email.") from error

    reference.set({
        "otpHash": _otp_hash(otp),
        "expiresAt": now + timedelta(minutes=OTP_TTL_MINUTES),
        "resendAt": now + timedelta(seconds=RESEND_COOLDOWN_SECONDS),
        "attempts": 0,
    })
    return {"message": "Verification code sent."}


@router.post("/verify-email-otp")
def verify_email_otp(request: VerifyOtpRequest):
    email = _normalize_email(str(request.email))
    reference = get_firestore_client().collection("emailOtps").document(_email_key(email))
    snapshot = reference.get()
    now = datetime.now(timezone.utc)

    if not snapshot.exists:
        raise HTTPException(400, detail="Request a verification code first.")

    data = snapshot.to_dict() or {}
    if data.get("expiresAt", now) <= now:
        reference.delete()
        raise HTTPException(400, detail="That verification code has expired.")
    if data.get("attempts", 0) >= MAX_OTP_ATTEMPTS:
        raise HTTPException(429, detail="Too many incorrect attempts. Request a new code.")
    if not hmac.compare_digest(data.get("otpHash", ""), _otp_hash(request.otp)):
        reference.update({"attempts": firestore.Increment(1)})
        raise HTTPException(400, detail="Incorrect verification code.")

    token = secrets.token_urlsafe(32)
    reference.set({"verifiedTokenHash": _otp_hash(token), "verifiedUntil": now + timedelta(minutes=15)})
    return {"verificationToken": token}


@router.post("/register")
def register(request: RegisterRequest):
    email = _normalize_email(str(request.email))
    reference = get_firestore_client().collection("emailOtps").document(_email_key(email))
    snapshot = reference.get()
    data = snapshot.to_dict() if snapshot.exists else None
    now = datetime.now(timezone.utc)

    if not data or data.get("verifiedUntil", now) <= now or not hmac.compare_digest(
        data.get("verifiedTokenHash", ""), _otp_hash(request.verification_token)
    ):
        raise HTTPException(400, detail="Verify your email before creating an account.")

    try:
        user = auth.create_user(email=email, password=request.password, email_verified=True)
    except auth.EmailAlreadyExistsError as error:
        raise HTTPException(409, detail="An account already exists with this email.") from error
    finally:
        reference.delete()

    return {"uid": user.uid}