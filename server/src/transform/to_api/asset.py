from ...api.models.asset import ApiAsset
from ...db.models.asset_entry import AssetEntry
from ...db.models.asset_share import AssetShare
from ...db.models.user import User


def transform_asset(
    entry: AssetEntry,
    user: User,
    *,
    children=False,
    recursive=False,
    # The following two kwargs are for internal use only
    __share_info: AssetShare | None = None,
    __recursed=False,
) -> ApiAsset:
    pydantic_children = None

    if children:
        pydantic_children = []
        # We add all the regular child assets
        for child in AssetEntry.select().where((AssetEntry.parent == entry)):
            pydantic_children.append(transform_asset(child, user, children=children and recursive, recursive=recursive))
        # We check if there are any assets that were shared with us that are located in this folder
        for child in AssetShare.select().where(
            (AssetShare.parent == entry) & (AssetShare.user == user)  # type: ignore
        ):
            pydantic_children.append(
                transform_asset(
                    child.entry,
                    user,
                    children=children and recursive,
                    recursive=recursive,
                    __share_info=child,
                    __recursed=True,
                )
            )

    share_info = __share_info
    # ShareInfo is only pre-provided by going through the recursive child loop above
    # It is provided in that case, so we don't double call the DB.
    # In the first call however the info has not yet been retrieved
    if __share_info is None and not __recursed:
        share_info = AssetShare.get_or_none(entry=entry, user=user)

    pydantic_asset = ApiAsset(
        id=entry.id,
        owner=entry.owner.name,
        name=entry.name if share_info is None else share_info.name,
        assetId=entry.asset.id if entry.asset else None,
        fileHash=entry.asset.file_hash if entry.asset else None,
        children=pydantic_children,
        shares=[],
        has_templates=entry.asset.templates.count() > 0 if entry.asset else False,
    )

    if share_info is None or share_info.right == "edit":
        for s in entry.shares:
            pydantic_asset.shares.append(s.as_pydantic())

    return pydantic_asset
