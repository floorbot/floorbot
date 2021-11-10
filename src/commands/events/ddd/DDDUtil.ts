import { DateTime, IANAZone } from 'luxon';
import { DDDNutRow, DDDParticipantRow } from './DDDDatabase';

export interface DDDParticipantStats {
    eventDetails: DDDEventDetails,
    zoneDetails: DDDZoneDetails,
    participantRow: DDDParticipantRow,
    allNutRows: DDDNutRow[],
    nutMonth: number[][],
    day: number,
    dayFailed: number
}

export class DDDUtil {

    public static getEventDetails(year?: number): DDDEventDetails {
        return DDDEventDetails.getEventDetails(year);
    }

    public static getZoneDetails(event: DDDEventDetails, zone: string): DDDZoneDetails | null {
        return DDDZoneDetails.getZoneDetails(event, zone);
    }

    public static getParticipantStats(participantRow: DDDParticipantRow, allNutRows: DDDNutRow[]): DDDParticipantStats {
        const eventDetails = DDDUtil.getEventDetails(participantRow.year);
        const zoneDetails = DDDUtil.getZoneDetails(eventDetails, participantRow.zone)!;
        const nutDates = allNutRows.map(nutRow => DateTime.fromMillis(Number(nutRow.epoch), { zone: zoneDetails.zone }));
        const nutMonth = Array.from(Array(31), () => new Array())
        for (const nutDate of nutDates) { nutMonth[nutDate.day - 1]!.push(nutDate) }
        const dayFailed = nutMonth.findIndex((nutDay, index) => nutDay.length < index + 1) + 1;
        const day = zoneDetails.now.day;

        return {
            eventDetails: eventDetails,
            zoneDetails: zoneDetails,
            participantRow: participantRow,
            allNutRows: allNutRows,
            nutMonth: nutMonth,
            day: day,
            dayFailed: dayFailed && dayFailed < day ? dayFailed : 0
        }
    }
}

export class DDDEventDetails {

    public static readonly FIRST_ZONE = 'ETC/GMT-14';
    public static readonly LAST_ZONE = 'ETC/GMT+12';
    public static readonly MONTH = 11; // This is for testing

    public readonly year: number;
    public readonly stopDate: DateTime;
    public readonly startDate: DateTime;
    public readonly guaranteedDate: DateTime;

    protected constructor(year: number) {
        this.year = year;
        this.stopDate = DateTime.fromObject({ year: year + 1, month: (DDDEventDetails.MONTH + 1) % 12 || 12, day: 1, hour: 0, minute: 0 }, { zone: DDDEventDetails.LAST_ZONE });
        this.startDate = DateTime.fromObject({ year: year, month: DDDEventDetails.MONTH, day: 1, hour: 0, minute: 0 }, { zone: DDDEventDetails.FIRST_ZONE });
        this.guaranteedDate = this.startDate.plus({ days: 1 });
    }

    public getZoneDetails(zone: string): DDDZoneDetails | null {
        return DDDZoneDetails.getZoneDetails(this, zone);
    }

    public static getEventDetails(year?: number): DDDEventDetails {
        year = year ?? DateTime.now().setZone(DDDEventDetails.LAST_ZONE).year;
        return new DDDEventDetails(year);
    }
}

export class DDDZoneDetails {

    public readonly event: DDDEventDetails;
    public readonly zone: string;
    public readonly now: DateTime;
    public readonly stopDate: DateTime;
    public readonly startDate: DateTime;
    public readonly cutoffDate: DateTime;

    protected constructor(event: DDDEventDetails, zone: string) {
        this.event = event;
        this.zone = zone;
        this.now = DateTime.now().setZone(this.zone);
        this.stopDate = DateTime.fromObject({ year: event.year + 1, month: (DDDEventDetails.MONTH + 1) % 12 || 12, day: 1, hour: 0, minute: 0 }, { zone: zone });
        this.startDate = DateTime.fromObject({ year: event.year, month: DDDEventDetails.MONTH, day: 1, hour: 0, minute: 0 }, { zone: zone });
        this.cutoffDate = this.startDate.plus({ days: 1 });
    }

    public get isDecember(): boolean {
        const first = DateTime.now().setZone(this.zone);
        const last = DateTime.now().setZone(this.zone);
        return first.month === DDDEventDetails.MONTH || last.month === DDDEventDetails.MONTH;
    }

    public get isDecemberish(): boolean {
        return this.now.month === DDDEventDetails.MONTH && this.now.day !== 1;
    }

    public get nextMidnight(): DateTime {
        if (!this.isDecember) return this.startDate.plus({ days: 1 });
        else return DateTime.fromObject({ year: this.now.year, month: this.now.month, day: this.now.day, hour: 0, minute: 0 }, { zone: this.zone }).plus({ days: 1 });
    }

    public static getZoneDetails(event: DDDEventDetails, zone: string): DDDZoneDetails | null {
        if (!IANAZone.isValidZone(zone)) return null;
        return new DDDZoneDetails(event, zone);
    }
}
