import { AttachmentBuilder } from 'discord.js';
import path from 'path';
import fs from 'fs';

export enum AvatarView {
    Full = 1,
    ZoomFace = 2,
    ZoomEyes = 3,
    ZoomRotate = 4
}

export enum AvatarExpression {
    SmileOpen = 1,
    SmileClosed = 2,
    Frown = 3,
    Cheeky = 4,
    Mad = 5,
    Sad = 6,
    SadTears = 7,
    SadTearsBlue = 8
}

export enum FloorbotAvatar {
    FloorbotYap = 'floorbot_yap.gif'
}

export class AttachmentFactory {

    public static avatarExpression({ expression = AvatarExpression.SmileOpen, view = AvatarView.Full }): AttachmentBuilder {
        const buffer = fs.readFileSync(`${path.resolve()}/res/avatars/${view}-${expression}.png`);
        return new AttachmentBuilder(buffer, { name: 'avatar.png' });
    }

    public static avatar({ avatar }: { avatar: FloorbotAvatar; }): AttachmentBuilder {
        const buffer = fs.readFileSync(`${path.resolve()}/res/${avatar}`);
        return new AttachmentBuilder(buffer, { name: avatar });
    }
}
