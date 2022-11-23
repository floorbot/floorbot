export type NonEmptyArray<T> = [T, ...T[]];

export class Pageable<T> {

    public array: NonEmptyArray<T>;
    public perPage: number;
    public page: number;

    get totalPages(): number { return Math.ceil(this.array.length / this.perPage); }

    // These are the actual pages taking perPage into account
    get pagedArray(): NonEmptyArray<NonEmptyArray<T>> {
        const pagedArray = [];
        const array = [...this.array];
        while (array.length) pagedArray.push(array.splice(0, this.perPage));
        return pagedArray as NonEmptyArray<NonEmptyArray<T>>;
    }

    get firstPageIndex(): number { return 0; };
    get lastPageIndex(): number { return this.totalPages - 1; };
    get currentPageIndex(): number { return Pageable.resolvePageIndex(this.page, this.totalPages); }
    get nextPageIndex(): number { return Pageable.resolvePageIndex(this.page + 1, this.totalPages); }
    get previousPageIndex(): number { return Pageable.resolvePageIndex(this.page - 1, this.totalPages); }

    get firstPage(): number { return 1; };
    get lastPage(): number { return this.totalPages; };
    get currentPage(): number { return Pageable.resolvePageIndex(this.page, this.totalPages) + 1; }
    get nextPage(): number { return Pageable.resolvePageIndex(this.page + 1, this.totalPages) + 1; }
    get previousPage(): number { return Pageable.resolvePageIndex(this.page - 1, this.totalPages); }

    constructor(array: NonEmptyArray<T>, options?: { page?: number, perPage?: number; }) {
        this.perPage = (options && options.perPage) || 1;
        this.page = (options && options.page) || 0;
        this.array = array;
    }

    public getPageFirst(page?: number): T {
        return this.getPage(page)[0];
    }

    public getPage(page?: number): NonEmptyArray<T> {
        return Pageable.resolveArrayPage(this.pagedArray, page ?? this.page);
    }

    public sortPages(compare?: ((a: T, b: T) => number) | undefined): NonEmptyArray<T> {
        return this.array.sort(compare);
    }

    public toString() {
        return `${this.currentPage}/${this.totalPages}`;
    }

    public static resolvePageIndex(page: number, pages: number): number {
        page = page % pages;
        page = page >= 0 ? page : pages + page;
        return page;
    }

    public static resolveArrayPage<T>(array: NonEmptyArray<T>, page: number): T {
        page = Pageable.resolvePageIndex(page, array.length);
        return array[page]!;
    }

    public static isNonEmptyArray<T>(array: T[]): array is NonEmptyArray<T> {
        return array.length > 0;
    }
}
