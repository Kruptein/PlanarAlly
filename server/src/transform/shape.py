from ..api.models.shape.shape import ApiCoreShape
from ..api.models.shape.subtypes import ApiShapeSubType
from ..db.models.aura import Aura
from ..db.models.label import Label
from ..db.models.player_room import PlayerRoom
from ..db.models.shape import Shape
from ..db.models.tracker import Tracker
from ..models.access import has_ownership


def transform_shape(shape: Shape, pr: PlayerRoom) -> ApiShapeSubType:
    owners = [owner.as_pydantic() for owner in shape.owners]

    edit_access = has_ownership(shape, pr)

    # Access checks
    tracker_query = shape.trackers
    aura_query = shape.auras
    label_query = shape.labels.join(Label)
    name = shape.name
    annotation = shape.annotation
    if not edit_access:
        tracker_query = tracker_query.where(Tracker.visible)
        aura_query = aura_query.where(Aura.visible)
        label_query = label_query.where(Label.visible)
        if not shape.name_visible:
            name = "?"
        if not shape.annotation_visible:
            annotation = ""

    trackers = [t.as_pydantic() for t in tracker_query]
    auras = [a.as_pydantic() for a in aura_query]
    labels = [sh_label.label.as_pydantic() for sh_label in label_query]
    character = None
    if shape.character is not None:
        character = shape.character.as_pydantic()
    # Subtype
    layer = shape.layer
    shape_model = ApiCoreShape(
        uuid=shape.uuid,
        type_=shape.type_,
        layer=layer.name,
        floor=layer.floor.name,
        x=shape.x,
        y=shape.y,
        name=name or "Unknown Shape",
        name_visible=shape.name_visible,
        fill_colour=shape.fill_colour,
        stroke_colour=shape.stroke_colour,
        vision_obstruction=shape.vision_obstruction,
        movement_obstruction=shape.movement_obstruction,
        is_token=shape.is_token,
        annotation=annotation,
        draw_operator=shape.draw_operator,
        options=shape.options or "[]",
        badge=shape.badge,
        show_badge=shape.show_badge,
        default_edit_access=shape.default_edit_access,
        default_movement_access=shape.default_movement_access,
        default_vision_access=shape.default_vision_access,
        is_invisible=shape.is_invisible,
        is_defeated=shape.is_defeated,
        is_locked=shape.is_locked,
        angle=shape.angle,
        stroke_width=shape.stroke_width,
        annotation_visible=shape.annotation_visible,
        ignore_zoom_size=shape.ignore_zoom_size,
        is_door=shape.is_door,
        is_teleport_zone=shape.is_teleport_zone,
        asset=None if shape.asset is None else shape.asset.id,
        group=None if shape.group is None else shape.group.uuid,
        owners=owners,
        trackers=trackers,
        auras=auras,
        labels=labels,
        character=character,
    )
    return shape.subtype.as_pydantic(shape_model)
