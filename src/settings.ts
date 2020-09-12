import { type } from 'os';
import { workspace } from 'vscode';



interface ISettings
{
    spacelength?: number;
    singleQuotes?: boolean;
    useSelfCloseTag?: boolean;

}


type SettingsType = {
    spacelength?: number;
    singleQuotes?: boolean;
    useSelfCloseTag?: boolean;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const DefaultSettings: ISettings = {
    spacelength: 2,
    singleQuotes: false,
    useSelfCloseTag: false,
};

export class Settings {
    private options: ISettings;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    constructor(XOptions: ISettings) {
        this.options = { ...DefaultSettings, ...XOptions };
    }

    public printOptions(): void {
        console.log(this.options.spacelength);
        console.log(this.options.singleQuotes);
        console.log(this.options.useSelfCloseTag);
    }
}