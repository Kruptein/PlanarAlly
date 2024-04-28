interface BaseSection {
    title: string;
    action: () => void | Promise<void>;
    disabled?: boolean;
    selected?: boolean;
}

export type Section = BaseSection | Section[] | { title: string; subitems: Section[] };
