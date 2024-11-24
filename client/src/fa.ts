import { dom, library } from "@fortawesome/fontawesome-svg-core";
import { faDAndD, faDiscord, faGithub, faPatreon } from "@fortawesome/free-brands-svg-icons";
import {
    faCompass,
    faCopy,
    faSquareMinus,
    faSquarePlus,
    faWindowClose,
    faWindowRestore,
} from "@fortawesome/free-regular-svg-icons";
import {
    faAngleDoubleLeft,
    faAngleRight,
    faArchive,
    faArrowDownAZ,
    faArrowDownZA,
    faArrowRight,
    faArrowsAlt,
    faAt,
    faBook,
    faCheckCircle,
    faChevronDown,
    faChevronLeft,
    faChevronRight,
    faChevronUp,
    faCircle,
    faCircleInfo,
    faCircleXmark,
    faClockRotateLeft,
    faCog,
    faCogs,
    faCommentDots,
    faCut,
    faDiceSix,
    faDoorClosed,
    faDownload,
    faDrawPolygon,
    faEdit,
    faEquals,
    faExclamation,
    faExternalLinkAlt,
    faEye,
    faFilter,
    faFolder,
    faFont,
    faHandPaper,
    faLanguage,
    faLightbulb,
    faLink,
    faLocationDot,
    faLock,
    faMagnifyingGlass,
    faMinus,
    faMinusSquare,
    faNoteSticky,
    faPaintBrush,
    faPencilAlt,
    faPlay,
    faPlus,
    faPlusMinus,
    faPlusSquare,
    faRotateLeft,
    faShareAlt,
    faSignOutAlt,
    faSliders,
    faSortAmountDown,
    faSortAmountDownAlt,
    faSquare,
    faStopwatch,
    faSyncAlt,
    faTimesCircle,
    faTrashAlt,
    faUnlink,
    faUnlock,
    faUpload,
    faUserCircle,
    faUserTag,
    faUsers,
    faVideo,
} from "@fortawesome/free-solid-svg-icons";

export function loadFontAwesome(): void {
    library.add(
        faAngleDoubleLeft,
        faAngleRight,
        faArchive,
        faArrowDownAZ,
        faArrowDownZA,
        faArrowRight,
        faArrowsAlt,
        faAt,
        faBook,
        faCheckCircle,
        faChevronDown,
        faChevronLeft,
        faChevronRight,
        faChevronUp,
        faCircle,
        faCircleInfo,
        faCircleXmark,
        faClockRotateLeft,
        faCog,
        faCogs,
        faCopy,
        faCompass,
        faCommentDots,
        faCut,
        faDAndD,
        faDiceSix,
        faDiscord,
        faDoorClosed,
        faDownload,
        faDrawPolygon,
        faEdit,
        faEquals,
        faExclamation,
        faExternalLinkAlt,
        faEye,
        faFilter,
        faFolder,
        faFont,
        faGithub,
        faHandPaper,
        faLanguage,
        faLightbulb,
        faLink,
        faLocationDot,
        faLock,
        faMagnifyingGlass,
        faMinus,
        faMinusSquare,
        faNoteSticky,
        faPaintBrush,
        faPatreon,
        faPencilAlt,
        faPlay,
        faPlus,
        faPlusMinus,
        faPlusSquare,
        faRotateLeft,
        faShareAlt,
        faSignOutAlt,
        faSliders,
        faSortAmountDown,
        faSortAmountDownAlt,
        faSquare,
        faSquareMinus,
        faSquarePlus,
        faStopwatch,
        faSyncAlt,
        faTimesCircle,
        faTrashAlt,
        faUnlink,
        faUnlock,
        faUpload,
        faUserTag,
        faUserCircle,
        faUsers,
        faVideo,
        faWindowClose,
        faWindowRestore,
    );

    dom.watch();
}
