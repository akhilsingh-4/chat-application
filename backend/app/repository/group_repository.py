from uuid import UUID

from sqlalchemy.orm import Session

from app.models.group import Group
from app.models.group_member import GroupMember
from app.models.message import Message

class GroupRepository:

    def __init__(self, db: Session):
        self.db = db

    def create_group(self, name: str, description: str | None, created_by: UUID) -> Group:
        
        group = Group(
            name=name.strip(),
            description=(description or "").strip(),
            created_by=created_by
        )

        self.db.add(group)
        self.db.commit()
        self.db.refresh(group)

        return group
    
    def add_member(self, group_id: UUID, user_id: UUID) -> GroupMember:

        member = GroupMember(
            group_id=group_id,
            user_id=user_id
        )

        self.db.add(member)
        self.db.commit()
        self.db.refresh(member)

        return member
    
    def get_group_by_id(self, group_id: UUID) -> Group | None:

        return (
            self.db.query(Group)
            .filter(Group.id == group_id)
            .first()
        )
    
    def get_group_members(self, group_id: UUID) -> list[GroupMember]:

        return (
            self.db.query(GroupMember)
            .filter(GroupMember.group_id == group_id)
            .all()
        )

    def get_group_messages(self, group_id: UUID) -> list[Message]:
        return (
            self.db.query(Message)
            .filter(Message.group_id == group_id)
            .all()
        )
    
    def get_user_groups(self, user_id: UUID) -> list[Group]:

        return(
            self.db.query(Group)
            .join(
                GroupMember,
                Group.id == GroupMember.group_id
            )
            .filter(GroupMember.user_id == user_id)
            .all()
        )
    
    def is_member(self, group_id: UUID, user_id: UUID) -> bool:

        member = (
            self.db.query(GroupMember)
            .filter(
                GroupMember.group_id == group_id,
                GroupMember.user_id == user_id
            ).first()
        )

        return member is not None
    
    def remove_member(self, group_id: UUID, user_id: UUID):

        member = (
            self.db.query(GroupMember)
            .filter(
                GroupMember.group_id == group_id,
                GroupMember.user_id == user_id
            ).first()
        )

        if member:
            self.db.delete(member)
            self.db.commit()

    def delete_group(self, group: Group):
        self.db.query(Message).filter(Message.group_id == group.id).delete(
            synchronize_session=False,
        )
        self.db.query(GroupMember).filter(GroupMember.group_id == group.id).delete(
            synchronize_session=False,
        )

        self.db.delete(group)
        self.db.commit()


        
