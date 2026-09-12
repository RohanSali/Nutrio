import firebase_admin
import json
import os
from pathlib import Path

from firebase_admin import credentials
from firebase_admin import auth
from firebase_admin import firestore


# Initialize Firebase Admin only once
if not firebase_admin._apps:
    service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")

    if service_account_json:
        cred = credentials.Certificate(json.loads(service_account_json))
    else:
        cred = credentials.Certificate(
            str(Path(__file__).resolve().parents[2] / "firebase-service-account.json")
        )

    firebase_admin.initialize_app(cred)


def get_firestore_client():
    return firestore.client()


def verify_firebase_token(id_token: str):

    decoded_token = auth.verify_id_token(
        id_token
    )

    return decoded_token