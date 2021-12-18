import { ActivityUnion } from "./Activity.js";
import { Character } from "./Character.js";
import { Studio } from "./Studio.js";
import { Media } from "./Media.js";
import { Staff } from "./Staff.js";
import { User } from "./User.js";

export interface Page {
    readonly pageInfo?: PageInfo;
    readonly activities?: ActivityUnion[];
    readonly characters?: Character[];
    readonly studios?: Studio[];
    readonly media?: Media[];
    readonly staff?: Staff[];
    readonly users?: User[];
}

export interface PageInfo {
    readonly total?: number | null;
    readonly perPage?: number | null;
    readonly currentPage?: number | null;
    readonly lastPage?: number | null;
    readonly hasNextPage?: boolean | null;
}
