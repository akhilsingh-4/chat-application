from uuid import UUID

from sqlalchemy.orm import Session

from app.models.group import Group
from app.models.group_member import GroupMember
from app.repository.group_repository import GroupRepository
from app.services.s3_service import S3Service

from app.exceptions.group import GroupNotFoundException, UserAlreadyMemberException

class GroupService:

    def __init__(self, db: Session):
        self.repository = GroupRepository(db)
        self.s3_service = S3Service()

    def create_group(self, name: str, description: str | None, created_by: UUID) -> Group:

        group = self.repository.create_group(
            name=name,
            description=description,
            created_by=created_by
        )

        self.repository.add_member(
            group_id=group.id,
            user_id=created_by
        )

        return group
    
    def add_member(self, group_id: UUID, user_id: UUID) -> GroupMember:

        group = self.repository.get_group_by_id(group_id)

        if not group:
            raise GroupNotFoundException("Group not found.")

        if self.repository.is_member(group_id,user_id):
            raise UserAlreadyMemberException("User is already a member of this group")

        return self.repository.add_member(
            group_id=group_id,
            user_id=user_id
        )

    def ensure_member(self, group_id: UUID, user_id: UUID):
        group = self.repository.get_group_by_id(group_id)

        if not group:
            raise GroupNotFoundException("Group not found.")

        if not self.repository.is_member(group_id, user_id):
            raise PermissionError("User is not a member of this group.")

        return group
    
    def remove_member(self, group_id:UUID, user_id: UUID):
        
        group = self.repository.get_group_by_id(group_id)

        if not group:
            raise GroupNotFoundException("Group not found.")

        if not self.repository.is_member(group_id,user_id):
            raise UserAlreadyMemberException("User is not a member of this group")
        

        self.repository.remove_member(
            group_id=group_id,
            user_id=user_id
        )

    def get_group(self, group_id: UUID) -> Group:

          
        group = self.repository.get_group_by_id(group_id)

        if not group:
            raise GroupNotFoundException("Group not found.")
        
        return group
    
    def get_group_members(self, group_id: UUID) -> list[GroupMember]:

        group = self.repository.get_group_by_id(group_id)

        if not group:
            raise GroupNotFoundException("Group not found.")

        return self.repository.get_group_members(group_id)

    def get_user_groups(self, user_id: UUID) -> list[Group]:

        return self.repository.get_user_groups(user_id)

    def delete_group(self, group_id: UUID, requested_by: UUID):
        
        group = self.repository.get_group_by_id(group_id)

        if not group:
            raise GroupNotFoundException("Group not found.")

        if group.created_by != requested_by:
            raise ValueError("Only the group creator can delete the group")

        for message in self.repository.get_group_messages(group_id):
            if message.attachment_s3_key:
                self.s3_service.delete_file(message.attachment_s3_key)
        
        self.repository.delete_group(group)




         


