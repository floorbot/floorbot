import * as Builders from '@discordjs/builders';

export class ModalBuilder extends Builders.ModalBuilder {

    public addComponent(component: Builders.AnyComponentBuilder): this {
        return this.addComponents(...component);
    }
}
