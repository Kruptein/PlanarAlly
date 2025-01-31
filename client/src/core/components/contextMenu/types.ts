interface BaseSection {
    title: string;
    action: () => boolean | Promise<boolean>;
    disabled?: boolean;
    selected?: boolean;
}

export type Section = BaseSection | Section[] | { title: string; subitems: Section[] };
