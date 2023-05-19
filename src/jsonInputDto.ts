import { FormattingActionKind } from "./formattingActionKind";
import { Settings } from "./settings";

export class JsonInputDto {
    xmlString: string;
    formattingOptions: Settings;
    actionKind: FormattingActionKind;

    constructor(xmlString: string, actionKind: FormattingActionKind, formattingOptions?: Settings) {
        this.xmlString = xmlString;
        this.actionKind = actionKind;
        this.formattingOptions = formattingOptions ?? new Settings();
    }
}