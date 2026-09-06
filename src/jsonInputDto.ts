import { FormattingActionKind } from "./formattingActionKind";
import { Settings } from "./settings";

export class JsonInputDto {
    xml: string;
    formattingOptions: Settings;
    actionKind: FormattingActionKind;

    constructor(xmlString: string, actionKind: FormattingActionKind, formattingOptions?: Settings) {
        this.xml = xmlString;
        this.actionKind = actionKind;
        this.formattingOptions = formattingOptions ?? new Settings();
    }
}