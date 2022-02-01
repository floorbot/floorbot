export type NonEmptyArray<T> = [T, ...T[]];

export class Pageable<T> {

    public array: NonEmptyArray<T>;
    public perChapter: number;
    public chapter: number;
    public page: number;

    get chapterArray(): NonEmptyArray<T[]> {
        const array = [...this.array];
        const chapterArray = [];
        while (array.length) chapterArray.push(array.splice(0, this.perChapter));
        return chapterArray as NonEmptyArray<T[]>;
    }

    get totalChapters(): number { return Math.ceil(this.array.length / this.perChapter); }
    get totalPages(): number { return this.array.length; }

    get firstPage(): number { return 0; };
    get lastPage(): number { return this.totalPages - 1; };
    get currentPage(): number { return Pageable.resolvePageIndex(this.page, this.totalPages); }
    get nextPage(): number { return this.currentPage === this.lastPage ? this.firstPage : this.currentPage + 1; }
    get previousPage(): number { return this.currentPage === this.firstPage ? this.lastPage : this.currentPage - 1; }

    get firstChapter(): number { return 0; };
    get lastChapter(): number { return this.totalChapters - 1; };
    get currentChapter(): number { return Pageable.resolvePageIndex(this.page, this.totalChapters); }
    get nextChapter(): number { return this.currentChapter === this.lastChapter ? this.firstChapter : this.currentChapter + 1; }
    get previousChapter(): number { return this.currentChapter === this.firstChapter ? this.lastChapter : this.currentChapter - 1; }

    constructor(array: NonEmptyArray<T>, options?: { page?: number, chapter?: number, perChapter?: number; }) {
        this.perChapter = (options && options.perChapter) || 5;
        this.chapter = (options && options.chapter) || 0;
        this.page = (options && options.page) || 0;
        this.array = array;
    }

    public getPage(page?: number): T {
        return Pageable.resolveArrayPage(this.array, page ?? this.page);
    }

    public getChapter(chapter?: number): T[] {
        return Pageable.resolveArrayPage(this.chapterArray, chapter ?? this.chapter);
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
