import { AdminSelectMenu } from '../AdminSelectMenu';

export class GroupSelectMenu extends AdminSelectMenu {
    constructor(groups: Array<string>, selected?: string) {
        super('commands');
        this.setPlaceholder('Select a command group')
        this.addOptions(groups.map(group => ({
            label: `${group} Commands`,
            value: JSON.stringify({ group: group }),
            default: group === selected
        })));
    }
}
