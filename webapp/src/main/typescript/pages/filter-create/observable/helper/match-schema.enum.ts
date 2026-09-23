
export function filterSchemaEnumToString(filterSchemaEnum: MatchSchema) {
    switch(filterSchemaEnum) {
        case MatchSchema.MatchAll: return "Alle";
        case MatchSchema.MatchAny: return "Einer";
        case MatchSchema.MatchTypesRegex: return "Regex";
        case MatchSchema.MatchTypesDescriptionRegex: return "Etym. Beschreibung (Regex)";
        case MatchSchema.MatchNamingMotive: return "Namentyp";
        case MatchSchema.MatchLanguageCategory: return "Sprachkategorie";
        case MatchSchema.MatchNot: return "Nicht"
        case MatchSchema.MatchLocation: return "Location";
        case MatchSchema.MatchLayer: return "Layer";
        case MatchSchema.MatchSameTypeAs: return "Gleicher Type wie";
        case MatchSchema.MatchSameLocationAs: return "Gleiche Location wie";
    }
}

export enum MatchSchema {
    MatchAll = "MatchAll",
    MatchAny = "MatchAny",
    MatchTypesRegex = "MatchTypesRegex",
    MatchTypesDescriptionRegex = "MatchTypesDescriptionRegex",
    MatchNamingMotive = "MatchNamingMotive",
    MatchLanguageCategory = "MatchLanguageCategory",
    MatchNot = "MatchNot",
    MatchLocation = "MatchLocation",
    MatchLayer = "MatchLayer",
    MatchSameTypeAs = "MatchSameTypeAs",
    MatchSameLocationAs = "MatchSameLocationAs"
}