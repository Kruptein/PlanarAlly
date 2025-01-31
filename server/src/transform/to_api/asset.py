from ...api.models.asset import ApiAsset
from ...db.models.asset import Asset
from ...db.models.asset_share import AssetShare
from ...db.models.user import User


def transform_asset(
    asset: Asset,
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
        for child in Asset.select().where((Asset.parent == asset)):
            pydantic_children.append(
                transform_asset(
                    child, user, children=children and recursive, recursive=recursive
                )
            )
        # We check if there are any assets that were shared with us that are located in this folder
        for child in AssetShare.select().where(
            (AssetShare.parent == asset) & (AssetShare.user == user)  # type: ignore
        ):
            pydantic_children.append(
                transform_asset(
                    child.asset,
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
        share_info = AssetShare.get_or_none(asset=asset, user=user)

    pydantic_asset = ApiAsset(
        id=asset.id,
        owner=asset.owner.name,
        name=asset.name if share_info is None else share_info.name,
        fileHash=asset.file_hash,
        children=pydantic_children,
        shares=[],
    )

    if share_info is None or share_info.right == "edit":
        for s in asset.shares:
            pydantic_asset.shares.append(s.as_pydantic())

    return pydantic_asset
