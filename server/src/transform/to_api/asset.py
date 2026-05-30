from ...api.models.asset import ApiAssetEntry
from ...db.models.asset_entry import AssetEntry
from ...db.models.asset_share import AssetShare
from ...db.models.user import User


def transform_asset_entry(
    entry: AssetEntry,
    user: User,
    *,
    children=False,
    recursive=False,
    # The following two kwargs are for internal use only
    __share_info: AssetShare | None = None,
    __recursed=False,
) -> ApiAssetEntry:
    pydantic_children = None

    if children:
        pydantic_children = []
        # We add all the regular child assets
        for child in AssetEntry.select().where((AssetEntry.parent == entry)):
            pydantic_children.append(transform_asset_entry(child, user, children=children and recursive, recursive=recursive))
        # We check if there are any assets that were shared with us that are located in this folder
        for child in AssetShare.select().where(
            (AssetShare.parent == entry) & (AssetShare.user == user)  # type: ignore
        ):
            pydantic_children.append(
                transform_asset_entry(
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

    pydantic_asset = ApiAssetEntry(
        id=entry.id,
        owner=entry.owner.name,
        name=entry.name if share_info is None else share_info.name,
        children=pydantic_children,
        shares=[],
        asset=entry.asset.as_pydantic() if entry.asset else None,
    )

    if share_info is None or share_info.right == "edit":
        for s in entry.shares:
            pydantic_asset.shares.append(s.as_pydantic())

    return pydantic_asset
