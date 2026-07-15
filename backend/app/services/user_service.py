import re
from app.repository.user_repository import UserRepository


class UserService:

    def __init__(self, repo: UserRepository):
        self.repo = repo

    def get_or_create(
        self,
        google_id: str,
        email: str,
        name: str,
        profile_picture: str,
    ):
        user = self.repo.get_by_google_id(google_id)
        if user:
            return user

        username = self._generate_unique_username(email, name)

        return self.repo.create_user(
            google_id=google_id,
            email=email,
            username=username,
            name=name,
            profile_picture=profile_picture,
        )

    def _generate_unique_username(self, email: str, name: str) -> str:
        base = email.split("@")[0]
        base = re.sub(r"[^a-z0-9_]", "", base.lower())

        if not base:
            base = re.sub(r"[^a-z0-9_]", "", name.lower().replace(" ", "_"))
        candidate = base
        counter = 1
        while self.repo.get_by_username(candidate):
            candidate = f"{base}_{counter}"
            counter += 1

        return candidate
