from sqlalchemy.orm import Session
from app.models.user import User

class UserRepository:

    def __init__(self, db: Session):
        self.db=db

    def get_by_google_id(self, google_id: str):
        return(
            self.db.query(User)
            .filter(User.google_id == google_id)
            .first()
        )
    
    def get_by_email(self, email: str):
        return(
            self.db.query(User)
            .filter(User.email == email)
            .first()
        )
    
    def get_by_username(self, username: str):
        return(
            self.db.query(User)
            .filter(User.username == username)
            .first()
        )
    
    def create_user(
            self,
            google_id: str,
            email: str,
            username: str,
            name: str,
            profile_picture: str
    ):
        user = User(
            google_id=google_id,
            email=email,
            username=username,
            name=name,
            profile_picture=profile_picture
        )

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return user

    def get_all_users(self):
        return self.db.query(User).all()
