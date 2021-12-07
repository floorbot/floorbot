export interface DonmaiAPIAutocomplete {
    readonly type: string;
    readonly label: string;
    readonly value: string;
    readonly category: number;
    readonly post_count: number;
    readonly antecedent: string | null;
}
