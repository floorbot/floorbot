import { DateTime, Duration } from 'luxon';
import { DDDNutRow } from './DDDDatabase';

export interface DDDSeasonDetails {
    readonly now: DateTime,
    readonly season: number,
    readonly isDecember: boolean,
    readonly guaranteed_date: DateTime,
    readonly start_date: DateTime,
    readonly stop_date: DateTime,
    readonly guaranteed_in: Duration,
    readonly starts_in: Duration,
    readonly stops_in: Duration
}

export interface DDDZoneDetails extends DDDSeasonDetails {
    readonly zone: string,
    readonly isDecemberish: boolean,
}

export class DDDUtil {

    public static readonly FIRST_ZONE = 'ETC/GMT-14';
    public static readonly LAST_ZONE = 'ETC/GMT+12';
    public static readonly MONTH = 12; // This is for testing

    public static getSeasonDetails(season?: number): DDDSeasonDetails {
        season = season ?? DDDUtil.getCurrentSeason();
        const guaranteedDate = DDDUtil.getGuaranteedDate(season);
        const startDate = DDDUtil.geStartDate(season);
        const stopDate = DDDUtil.getStopDate(season);
        return {
            now: DateTime.now().setZone(DDDUtil.LAST_ZONE),
            season: season,
            isDecember: DDDUtil.isDecember(),
            guaranteed_date: guaranteedDate,
            start_date: startDate,
            stop_date: stopDate,
            guaranteed_in: guaranteedDate.diffNow(),
            starts_in: stopDate.diffNow(),
            stops_in: stopDate.diffNow(),
        }
    }

    public static getZoneDetails(zone: string, season?: number): DDDZoneDetails {
        season = season ?? DDDUtil.getCurrentSeason();
        const guaranteedDate = DDDUtil.getGuaranteedDate(season);
        const startDate = DDDUtil.geStartDate(season, zone);
        const stopDate = DDDUtil.getStopDate(season, zone);
        return {
            zone: zone,
            now: DateTime.now().setZone(zone),
            season: season,
            isDecemberish: DDDUtil.isDecemberish(zone),
            isDecember: DDDUtil.isDecember(zone),
            guaranteed_date: guaranteedDate,
            start_date: startDate,
            stop_date: stopDate,
            guaranteed_in: guaranteedDate.diffNow(),
            starts_in: stopDate.diffNow(),
            stops_in: stopDate.diffNow()
        }
    }

    public static getCurrentSeason(): number {
        return DateTime.now().setZone(DDDUtil.LAST_ZONE).year;
    }

    public static isDecember(zone?: string): boolean {
        const first = DateTime.now().setZone(zone ?? DDDUtil.FIRST_ZONE);
        const last = DateTime.now().setZone(zone ?? DDDUtil.LAST_ZONE);
        return first.month === DDDUtil.MONTH || last.month === DDDUtil.MONTH;
    }

    public static isDecemberish(zone: string): boolean {
        const date = DateTime.now().setZone(zone);
        return date.month === DDDUtil.MONTH && date.day !== 1;
    }

    public static getGuaranteedDate(year: number): DateTime {
        return DateTime.fromObject({ year: year, month: DDDUtil.MONTH, day: 2, hour: 0, minute: 0 }, { zone: DDDUtil.FIRST_ZONE });
    }

    public static geStartDate(year: number, zone?: string): DateTime {
        return DateTime.fromObject({ year: year, month: DDDUtil.MONTH, day: 1, hour: 0, minute: 0 }, { zone: zone ?? DDDUtil.FIRST_ZONE });
    }

    public static getStopDate(year: number, zone?: string): DateTime {
        return DateTime.fromObject({ year: year + 1, month: (DDDUtil.MONTH + 1) % 12 || 12, day: 1, hour: 0, minute: 0 }, { zone: zone ?? DDDUtil.LAST_ZONE });
    }

    public static getNextMidnight(zone: string): DateTime {
        const now = DateTime.now().setZone(zone);
        return DateTime.fromObject({ year: now.year, month: now.month, day: now.day + 1, hour: 0, minute: 0 }, { zone: zone });
    }

    public static getNutsMonth(memberZoneDetails: DDDZoneDetails, allNutRows: DDDNutRow[]): DateTime[][] {
        const nutDates = allNutRows.map(nutRow => DateTime.fromMillis(Number(nutRow.epoch), { zone: memberZoneDetails.zone }));
        const nutCalender = Array.from(Array(31), () => new Array())
        for (const nutDate of nutDates) { nutCalender[nutDate.day - 1]!.push(nutDate) }
        return nutCalender;
    }
}
