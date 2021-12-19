export type NonEmptyArray<T> = [T, ...T[]];

export class Pageable<T> {

    public readonly allPageData: NonEmptyArray<T>;
    public page: number;

    get totalPages(): number { return this.allPageData.length; }
    get pageData(): T { return Pageable.resolveArrayPage(this.allPageData, this.currentPage); }
    get currentPage(): number { return Pageable.resolvePageIndex(this.page, this.totalPages) + 1; }

    constructor(allPageData: NonEmptyArray<T>, page: number = 0) {
        this.allPageData = allPageData;
        this.page = page;
    }

    public static resolvePageIndex(page: number, pages: number): number {
        page = page % pages;
        page = page >= 0 ? page : pages + page;
        return page;
    }

    public static resolveArrayPage<T>(array: NonEmptyArray<T>, page: number): T {
        page = Pageable.resolvePageIndex(page, array.length);
        const value = array[page];
        if (!value) throw new Error('[HandlerUtil] Failed to resolve array page');
        return value;
    }

    public static isNonEmptyArray<T>(array: T[]): array is NonEmptyArray<T> {
        return array.length > 0;
    }
}
